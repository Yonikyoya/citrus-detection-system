import pytest
import os
import json
import sqlite3
from app import app
from database import init_db, _connect

@pytest.fixture
def client():
    # 使用唯一的临时数据库名，避免并发冲突
    db_path = f"test_citrus_{os.getpid()}.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    
    os.environ["CITRUS_DB_PATH"] = db_path
    app.config["TESTING"] = True
    
    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client
    
    # 清理
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except:
            pass

def test_register_and_login(client):
    # 注册
    resp = client.post("/api/auth/register", json={
        "username": "testowner",
        "password": "password123",
        "role": "owner",
        "orchard_name": "Test Orchard"
    })
    assert resp.status_code == 201
    
    # 登录
    resp = client.post("/api/auth/login", json={
        "username": "testowner",
        "password": "password123"
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert "token" in data
    assert data["user"]["username"] == "testowner"
    return data["token"]

def test_data_isolation(client):
    # 1. 注册并登录用户 A
    client.post("/api/auth/register", json={
        "username": "userA",
        "password": "passwordA",
        "role": "owner",
        "orchard_name": "Orchard A"
    })
    respA = client.post("/api/auth/login", json={"username": "userA", "password": "passwordA"})
    tokenA = respA.get_json()["token"]
    
    # 2. 注册并登录用户 B
    client.post("/api/auth/register", json={
        "username": "userB",
        "password": "passwordB",
        "role": "owner",
        "orchard_name": "Orchard B"
    })
    respB = client.post("/api/auth/login", json={"username": "userB", "password": "passwordB"})
    tokenB = respB.get_json()["token"]
    
    # 3. 用户 A 插入数据
    headersA = {"Authorization": f"Bearer {tokenA}"}
    client.post("/save_record", headers=headersA, json={
        "image": "imgA.jpg",
        "class": "ripe_orange",
        "maturity": 95,
        "sugar": 12.5,
        "suggestion": "Harvest now"
    })
    
    # 4. 用户 B 插入数据
    headersB = {"Authorization": f"Bearer {tokenB}"}
    client.post("/save_record", headers=headersB, json={
        "image": "imgB.jpg",
        "class": "unripe_orange",
        "maturity": 40,
        "sugar": 8.0,
        "suggestion": "Wait"
    })
    
    # 5. 验证用户 A 只能看到自己的数据
    resp = client.get("/history", headers=headersA)
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["image"] == "imgA.jpg"
    
    # 6. 验证用户 B 只能看到自己的数据
    resp = client.get("/history", headers=headersB)
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["image"] == "imgB.jpg"
    
    # 7. 验证跨用户访问详情失败
    recordA_id = client.get("/history", headers=headersA).get_json()[0]["id"]
    resp = client.get(f"/api/v1/detection/{recordA_id}", headers=headersB)
    assert resp.status_code == 404 # 应该找不到，因为附加了 user_id 过滤

def test_role_based_access(client):
    # 1. 注册 Owner A
    client.post("/api/auth/register", json={
        "username": "ownerA",
        "password": "password",
        "role": "owner",
        "orchard_name": "Orchard A"
    })
    resp = client.post("/api/auth/login", json={"username": "ownerA", "password": "password"})
    tokenA = resp.get_json()["token"]
    headersA = {"Authorization": f"Bearer {tokenA}"}
    
    # 2. Owner A 创建 Worker A
    client.post("/api/orchard/users", headers=headersA, json={
        "username": "workerA",
        "password": "password"
    })
    
    # 3. Worker A 登录
    resp = client.post("/api/auth/login", json={"username": "workerA", "password": "password"})
    tokenW = resp.get_json()["token"]
    headersW = {"Authorization": f"Bearer {tokenW}"}
    
    # 4. Worker A 尝试创建另一个 Worker (应该失败)
    resp = client.post("/api/orchard/users", headers=headersW, json={
        "username": "workerB",
        "password": "password"
    })
    assert resp.status_code == 403
