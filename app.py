import os
import uuid
import cv2
import numpy as np
import io
import csv

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from ultralytics import YOLO

from database import (
    init_db, insert_detection, get_stats, get_history,
    query_records_with_filters, query_all_records_with_filters,
    delete_detection_by_id, get_dashboard_stats
)

# ==========================
# 初始化 Flask
# ==========================
app = Flask(__name__)
CORS(app)

# ==========================
# 初始化数据库
# ==========================
init_db()

# ==========================
# 加载模型
# ==========================
model = YOLO("runs/detect/train5/weights/best.pt")
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==========================
# 业务逻辑函数
# ==========================
def get_maturity_info(class_name):
    if class_name == "unripe_orange":
        return 40, 5, "预计 5 天后成熟，建议继续生长"
    elif class_name == "ripe_orange":
        return 90, 0, "已成熟，建议立即采摘"
    elif class_name == "rotten_orange":
        return 10, -3, "果实已腐烂，不建议采摘"
    return 0, 0, "未知状态"

def analyze_color_maturity(image, box):
    x1, y1, x2, y2 = map(int, box.xyxy[0])
    fruit = image[y1:y2, x1:x2]
    hsv = cv2.cvtColor(fruit, cv2.COLOR_BGR2HSV)
    h_mean = hsv[:, :, 0].mean()
    if h_mean > 60:
        return "偏青", 40
    elif 35 < h_mean <= 60:
        return "转色中", 70
    else:
        return "橙色成熟", 90

def estimate_diameter(box):
    x1, y1, x2, y2 = map(int, box.xyxy[0])
    pixel_width = x2 - x1
    diameter_cm = round(pixel_width * 0.06, 1)
    return diameter_cm

def predict_sugar_content(maturity):
    return round(8 + maturity * 0.08, 1)

# ==========================
# 路由
# ==========================
@app.route("/detect", methods=["POST"])
def detect():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    filename = str(uuid.uuid4()) + ".jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    results = model(filepath)
    result = results[0]
    orig_img = result.orig_img
    boxes = result.boxes

    if len(boxes) == 0:
        return jsonify({"error": "未检测到柑橘"}), 200

    best_box = max(boxes, key=lambda b: float(b.conf[0]))
    class_id = int(best_box.cls[0])
    class_name = model.names[class_id]

    color_desc, color_maturity = analyze_color_maturity(orig_img, best_box)
    diameter = estimate_diameter(best_box)
    sugar = predict_sugar_content(color_maturity)
    maturity, days, suggestion = get_maturity_info(class_name)

    insert_detection(filename, class_name, maturity, days, sugar, suggestion)

    return jsonify({
        "class": class_name,
        "maturity": maturity,
        "days": days,
        "suggestion": suggestion,
        "color": color_desc,
        "diameter": diameter,
        "sugar": sugar
    })

@app.route("/stats")
def stats():
    return jsonify(get_stats())

@app.route("/history")
def history():
    records = get_history()
    history_list = []
    for r in records:
        history_list.append({
            "time": r[0],
            "image": r[1],
            "maturity": r[2],
            "sugar": r[3],
            "suggestion": r[4],
            "class": r[5]
        })
    return jsonify(history_list)

# ---------- 新增路由 ----------
@app.route("/api/records", methods=["GET"])
def get_api_records():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("pageSize", 5))
    image_name = request.args.get("imageName", "")
    maturity = request.args.get("maturity", "")
    start_date = request.args.get("startDate", "")
    end_date = request.args.get("endDate", "")
    result = query_records_with_filters(
        page=page,
        page_size=page_size,
        image_name=image_name,
        maturity=maturity,
        start_date=start_date,
        end_date=end_date
    )
    return jsonify(result)

@app.route("/record/<int:record_id>", methods=["DELETE"])
def delete_record(record_id):
    success = delete_detection_by_id(record_id)
    if success:
        return '', 200
    else:
        return jsonify({"error": "记录不存在"}), 404

@app.route("/api/records/export", methods=["GET"])
def export_records():
    image_name = request.args.get("imageName", "")
    maturity = request.args.get("maturity", "")
    start_date = request.args.get("startDate", "")
    end_date = request.args.get("endDate", "")
    records = query_all_records_with_filters(
        image_name=image_name,
        maturity=maturity,
        start_date=start_date,
        end_date=end_date
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["时间", "图像名称", "成熟度(%)", "糖度(°Brix)", "建议", "类别"])
    for r in records:
        writer.writerow([r["time"], r["image"], r["maturity"], r["sugar"], r["suggestion"], r["class"]])
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f"records_{start_date}_{end_date}.csv"
    )

# ---------- 首页仪表盘接口 ----------
@app.route("/dashboard")
def dashboard():
    return jsonify(get_dashboard_stats())

# ==========================
# 启动
# ==========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)