import os
import uuid
<<<<<<< HEAD
import io
import csv
import logging
import time
import asyncio
import random
import secrets
import re
from datetime import datetime

from flask import Flask, request, jsonify, send_file, redirect, send_from_directory, session, g, render_template
from flask_cors import CORS
=======
import cv2
import numpy as np
import io
import csv

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from ultralytics import YOLO
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad

from database import (
    init_db, insert_detection, get_stats, get_history,
    query_records_with_filters, query_all_records_with_filters,
<<<<<<< HEAD
    delete_detection_by_id, get_dashboard_stats, get_detection_by_id,
    insert_chat_message, get_chat_context, clear_chat_history,
    create_user, get_user_by_username, create_orchard, get_users_by_orchard, get_orchard_by_id,
    get_user_by_id, get_user_by_email, get_user_by_username_or_email,
    create_verification_code, verify_verification_code, log_login, log_audit,
    increment_login_attempts, reset_login_attempts, lock_user,
    get_users_paged, update_user_status, update_user_profile
)
from maturity import maturity_from_hue_cv
from ai_chat import ai_handler
from auth import generate_token, login_required, roles_required, hash_password, check_password, generate_verification_code

# ==========================
# 校验工具
# ==========================
def validate_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def validate_password(password):
    # 至少 8 位，包含字母和数字
    return len(password) >= 8 and any(c.isalpha() for c in password) and any(c.isdigit() for c in password)

def send_mock_email(to, subject, body):
    log_file = "email_logs.txt"
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"[{datetime.now()}] To: {to} | Subject: {subject} | Body: {body}\n")
    logging.info(f"Mock email sent to {to} (logged to {log_file})")
=======
    delete_detection_by_id, get_dashboard_stats
)
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad

# ==========================
# 初始化 Flask
# ==========================
<<<<<<< HEAD
app = Flask(__name__, template_folder='.')
app.secret_key = secrets.token_hex(16)
CORS(app, supports_credentials=True)
logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO").upper())

# ==========================
# 全局错误处理（确保返回 JSON）
# ==========================
@app.errorhandler(Exception)
def handle_exception(e):
    """全局异常处理器，确保所有错误都返回 JSON"""
    import traceback
    error_msg = f"服务器内部错误：{str(e)}"
    stack_trace = traceback.format_exc()
    logging.error(f"未捕获的异常：{error_msg}\n{stack_trace}")
    
    return jsonify({
        "success": False,
        "message": error_msg,
        "type": type(e).__name__
    }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"success": False, "message": "资源不存在"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"success": False, "message": "服务器内部错误"}), 500
=======
app = Flask(__name__)
CORS(app)
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad

# ==========================
# 初始化数据库
# ==========================
init_db()

# ==========================
# 加载模型
# ==========================
<<<<<<< HEAD
_model = None
MODEL_PATH = os.environ.get("MODEL_PATH", "yolov10n.pt")
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        _model = YOLO(MODEL_PATH)
    return _model


def get_quality_metrics(bgr_img):
    import cv2
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    blur_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())
    contrast = float(gray.std())
    return {
        "blur_var": round(blur_var, 3),
        "brightness": round(brightness, 3),
        "contrast": round(contrast, 3),
    }


def require_auth():
    expected = os.environ.get("AUTH_TOKEN")
    if not expected:
        return None
    auth = request.headers.get("Authorization", "")
    if auth == f"Bearer {expected}":
        return None
    return jsonify({"success": False, "code": "FORBIDDEN", "message": "无权限"}), 403

# ==========================
# 路由 - 页面渲染
# ==========================
@app.route("/")
def index():
    return redirect("/login")

@app.route("/favicon.ico")
def favicon():
    """返回空的 favicon，避免 404"""
    return '', 204

@app.route("/login")
def login_page():
    return render_template("login.html")

@app.route("/register")
def register_page():
    return render_template("register.html")

@app.route("/dashboard")
@login_required
def dashboard_page():
    return render_template("index.html")

