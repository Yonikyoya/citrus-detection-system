import pytest
import os
import json
from app import app
from database import init_db, _connect, get_user_by_id, verify_verification_code, create_verification_code

@pytest.fixture
def client():
    db_path = f"test_user_mgmt_{os.getpid()}.db"
    if os.path.exists(db_path): os.remove(db_path)
    os.environ["CITRUS_DB_PATH"] = db_path
    app.config["TESTING"] = True
    app.config["SECRET_KEY"] = "test_secret"
    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client
    if os.path.exists(db_path): os.remove(db_path)

def test_full_registration_flow(client):
    # 简化后的注册流程：仅用户名和密码
    resp = client.post("/api/auth/register", json={
        "username": "testuser_simple",
        "password": "Password123",
        "confirm_password": "Password123",
        "role": "worker"
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["success"] is True
    assert "user_id" in data

def test_login_and_lockout(client):
    # 准备用户
    from auth import hash_password
    from database import create_user
    create_user("locked_user", hash_password("Password123"), email="locked@example.com")
    
    # 准备验证码
    with client.session_transaction() as sess:
        sess['captchas'] = {'test_id': '4'}
    
    # 1. 连续失败登录
    for _ in range(5):
        client.post("/api/auth/login", json={
            "username": "locked_user",
            "password": "wrong_password",
            "captcha_id": "test_id",
            "captcha_answer": "4"
        })
        # 重新准备验证码，因为验证成功后会删除
        with client.session_transaction() as sess:
            sess['captchas'] = {'test_id': '4'}
    
    # 2. 检查锁定
    resp = client.post("/api/auth/login", json={
        "username": "locked_user",
        "password": "Password123",
        "captcha_id": "test_id",
        "captcha_answer": "4"
    })
    assert resp.status_code == 403
    assert "锁定" in resp.get_json()["message"]

def test_admin_user_management(client):
    from auth import hash_password, generate_token
    from database import create_user
    # 创建管理员
    admin_id = create_user("admin", hash_password("Admin123"), role="admin")
    token = generate_token(admin_id, "admin")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 创建普通用户
    user_id = create_user("user1", hash_password("User123"), role="worker")
    
    # 1. 分页查询
    resp = client.get("/api/admin/users?page=1&pageSize=10", headers=headers)
    assert resp.status_code == 200
    assert len(resp.get_json()["data"]["users"]) >= 2
    
    # 2. 禁用用户
    resp = client.post(f"/api/admin/users/{user_id}/status", headers=headers, json={"status": 0})
    assert resp.status_code == 200
    assert get_user_by_id(user_id)["status"] == 0
    
    # 3. 编辑用户角色
    resp = client.put(f"/api/admin/users/{user_id}", headers=headers, json={"role": "admin"})
    assert resp.status_code == 200
    assert get_user_by_id(user_id)["role"] == "admin"
