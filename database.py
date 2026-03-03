import sqlite3
import os
from datetime import datetime, timedelta

def get_db_name():
    return os.environ.get("CITRUS_DB_PATH", "citrus.db")

def _connect(row_factory=None):
    db_path = get_db_name()
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=10)
    if row_factory is not None:
        conn.row_factory = row_factory
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA busy_timeout = 5000")
    return conn

def init_db():
    conn = _connect()
    c = conn.cursor()
        
    # 1. 果园表
    c.execute('''
        CREATE TABLE IF NOT EXISTS orchards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT,
            owner_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 2. 用户表 (增加更多详细字段)
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            nickname TEXT,
            avatar TEXT,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'worker',
            status INTEGER DEFAULT 1,  -- 1: enabled, 0: disabled
            orchard_id INTEGER,
            login_attempts INTEGER DEFAULT 0,
            locked_until TIMESTAMP,
            last_login_at TIMESTAMP,
            last_login_ip TEXT,
            last_login_device TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (orchard_id) REFERENCES orchards (id) ON DELETE SET NULL
        )
    ''')
    
    # 3. 验证码表
    c.execute('''
        CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target TEXT NOT NULL, -- email or phone
            code TEXT NOT NULL,
            type TEXT NOT NULL, -- 'register', 'reset_password', 'email_change'
            expired_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 4. 审计日志表
    c.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            target_id INTEGER,
            details TEXT,
            ip TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # 5. 登录日志表
    c.execute('''
        CREATE TABLE IF NOT EXISTS login_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ip TEXT,
            device TEXT,
            status TEXT, -- 'success', 'failed'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # 3. 检测记录表 (增加 user_id)
    c.execute('''
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            image_name TEXT,
            class_name TEXT,
            maturity REAL,
            days INTEGER,
            sugar REAL,
            suggestion TEXT,
            detect_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # 4. 聊天历史表 (增加 user_id)
    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_id TEXT,
            role TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
        
    conn.commit()
        
    # 简单的迁移：检查表结构
    def add_column_if_not_exists(table, column, definition):
        c.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in c.fetchall()]
    
        if column not in columns:
            # 1. 检查定义中是否有 UNIQUE
            is_unique = "UNIQUE" in definition.upper()
            # 2. 移除定义中的 UNIQUE 关键字以安全添加列
            clean_definition = definition.upper().replace("UNIQUE", "").strip()
    
            c.execute(f"ALTER TABLE {table} ADD COLUMN {column} {clean_definition}")
    
            # 3. 如果原本要求唯一，则创建一个唯一索引
            if is_unique:
                c.execute(f"CREATE UNIQUE INDEX IF NOT EXISTS idx_{table}_{column} ON {table}({column})")
    
            conn.commit()
    
    add_column_if_not_exists("users", "email", "TEXT UNIQUE")
    add_column_if_not_exists("users", "phone", "TEXT UNIQUE")
    add_column_if_not_exists("users", "nickname", "TEXT")
    add_column_if_not_exists("users", "avatar", "TEXT")
    add_column_if_not_exists("users", "status", "INTEGER DEFAULT 1")
    add_column_if_not_exists("users", "login_attempts", "INTEGER DEFAULT 0")
    add_column_if_not_exists("users", "locked_until", "TIMESTAMP")
    add_column_if_not_exists("users", "last_login_at", "TIMESTAMP")
    add_column_if_not_exists("users", "last_login_ip", "TEXT")
    add_column_if_not_exists("users", "last_login_device", "TEXT")
    
    add_column_if_not_exists("detections", "user_id", "INTEGER REFERENCES users(id)")
    add_column_if_not_exists("chat_history", "user_id", "INTEGER REFERENCES users(id)")
    
    conn.commit()
    conn.close()

def insert_detection(user_id, filename, class_name, maturity, days, sugar, suggestion):
    conn = _connect()
    c = conn.cursor()
    c.execute('''
        INSERT INTO detections 
        (user_id, image_name, class_name, maturity, days, sugar, suggestion)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, filename, class_name, maturity, days, sugar, suggestion))
    conn.commit()
    conn.close()

def get_stats(user_id):
    conn = _connect()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM detections WHERE user_id = ?", (user_id,))
    total = c.fetchone()[0]
    c.execute("SELECT AVG(maturity) FROM detections WHERE user_id = ?", (user_id,))
    avg_maturity = c.fetchone()[0] or 0
    c.execute("SELECT COUNT(*) FROM detections WHERE maturity >= 80 AND user_id = ?", (user_id,))
    ripe_count = c.fetchone()[0]
    conn.close()
    ripe_rate = round((ripe_count / total) * 100, 1) if total > 0 else 0
    return {
        "total": total,
        "avg_maturity": round(avg_maturity, 1),
        "ripe_rate": ripe_rate
    }