@app.route("/detect")
@login_required
def detect_page():
    return render_template("detect.html")

@app.route("/data")
@login_required
def data_page():
    return render_template("data.html")

@app.route("/analysis")
@login_required
def analysis_page():
    return render_template("analysis.html")

@app.route("/warning")
@login_required
def warning_page():
    return render_template("warning.html")

@app.route("/about")
@login_required
def about_page():
    return render_template("about.html")

@app.route("/detection_detail")
@login_required
def detection_detail_page():
    return render_template("detection_detail.html")

# ==========================
# 认证路由
# ==========================
@app.route("/api/auth/send-code", methods=["POST"])
def send_verification_code():
    data = request.get_json()
    email = data.get("email")
    type_str = data.get("type", "register")
    
    if not email or not validate_email(email):
        return jsonify({"success": False, "message": "无效的邮箱地址"}), 400
    
    if type_str == "register" and get_user_by_email(email):
        return jsonify({"success": False, "message": "邮箱已被注册"}), 400
    
    code = generate_verification_code()
    create_verification_code(email, code, type_str)
    
    send_mock_email(email, f"验证码 - {type_str}", f"您的验证码是: {code}，10分钟内有效。")
    return jsonify({"success": True, "message": "验证码已发送"})

@app.route("/api/auth/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "无效的请求数据"}), 400
            
        username = data.get("username")
        password = data.get("password")
        confirm_password = data.get("confirm_password")
        role = data.get("role", "worker")
        orchard_name = data.get("orchard_name")
        
        print(f"[注册] 收到请求 - username: {username}, role: {role}")

        # 1. 基本校验
        if not all([username, password, confirm_password]):
            return jsonify({"success": False, "message": "用户名和密码均为必填"}), 400
        
        if password != confirm_password:
            return jsonify({"success": False, "message": "两次输入的密码不一致"}), 400
        
        if not validate_password(password):
            return jsonify({"success": False, "message": "密码长度至少 8 位，且包含字母和数字"}), 400

        # 2. 唯一性校验
        existing_user = get_user_by_username(username)
        if existing_user:
            print(f"[注册] 用户名已存在：{username}")
            return jsonify({"success": False, "message": "用户名已存在"}), 400

        # 3. 存储
        print(f"[注册] 开始创建用户：{username}")
        password_hash = hash_password(password)
        user_id = create_user(username, password_hash, role)
        
        if user_id:
            print(f"[注册] 用户创建成功，ID: {user_id}")
            if role == "owner" and orchard_name:
                create_orchard(orchard_name, data.get("location", ""), user_id)
            
            return jsonify({
                "success": True, 
                "message": "注册成功", 
                "user_id": user_id
            }), 201
        else:
            print(f"[注册] 用户创建失败：{username}")
            return jsonify({"success": False, "message": "注册失败，请稍后再试"}), 500
    except Exception as e:
        print(f"[注册] 发生异常：{str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": f"服务器内部错误：{str(e)}"}), 500

@app.route("/api/auth/captcha", methods=["GET"])
def get_captcha():
    """生成一个简单的算术验证码"""
    a = random.randint(1, 10)
    b = random.randint(1, 10)
    op = random.choice(['+', '-', '*'])
    if op == '+':
        ans = a + b
    elif op == '-':
        ans = a - b
    else:
        ans = a * b
    
    captcha_id = str(uuid.uuid4())
    # 存入 session 或专门的 captcha 缓存 (这里简化存入 session)
    if 'captchas' not in session:
        session['captchas'] = {}
    session['captchas'][captcha_id] = str(ans)
    session.modified = True
    
    return jsonify({
        "captcha_id": captcha_id,
        "question": f"{a} {op} {b} = ?"
    })

