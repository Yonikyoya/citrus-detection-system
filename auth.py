import jwt
import datetime
import functools
import os
import bcrypt
import random
import string
from flask import request, jsonify, g
from database import get_user_by_id

JWT_SECRET = os.environ.get("JWT_SECRET", "citrus-orchard-secret-key-2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def hash_password(password):
    """使用 bcrypt 加密密码"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password, hashed):
    """验证 bcrypt 密码"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def generate_verification_code(length=6):
    """生成 6 位数字验证码"""
    return ''.join(random.choices(string.digits, k=length))

def generate_token(user_id, role):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def login_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # 1. 优先从 Authorization header 读取
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        # 2. 如果 header 中没有，尝试从 cookie 读取
        if not token:
            token = request.cookies.get("token")
        
        if not token:
            return jsonify({"success": False, "code": "UNAUTHORIZED", "message": "未提供认证令牌"}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({"success": False, "code": "UNAUTHORIZED", "message": "无效或已过期的令牌"}), 401
        
        g.user_id = payload["user_id"]
        g.user_role = payload["role"]
        return f(*args, **kwargs)
    
    return decorated

def roles_required(*roles):
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(g, 'user_role'):
                return jsonify({"success": False, "code": "UNAUTHORIZED", "message": "未登录"}), 401
            
            if g.user_role not in roles:
                return jsonify({"success": False, "code": "FORBIDDEN", "message": "权限不足"}), 403
            
            return f(*args, **kwargs)
        return decorated
    return decorator
