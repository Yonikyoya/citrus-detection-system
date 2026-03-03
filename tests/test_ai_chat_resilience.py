import asyncio
import importlib


def _setup(tmp_path, monkeypatch):
    monkeypatch.setenv("CITRUS_DB_PATH", str(tmp_path / "test_chat.db"))
    monkeypatch.setenv("AI_TIMEOUT_S", "0.2")
    import database

    importlib.reload(database)
    database.init_db()

    import ai_chat

    importlib.reload(ai_chat)
    return ai_chat, database


def test_fallback_kb_and_persist(tmp_path, monkeypatch):
    ai_chat, database = _setup(tmp_path, monkeypatch)
    handler = ai_chat.ai_handler

    async def fake_call_api(messages, timeout_s):
        return {"ok": False, "status": 503, "latency_ms": 5, "error_type": "http_error", "error_detail": "x"}

    handler._call_api = fake_call_api

    result = asyncio.run(handler.get_response("s1", "如何判断柑橘成熟了？"))
    assert result["code"] in ("FALLBACK_KB", "AI_UNAVAILABLE", "EXCEPTION")
    ctx = database.get_chat_context("s1", limit=10)
    assert len(ctx) >= 2
    assert ctx[-2]["role"] == "user"
    assert ctx[-1]["role"] == "assistant"


def test_circuit_breaker_opens(tmp_path, monkeypatch):
    ai_chat, database = _setup(tmp_path, monkeypatch)
    handler = ai_chat.ai_handler

    async def fake_call_api(messages, timeout_s):
        raise asyncio.TimeoutError()

    handler._call_api = fake_call_api

    for _ in range(6):
        asyncio.run(handler.get_response("s2", "提高柑橘糖度的方法？"))

    result = asyncio.run(handler.get_response("s2", "提高柑橘糖度的方法？"))
    assert result["code"] in ("CIRCUIT_OPEN", "EXCEPTION", "AI_UNAVAILABLE", "FALLBACK_KB")