def verify_captcha(captcha_id, answer):
    if 'captchas' not in session:
        return False
    correct = session['captchas'].get(captcha_id)
    if correct == str(answer):
        # 验证后立即删除，防止重用
        del session['captchas'][captcha_id]
        session.modified = True
        return True
    return False

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    login_str = data.get("username")
    password = data.get("password")
    captcha_id = data.get("captcha_id")
    captcha_answer = data.get("captcha_answer")
    remember_me = data.get("remember_me", False)
    
    # 验证验证码
    if not verify_captcha(captcha_id, captcha_answer):
        return jsonify({"success": False, "message": "验证码错误"}), 400
    
    ip = request.remote_addr
    device = request.headers.get("User-Agent", "unknown")
    
    user = get_user_by_username_or_email(login_str)
    
    # 1. 用户不存在
    if not user:
        return jsonify({"success": False, "message": "用户名或密码错误"}), 401
    
    # 2. 检查账户状态
    if user.get("status") == 0:
        return jsonify({"success": False, "message": "账户已被禁用，请联系管理员"}), 403
    
    # 3. 检查锁定状态
    locked_until = user.get("locked_until")
    if locked_until:
        locked_dt = datetime.strptime(locked_until, '%Y-%m-%d %H:%M:%S')
        if datetime.now() < locked_dt:
            return jsonify({"success": False, "message": f"账户因多次登录失败被锁定，请在 {locked_until} 后重试"}), 403
        else:
            reset_login_attempts(user["id"])

    # 4. 密码校验
    if not check_password(password, user["password_hash"]):
        increment_login_attempts(user["id"])
        log_login(user["id"], ip, device, 'failed')
        
        # 尝试次数超过 5 次锁定
        if user.get("login_attempts", 0) + 1 >= 5:
            lock_user(user["id"])
            return jsonify({"success": False, "message": "登录失败次数过多，账户已被锁定 30 分钟"}), 403
            
        return jsonify({"success": False, "message": "用户名或密码错误"}), 401
    
    # 5. 成功登录
    reset_login_attempts(user["id"])
    log_login(user["id"], ip, device, 'success')
    
    # 颁发 Token
    exp_hours = 24 * 7 if remember_me else 24
    token = generate_token(user["id"], user["role"])
    
    print(f"[登录成功] user_id={user['id']}, username={user['username']}, token={token[:50]}...")
    
    # 创建响应并设置 Cookie
    from flask import make_response
    response = make_response(jsonify({
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "orchard_id": user["orchard_id"],
            "email": user["email"],
            "nickname": user["nickname"]
        }
    }))
    
    # 设置 Cookie（7 天有效期）
    response.set_cookie(
        'token',
        token,
        max_age=7 * 24 * 60 * 60,  # 7 天
        httponly=True,
        samesite='lax'
    )
    
    return response

@app.route("/api/user/me", methods=["GET"])
@login_required
def get_me():
    user = get_user_by_id(g.user_id)
    if not user:
        return jsonify({"success": False, "message": "用户不存在"}), 404
    
    # 不返回敏感信息
    del user["password_hash"]
    return jsonify({"success": True, "data": user})

=======
model = YOLO("runs/detect/train5/weights/best.pt")
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
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
<<<<<<< HEAD
    import cv2
=======
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
    x1, y1, x2, y2 = map(int, box.xyxy[0])
    fruit = image[y1:y2, x1:x2]
    hsv = cv2.cvtColor(fruit, cv2.COLOR_BGR2HSV)
    h_mean = hsv[:, :, 0].mean()
<<<<<<< HEAD
    cm = maturity_from_hue_cv(h_mean)
    return cm.label, cm.maturity, cm.hue_cv
=======
    if h_mean > 60:
        return "偏青", 40
    elif 35 < h_mean <= 60:
        return "转色中", 70
    else:
        return "橙色成熟", 90
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad

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
<<<<<<< HEAD
@login_required
=======
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
def detect():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    filename = str(uuid.uuid4()) + ".jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

<<<<<<< HEAD
    model = get_model()
=======
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
    results = model(filepath)
    result = results[0]
    orig_img = result.orig_img
    boxes = result.boxes

    if len(boxes) == 0:
