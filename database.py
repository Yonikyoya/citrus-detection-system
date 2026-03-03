import sqlite3
from datetime import datetime, timedelta
DB_NAME = "citrus.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_name TEXT,
            class_name TEXT,
            maturity INTEGER,
            days INTEGER,
            sugar REAL,
            suggestion TEXT,
            detect_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def insert_detection(filename, class_name, maturity, days, sugar, suggestion):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        INSERT INTO detections 
        (image_name, class_name, maturity, days, sugar, suggestion)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (filename, class_name, maturity, days, sugar, suggestion))
    conn.commit()
    conn.close()

def get_stats():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM detections")
    total = c.fetchone()[0]
    c.execute("SELECT AVG(maturity) FROM detections")
    avg_maturity = c.fetchone()[0] or 0
    c.execute("SELECT COUNT(*) FROM detections WHERE maturity >= 80")
    ripe_count = c.fetchone()[0]
    conn.close()
    ripe_rate = round((ripe_count / total) * 100, 1) if total > 0 else 0
    return {
        "total": total,
        "avg_maturity": round(avg_maturity, 1),
        "ripe_rate": ripe_rate
    }

def get_history(limit=5):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        SELECT detect_time, image_name, maturity, sugar, suggestion, class_name
        FROM detections
        ORDER BY detect_time DESC
        LIMIT ?
    ''', (limit,))
    rows = c.fetchall()
    conn.close()
    return rows

# ========== 新增功能：筛选、分页、删除 ==========

def query_records_with_filters(page, page_size, image_name="", maturity="", start_date="", end_date=""):
    """
    分页查询符合条件的记录
    返回: {
        "total": 总记录数,
        "page": 当前页,
        "pageSize": 每页大小,
        "data": [ {id, time, image, maturity, sugar, suggestion, class}, ... ]
    }
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # 使查询结果可以用列名访问
    cursor = conn.cursor()

    # 基础SQL（WHERE 1=1 便于动态拼接）
    base_sql = "FROM detections WHERE 1=1"
    params = []

    # 图片名称模糊查询
    if image_name:
        base_sql += " AND image_name LIKE ?"
        params.append(f"%{image_name}%")

    # 成熟度分类映射
    if maturity:
        if maturity == "unripe":
            base_sql += " AND class_name = 'unripe_orange'"
        elif maturity == "ripe":
            base_sql += " AND class_name = 'ripe_orange'"
        elif maturity == "overripe":
            # 过熟/腐烂：包括腐烂和成熟度很高的果实（可根据需要调整）
            base_sql += " AND (class_name = 'rotten_orange' OR maturity > 90)"
        # 可添加其他分类

    # 日期范围筛选
    if start_date:
        base_sql += " AND date(detect_time) >= ?"
        params.append(start_date)
    if end_date:
        base_sql += " AND date(detect_time) <= ?"
        params.append(end_date)

    # 查询总记录数
    count_sql = f"SELECT COUNT(*) {base_sql}"
    cursor.execute(count_sql, params)
    total = cursor.fetchone()[0]

    # 分页查询数据
    data_sql = f"""
        SELECT id, detect_time as time, image_name as image, 
               maturity, sugar, suggestion, class_name as class
        {base_sql}
        ORDER BY detect_time DESC
        LIMIT ? OFFSET ?
    """
    data_params = params + [page_size, (page - 1) * page_size]
    cursor.execute(data_sql, data_params)
    rows = cursor.fetchall()
    conn.close()

    # 转换为字典列表
    data = [dict(row) for row in rows]
    return {
        "total": total,
        "page": page,
        "pageSize": page_size,
        "data": data
    }

def query_all_records_with_filters(image_name="", maturity="", start_date="", end_date=""):
    """
    导出所有符合筛选条件的记录（不分页）
    返回: 列表，每个元素为 {time, image, maturity, sugar, suggestion, class}
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    base_sql = "FROM detections WHERE 1=1"
    params = []

    if image_name:
        base_sql += " AND image_name LIKE ?"
        params.append(f"%{image_name}%")
    if maturity:
        if maturity == "unripe":
            base_sql += " AND class_name = 'unripe_orange'"
        elif maturity == "ripe":
            base_sql += " AND class_name = 'ripe_orange'"
        elif maturity == "overripe":
            base_sql += " AND (class_name = 'rotten_orange' OR maturity > 90)"
    if start_date:
        base_sql += " AND date(detect_time) >= ?"
        params.append(start_date)
    if end_date:
        base_sql += " AND date(detect_time) <= ?"
        params.append(end_date)

    sql = f"""
        SELECT detect_time as time, image_name as image, 
               maturity, sugar, suggestion, class_name as class
        {base_sql}
        ORDER BY detect_time DESC
    """
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def delete_detection_by_id(record_id):
    """根据ID删除记录，返回是否成功"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM detections WHERE id = ?", (record_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0

def get_dashboard_stats():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # 今日检测数
    c.execute("SELECT COUNT(*) FROM detections WHERE date(detect_time) = date('now')")
    today_count = c.fetchone()[0]

    # 总记录数
    c.execute("SELECT COUNT(*) FROM detections")
    total = c.fetchone()[0]

    # 成熟果数量 (可根据业务调整：class='ripe_orange' 或 maturity>=80)
    c.execute("SELECT COUNT(*) FROM detections WHERE class_name = 'ripe_orange' OR maturity >= 80")
    ripe_count = c.fetchone()[0]
    ripe_rate = round((ripe_count / total) * 100, 1) if total else 0

    # 腐烂数量
    c.execute("SELECT COUNT(*) FROM detections WHERE class_name = 'rotten_orange'")
    rotten_count = c.fetchone()[0]
    rotten_rate = round((rotten_count / total) * 100, 1) if total else 0

    # 平均糖度
    c.execute("SELECT AVG(sugar) FROM detections")
    avg_sugar = round(c.fetchone()[0] or 0, 1)

    # 近7天趋势（最近7天每天的成熟度平均值）
    trend_dates = []
    trend_values = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime('%m-%d')
        date_str = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        c.execute('''
            SELECT AVG(maturity) FROM detections 
            WHERE date(detect_time) = ?
        ''', (date_str,))
        avg = c.fetchone()[0] or 0
        trend_dates.append(day)
        trend_values.append(round(avg, 1))

    conn.close()
    return {
        "today_count": today_count,
        "ripe_rate": ripe_rate,
        "rotten_rate": rotten_rate,
        "avg_sugar": avg_sugar,
        "trend_dates": trend_dates,
        "trend_values": trend_values
    }