def get_history(user_id, limit=5):
    conn = _connect()
    c = conn.cursor()
    c.execute('''
        SELECT id, detect_time, image_name, maturity, sugar, suggestion, class_name
        FROM detections
        WHERE user_id = ?
        ORDER BY detect_time DESC
        LIMIT ?
    ''', (user_id, limit))
    rows = c.fetchall()
    conn.close()
    return rows

def get_detection_by_id(record_id, user_id):
    conn = _connect(row_factory=sqlite3.Row)
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, detect_time as time, image_name as image,
               maturity, days, sugar, suggestion, class_name as class
        FROM detections
        WHERE id = ? AND user_id = ?
        """,
        (record_id, user_id),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# ========== 筛选、分页、删除 (增加 user_id) ==========

def query_records_with_filters(user_id, page, page_size, image_name="", maturity="", start_date="", end_date=""):
    conn = _connect(row_factory=sqlite3.Row)
    cursor = conn.cursor()

    # 强制加上 user_id
    base_sql = "FROM detections WHERE user_id = ?"
    params = [user_id]

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

    count_sql = f"SELECT COUNT(*) {base_sql}"
    cursor.execute(count_sql, params)
    total = cursor.fetchone()[0]

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

    data = [dict(row) for row in rows]
    return {
        "total": total,
        "page": page,
        "pageSize": page_size,
        "data": data
    }

def query_all_records_with_filters(user_id, image_name="", maturity="", start_date="", end_date=""):
    conn = _connect(row_factory=sqlite3.Row)
    cursor = conn.cursor()

    base_sql = "FROM detections WHERE user_id = ?"
    params = [user_id]

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

def insert_chat_message(user_id, session_id, role, content):
    conn = _connect()
    c = conn.cursor()
    c.execute('''
        INSERT INTO chat_history (user_id, session_id, role, content)
        VALUES (?, ?, ?, ?)
    ''', (user_id, session_id, role, content))
    conn.commit()
    conn.close()

def get_chat_context(user_id, session_id, limit=10):
    conn = _connect(row_factory=sqlite3.Row)
    c = conn.cursor()
    c.execute('''
        SELECT role, content FROM chat_history
        WHERE user_id = ? AND session_id = ?
        ORDER BY created_at ASC
        LIMIT ?
    ''', (user_id, session_id, limit))
    rows = c.fetchall()
    conn.close()
    return [{"role": r["role"], "content": r["content"]} for r in rows]

def clear_chat_history(user_id, session_id):
    conn = _connect()
    c = conn.cursor()
    c.execute('DELETE FROM chat_history WHERE user_id = ? AND session_id = ?', (user_id, session_id))
    conn.commit()
    conn.close()

def delete_detection_by_id(record_id, user_id):
    conn = _connect()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM detections WHERE id = ? AND user_id = ?", (record_id, user_id))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0

def get_dashboard_stats(user_id):
    conn = _connect()
    c = conn.cursor()

    # 今日检测数
    c.execute("SELECT COUNT(*) FROM detections WHERE user_id = ? AND date(detect_time) = date('now')", (user_id,))
    today_count = c.fetchone()[0]

    # 总记录数
    c.execute("SELECT COUNT(*) FROM detections WHERE user_id = ?", (user_id,))
    total = c.fetchone()[0]

    # 成熟果数量
    c.execute("SELECT COUNT(*) FROM detections WHERE user_id = ? AND (class_name = 'ripe_orange' OR maturity >= 80)", (user_id,))
    ripe_count = c.fetchone()[0]
    ripe_rate = round((ripe_count / total) * 100, 1) if total else 0

    # 腐烂数量
    c.execute("SELECT COUNT(*) FROM detections WHERE user_id = ? AND class_name = 'rotten_orange'", (user_id,))
    rotten_count = c.fetchone()[0]
    rotten_rate = round((rotten_count / total) * 100, 1) if total else 0

    # 平均糖度
    c.execute("SELECT AVG(sugar) FROM detections WHERE user_id = ?", (user_id,))
    avg_sugar = round(c.fetchone()[0] or 0, 1)

    # 近7天趋势
    trend_dates = []
    trend_values = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime('%m-%d')
        date_str = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        c.execute('''
            SELECT AVG(maturity) FROM detections 
            WHERE user_id = ? AND date(detect_time) = ?
        ''', (user_id, date_str))
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

# ========== 用户管理相关接口 ==========

def create_user(username, password_hash, role='worker', orchard_id=None, email=None, phone=None, nickname=None):
    conn = _connect()
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO users (username, password_hash, role, orchard_id, email, phone, nickname)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (username, password_hash, role, orchard_id, email, phone, nickname))
        conn.commit()
        return c.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_username_or_email(login_str):
    conn = _connect(row_factory=sqlite3.Row)
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE username = ? OR email = ?', (login_str, login_str))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_email(email):
    conn = _connect(row_factory=sqlite3.Row)
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE email = ?', (email,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def increment_login_attempts(user_id):
    conn = _connect()
    c = conn.cursor()
    c.execute('''
        UPDATE users 
        SET login_attempts = login_attempts + 1 
        WHERE id = ?
    ''', (user_id,))
    conn.commit()
    conn.close()

def reset_login_attempts(user_id):
    conn = _connect()
    c = conn.cursor()
    c.execute('''
        UPDATE users 
        SET login_attempts = 0, locked_until = NULL 
        WHERE id = ?
    ''', (user_id,))
    conn.commit()
    conn.close()

def lock_user(user_id, minutes=30):
    conn = _connect()
    c = conn.cursor()
    lock_time = (datetime.now() + timedelta(minutes=minutes)).strftime('%Y-%m-%d %H:%M:%S')
    c.execute('''
        UPDATE users 
        SET locked_until = ? 
        WHERE id = ?
    ''', (lock_time, user_id))
    conn.commit()
    conn.close()

def log_login(user_id, ip, device, status):
    conn = _connect()
    c = conn.cursor()
    c.execute('''
        INSERT INTO login_logs (user_id, ip, device, status)
        VALUES (?, ?, ?, ?)
    ''', (user_id, ip, device, status))
    if status == 'success':
        c.execute('''
            UPDATE users 
            SET last_login_at = CURRENT_TIMESTAMP, 
                last_login_ip = ?, 
                last_login_device = ? 
            WHERE id = ?
        ''', (ip, device, user_id))
    conn.commit()
    conn.close()

def log_audit(user_id, action, target_id=None, details=None, ip=None):
    conn = _connect()
    c = conn.cursor()
    c.execute('''
        INSERT INTO audit_logs (user_id, action, target_id, details, ip)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, action, target_id, details, ip))
    conn.commit()
    conn.close()

def create_verification_code(target, code, type_str, expire_minutes=10):
    conn = _connect()
    c = conn.cursor()
    expired_at = (datetime.now() + timedelta(minutes=expire_minutes)).strftime('%Y-%m-%d %H:%M:%S')
    c.execute('''
        INSERT INTO verification_codes (target, code, type, expired_at)
        VALUES (?, ?, ?, ?)
    ''', (target, code, type_str, expired_at))
    conn.commit()
    conn.close()

def verify_verification_code(target, code, type_str):
    conn = _connect()
    c = conn.cursor()
    c.execute('''
        SELECT id FROM verification_codes 
        WHERE target = ? AND code = ? AND type = ? AND expired_at > CURRENT_TIMESTAMP
        ORDER BY created_at DESC LIMIT 1
    ''', (target, code, type_str))
    row = c.fetchone()
    if row:
        c.execute('DELETE FROM verification_codes WHERE id = ?', (row[0],))
        conn.commit()
        conn.close()
        return True
    conn.close()
    return False

def get_users_paged(page=1, page_size=20, search=""):
    conn = _connect(row_factory=sqlite3.Row)
    c = conn.cursor()
    offset = (page - 1) * page_size
    query = 'SELECT id, username, email, role, status, nickname, created_at FROM users'
    params = []
    if search:
        query += ' WHERE username LIKE ? OR email LIKE ? OR nickname LIKE ?'
        params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
    
    # Count total
    count_query = f"SELECT COUNT(*) FROM ({query})"
    c.execute(count_query, params)
    total = c.fetchone()[0]
    
    # Get data
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.extend([page_size, offset])
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "users": [dict(r) for r in rows]
    }

def update_user_status(user_id, status):
    conn = _connect()
    c = conn.cursor()
    c.execute('UPDATE users SET status = ? WHERE id = ?', (status, user_id))
    conn.commit()
    conn.close()

def update_user_profile(user_id, **kwargs):
    conn = _connect()
    c = conn.cursor()
    allowed_fields = ['nickname', 'email', 'phone', 'avatar', 'role']
    updates = []
    params = []
    for k, v in kwargs.items():
        if k in allowed_fields:
            updates.append(f"{k} = ?")
            params.append(v)
    if updates:
        params.append(user_id)
        c.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()
    conn.close()

def get_user_by_username(username):
    conn = _connect(row_factory=sqlite3.Row)
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id):
    conn = _connect(row_factory=sqlite3.Row)
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def create_orchard(name, location, owner_id):
    conn = _connect()
    c = conn.cursor()
    c.execute('''
        INSERT INTO orchards (name, location, owner_id)
        VALUES (?, ?, ?)
    ''', (name, location, owner_id))
    orchard_id = c.lastrowid
    # 更新所有者的 orchard_id
    c.execute('UPDATE users SET orchard_id = ? WHERE id = ?', (orchard_id, owner_id))
    conn.commit()
    conn.close()
    return orchard_id

def get_orchard_by_id(orchard_id):
    conn = _connect(row_factory=sqlite3.Row)
    c = conn.cursor()
    c.execute('SELECT * FROM orchards WHERE id = ?', (orchard_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None

def get_users_by_orchard(orchard_id):
    conn = _connect(row_factory=sqlite3.Row)
    c = conn.cursor()
    c.execute('SELECT id, username, role, created_at FROM users WHERE orchard_id = ?', (orchard_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

