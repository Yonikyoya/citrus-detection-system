import asyncio
import importlib


def test_chat_route_returns_503_on_retryable(tmp_path, monkeypatch):
    monkeypatch.setenv("CITRUS_DB_PATH", str(tmp_path / "test_route.db"))
    import database

    importlib.reload(database)
    database.init_db()

    import app

    importlib.reload(app)

    async def fake_get_response(session_id, user_input):
        return {
            "reply": "暂时无法连接智能助手，但你可以继续提问。我会记住你的问题。",
            "code": "AI_UNAVAILABLE",
            "retryable": True,
            "deepseek_status": 502,
            "latency_ms": 10,
        }

    app.ai_handler.get_response = fake_get_response

    client = app.app.test_client()
    resp = client.post("/chat", json={"message": "测试", "session_id": "s"})
    assert resp.status_code == 503
    data = resp.get_json()
    assert data["code"] == "AI_UNAVAILABLE"
    assert "session_id" in data
    assert "request_id" in data