<<<<<<< HEAD
        q = None
        msg = "未检测到柑橘"
        try:
            q = get_quality_metrics(orig_img)
            if q["blur_var"] < 60 or q["brightness"] < 45:
                msg = "图像不清晰，请重新上传"
        except Exception:
            logging.exception("quality_metrics_failed")
        payload = {"error": msg}
        if request.args.get("debug") == "1":
            payload["_debug"] = {"quality": q}
        logging.info("detect_no_object msg=%s quality=%s", msg, q)
        return jsonify(payload), 200
=======
        return jsonify({"error": "未检测到柑橘"}), 200
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad

    best_box = max(boxes, key=lambda b: float(b.conf[0]))
    class_id = int(best_box.cls[0])
    class_name = model.names[class_id]
<<<<<<< HEAD
    conf = float(best_box.conf[0])

    color_desc, color_maturity, hue_cv = analyze_color_maturity(orig_img, best_box)
    diameter = estimate_diameter(best_box)
    sugar = predict_sugar_content(color_maturity)
    _, days, suggestion = get_maturity_info(class_name)
    if class_name == "rotten_orange":
        maturity = 10.0
    else:
        maturity = float(color_maturity)

    insert_detection(g.user_id, filename, class_name, maturity, days, sugar, suggestion)

    resp = {
=======

    color_desc, color_maturity = analyze_color_maturity(orig_img, best_box)
    diameter = estimate_diameter(best_box)
    sugar = predict_sugar_content(color_maturity)
    maturity, days, suggestion = get_maturity_info(class_name)

    insert_detection(filename, class_name, maturity, days, sugar, suggestion)

    return jsonify({
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
        "class": class_name,
        "maturity": maturity,
        "days": days,
        "suggestion": suggestion,
        "color": color_desc,
        "diameter": diameter,
        "sugar": sugar
<<<<<<< HEAD
    }
    if request.args.get("debug") == "1":
        resp["_debug"] = {
            "model": {"class_id": class_id, "conf": round(conf, 6)},
            "color": {"hue_cv_mean": hue_cv, "maturity_color": color_maturity, "label": color_desc},
        }
    return jsonify(resp)


@app.route("/client_log", methods=["POST"])
def client_log():
    payload = request.get_json(silent=True) or {}
    try:
        logging.info("client_log %s", payload)
    except Exception:
        logging.exception("client_log_failed")
    return jsonify({"success": True}), 200


@app.route("/save_record", methods=["POST"])
@login_required
def save_record():
    try:
        payload = request.get_json(force=True, silent=False)
    except Exception:
        return jsonify({"success": False, "code": "INVALID_JSON", "message": "请求体必须为 JSON"}), 400

    if not isinstance(payload, dict):
        return jsonify({"success": False, "code": "INVALID_JSON", "message": "请求体必须为 JSON 对象"}), 400

    image_name = payload.get("image")
    class_name = payload.get("class")
    maturity = payload.get("maturity", 0)
    sugar = payload.get("sugar", 0)
    suggestion = payload.get("suggestion", "")
    days = payload.get("days")

    if not image_name or not isinstance(image_name, str):
        return jsonify({"success": False, "code": "VALIDATION_ERROR", "message": "缺少 image"}), 400
    if not class_name or not isinstance(class_name, str):
        return jsonify({"success": False, "code": "VALIDATION_ERROR", "message": "缺少 class"}), 400

    try:
        maturity_float = round(float(maturity), 1)
    except Exception:
        return jsonify({"success": False, "code": "VALIDATION_ERROR", "message": "maturity 必须为数字"}), 400

    try:
        sugar_float = float(sugar)
    except Exception:
        return jsonify({"success": False, "code": "VALIDATION_ERROR", "message": "sugar 必须为数字"}), 400

    if days is None:
        _, computed_days, _ = get_maturity_info(class_name)
        days_int = int(computed_days)
    else:
        try:
            days_int = int(days)
        except Exception:
            return jsonify({"success": False, "code": "VALIDATION_ERROR", "message": "days 必须为整数"}), 400

    try:
        insert_detection(g.user_id, image_name, class_name, maturity_float, days_int, sugar_float, suggestion)
    except Exception:
        logging.exception("save_record insert_detection failed")
        return jsonify({"success": False, "code": "DB_WRITE_FAILED", "message": "写入数据库失败"}), 500

    return jsonify({"success": True}), 200

@app.route("/stats")
@login_required
def stats():
    return jsonify(get_stats(g.user_id))

@app.route("/history")
@login_required
def history():
    records = get_history(g.user_id)
    history_list = []
    for r in records:
        history_list.append({
            "id": r[0],
            "time": r[1],
            "image": r[2],
            "maturity": r[3],
            "sugar": r[4],
            "suggestion": r[5],
            "class": r[6]
        })
    return jsonify(history_list)


@app.route("/uploads/<path:filename>", methods=["GET"])
def get_uploaded_file(filename):
    resp = send_from_directory(UPLOAD_FOLDER, filename)
    resp.headers["Cache-Control"] = "public, max-age=3600"
    return resp


@app.route("/api/v1/detection/<int:detection_id>", methods=["GET"])
@login_required
def get_detection_detail(detection_id):
    record = get_detection_by_id(detection_id, g.user_id)
    if not record:
        return jsonify({"success": False, "code": "DETECTION_NOT_FOUND", "message": "记录不存在"}), 404

    image_id = record.get("image")
    record["image_ids"] = [image_id] if image_id else []
    return jsonify({"success": True, "data": record}), 200


@app.route("/api/v1/detection/<int:detection_id>/image/<path:image_id>", methods=["GET"])
@login_required
def get_detection_image(detection_id, image_id):
    record = get_detection_by_id(detection_id, g.user_id)
    if not record:
        return jsonify({"success": False, "code": "DETECTION_NOT_FOUND", "message": "记录不存在"}), 404

    expected_image = record.get("image")
    if not expected_image or expected_image != image_id:
        return jsonify({"success": False, "code": "IMAGE_NOT_FOUND", "message": "图片不存在"}), 404

    full_path = os.path.join(UPLOAD_FOLDER, image_id)
    if not os.path.exists(full_path):
        return jsonify({"success": False, "code": "IMAGE_NOT_FOUND", "message": "图片不存在"}), 404

    resp = send_from_directory(UPLOAD_FOLDER, image_id)
    resp.headers["Cache-Control"] = "no-store, private"
    return resp

# ---------- 新增路由 ----------
@app.route("/api/records", methods=["GET"])
@login_required
=======
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
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
def get_api_records():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("pageSize", 5))
    image_name = request.args.get("imageName", "")
    maturity = request.args.get("maturity", "")
    start_date = request.args.get("startDate", "")
    end_date = request.args.get("endDate", "")
    result = query_records_with_filters(
<<<<<<< HEAD
        user_id=g.user_id,
=======
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
        page=page,
        page_size=page_size,
        image_name=image_name,
        maturity=maturity,
        start_date=start_date,
        end_date=end_date
    )
    return jsonify(result)

@app.route("/record/<int:record_id>", methods=["DELETE"])
<<<<<<< HEAD
@login_required
def delete_record(record_id):
    success = delete_detection_by_id(record_id, g.user_id)
=======
def delete_record(record_id):
    success = delete_detection_by_id(record_id)
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
    if success:
        return '', 200
    else:
        return jsonify({"error": "记录不存在"}), 404

@app.route("/api/records/export", methods=["GET"])
<<<<<<< HEAD
@login_required
=======
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
def export_records():
    image_name = request.args.get("imageName", "")
    maturity = request.args.get("maturity", "")
    start_date = request.args.get("startDate", "")
    end_date = request.args.get("endDate", "")
    records = query_all_records_with_filters(
<<<<<<< HEAD
        user_id=g.user_id,
=======
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
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
<<<<<<< HEAD
@app.route("/api/dashboard")
@login_required
def dashboard_api():
    return jsonify(get_dashboard_stats(g.user_id))

# ==========================
# AI 问答路由
# ==========================
@app.route("/chat", methods=["POST"])
@login_required
def chat():
    """AI 智能问答接口"""
    started = time.time()
    request_id = str(uuid.uuid4())
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "")
    
    if not user_message:
        return jsonify({"reply": "请输入您的问题。", "code": "EMPTY_INPUT", "request_id": request_id}), 400
        
    # 获取或生成 session_id，用于对话上下文追踪
    session_id = data.get("session_id")
    if not session_id:
        if "session_id" not in session:
            session["session_id"] = str(uuid.uuid4())
        session_id = session["session_id"]
    
    # 记录调用日志
    logging.info("chat_request request_id=%s user_id=%s session=%s msg_len=%s", request_id, g.user_id, session_id, len(str(user_message)))
    
    try:
        loop = asyncio.new_event_loop()
        try:
            asyncio.set_event_loop(loop)
            # 这里的 ai_handler 需要传递 user_id
            result = loop.run_until_complete(ai_handler.get_response(g.user_id, session_id, user_message))
        finally:
            try:
                loop.close()
            except Exception:
                pass
        elapsed_ms = int((time.time() - started) * 1000)
        
        # 记录成功日志
        logging.info(
            "chat_response request_id=%s user_id=%s session=%s code=%s status=%s latency_ms=%s",
            request_id,
            g.user_id,
            session_id,
            result.get("code"),
            result.get("deepseek_status"),
            elapsed_ms,
        )
        
        http_status = 200
        if result.get("code") in ("AI_UNAVAILABLE", "RATE_LIMIT", "CIRCUIT_OPEN", "EXCEPTION"):
            http_status = 503
        return jsonify({
            **result,
            "session_id": session_id,
            "request_id": request_id,
            "server_latency_ms": elapsed_ms,
        }), http_status
    except Exception as e:
        logging.exception("chat_route_exception request_id=%s user_id=%s session=%s", request_id, g.user_id, session_id)
        elapsed_ms = int((time.time() - started) * 1000)
        return jsonify({
            "reply": "暂时无法连接智能助手，但你可以继续提问。我会记住你的问题。",
            "code": "SERVER_ERROR",
            "retryable": True,
            "session_id": session_id,
            "request_id": request_id,
            "server_latency_ms": elapsed_ms,
        }), 503

@app.route("/chat/ping", methods=["GET"])
@login_required
def chat_ping():
    request_id = str(uuid.uuid4())
    stats = {}
    try:
        stats = ai_handler.get_stats()
    except Exception:
        logging.exception("chat_ping_stats_failed request_id=%s", request_id)
    return jsonify({
        "ok": True,
        "request_id": request_id,
        "circuit_open": bool(stats.get("circuit_open")),
        "stats": stats,
    }), 200

@app.route("/chat/clear", methods=["POST"])
@login_required
def clear_chat():
    """清空聊天记录接口"""
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id") or session.get("session_id")
    if session_id:
        clear_chat_history(g.user_id, session_id)
        return jsonify({"success": True, "message": "聊天记录已清空"})
    return jsonify({"success": False, "message": "未找到会话信息"}), 400

@app.teardown_appcontext
def close_ai_session(exception=None):
    # Flask 不支持在 teardown 中运行异步代码
    # 这里通过同步方式关闭或忽略，aiohttp 建议在事件循环结束前关闭
    pass

# ==========================
# 用户管理路由
# ==========================
@app.route("/api/orchard/info", methods=["GET"])
@login_required
def get_orchard_info():
    user = get_user_by_id(g.user_id)
    if not user.get("orchard_id"):
        return jsonify({"success": False, "message": "该用户未关联果园"}), 404
    
    orchard = get_orchard_by_id(user["orchard_id"])
    return jsonify({"success": True, "data": orchard})

@app.route("/api/orchard/users", methods=["GET"])
@login_required
@roles_required("owner", "admin")
def get_orchard_users():
    user = get_user_by_id(g.user_id)
    if not user.get("orchard_id"):
        return jsonify({"success": False, "message": "该用户未关联果园"}), 404
    
    users = get_users_by_orchard(user["orchard_id"])
    return jsonify({"success": True, "data": users})

@app.route("/api/orchard/users", methods=["POST"])
@login_required
@roles_required("owner", "admin")
def add_orchard_user():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = "worker" # 只能创建普通员工
    
    user = get_user_by_id(g.user_id)
    orchard_id = user.get("orchard_id")
    if not orchard_id:
        return jsonify({"success": False, "message": "该用户未关联果园"}), 404
    
    if not username or not password:
        return jsonify({"success": False, "message": "用户名和密码不能为空"}), 400
    
    if get_user_by_username(username):
        return jsonify({"success": False, "message": "用户名已存在"}), 400
    
    password_hash = hash_password(password)
    create_user(username, password_hash, role, orchard_id)
    
    return jsonify({"success": True, "message": "添加成功"}), 201

# ==========================
# 用户管理路由 (管理员)
# ==========================
@app.route("/api/admin/users", methods=["GET"])
@login_required
@roles_required("admin")
def admin_get_users():
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("pageSize", 20))
    search = request.args.get("search", "")
    
    result = get_users_paged(page, page_size, search)
    return jsonify({"success": True, "data": result})

@app.route("/api/admin/users/<int:user_id>/status", methods=["POST"])
@login_required
@roles_required("admin")
def admin_update_user_status(user_id):
    data = request.get_json()
    status = data.get("status") # 1 or 0
    
    if status not in [0, 1]:
        return jsonify({"success": False, "message": "无效的状态值"}), 400
    
    update_user_status(user_id, status)
    
    # 记录审计日志
    action = "enable_user" if status == 1 else "disable_user"
    log_audit(g.user_id, action, target_id=user_id, ip=request.remote_addr)
    
    return jsonify({"success": True, "message": "操作成功"})

@app.route("/api/admin/users/<int:user_id>", methods=["PUT"])
@login_required
@roles_required("admin")
def admin_edit_user(user_id):
    data = request.get_json()
    # 允许修改的字段
    update_user_profile(user_id, **data)
    
    log_audit(g.user_id, "edit_user", target_id=user_id, details=str(data), ip=request.remote_addr)
    
    return jsonify({"success": True, "message": "用户信息已更新"})

# ==========================
# 用户个人管理路由
# ==========================
@app.route("/api/user/profile", methods=["PUT"])
@login_required
def update_profile():
    data = request.get_json()
    # 仅允许修改昵称、头像等非敏感信息
    allowed_data = {k: v for k, v in data.items() if k in ['nickname', 'avatar', 'phone']}
    update_user_profile(g.user_id, **allowed_data)
    return jsonify({"success": True, "message": "个人资料已更新"})

@app.route("/api/user/password", methods=["POST"])
@login_required
def change_password():
    data = request.get_json()
    old_password = data.get("old_password")
    new_password = data.get("new_password")
    code = data.get("code") # 敏感操作需要二次验证
    
    user = get_user_by_id(g.user_id)
    if not check_password(old_password, user["password_hash"]):
        return jsonify({"success": False, "message": "原密码错误"}), 400
    
    if not verify_verification_code(user["email"], code, "change_password"):
        return jsonify({"success": False, "message": "验证码错误或已过期"}), 400
    
    if not validate_password(new_password):
        return jsonify({"success": False, "message": "新密码不符合要求"}), 400
    
    update_user_profile(g.user_id, password_hash=hash_password(new_password))
    log_audit(g.user_id, "change_password", ip=request.remote_addr)
    
    return jsonify({"success": True, "message": "密码修改成功"})
=======
@app.route("/dashboard")
def dashboard():
    return jsonify(get_dashboard_stats())
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad

# ==========================
# 启动
# ==========================
if __name__ == "__main__":
<<<<<<< HEAD
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug)
=======
    app.run(host="0.0.0.0", port=5000, debug=True)
>>>>>>> 7079b227ca083c9a5c6f6f657f1a47413732c7ad
