import unittest
import asyncio
from ai_chat import ai_handler
from database import init_db, clear_chat_history, get_chat_context
import uuid

class TestAIChat(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.session_id = f"test_session_{uuid.uuid4()}"

    def tearDown(self):
        clear_chat_history(self.session_id)

    def test_single_turn(self):
        async def fake_ok(messages, timeout_s):
            return {
                "ok": True,
                "status": 200,
                "latency_ms": 1,
                "data": {"choices": [{"message": {"content": "你好，我是农业智能助手。"}}]},
            }

        ai_handler._call_api = fake_ok

        question = "你好，请问你是谁？"
        result = asyncio.run(ai_handler.get_response(self.session_id, question))
        reply = result["reply"]
        self.assertIsInstance(reply, str)
        self.assertTrue(len(reply) > 0)
        
        context = get_chat_context(self.session_id)
        self.assertEqual(len(context), 2)
        self.assertEqual(context[0]["role"], "user")
        self.assertEqual(context[1]["role"], "assistant")

    def test_multi_turn(self):
        async def fake_ok(messages, timeout_s):
            user_inputs = [m.get("content", "") for m in messages if m.get("role") == "user"]
            content = "；".join(user_inputs)
            return {
                "ok": True,
                "status": 200,
                "latency_ms": 1,
                "data": {"choices": [{"message": {"content": content}}]},
            }

        ai_handler._call_api = fake_ok

        q1 = "我正在种植砂糖橘。"
        asyncio.run(ai_handler.get_response(self.session_id, q1))
        
        q2 = "我刚才说我在种什么？"
        result2 = asyncio.run(ai_handler.get_response(self.session_id, q2))
        reply = result2["reply"]
        
        self.assertIn("砂糖橘", reply)
        
        context = get_chat_context(self.session_id)
        self.assertEqual(len(context), 4)

    def test_empty_input(self):
        result = asyncio.run(ai_handler.get_response(self.session_id, ""))
        self.assertEqual(result["code"], "EMPTY_INPUT")
        self.assertEqual(result["reply"], "请输入您的问题。")

    def test_long_input(self):
        async def fake_ok(messages, timeout_s):
            return {
                "ok": True,
                "status": 200,
                "latency_ms": 1,
                "data": {"choices": [{"message": {"content": "ok"}}]},
            }

        ai_handler._call_api = fake_ok

        long_q = "测试" * 1000
        result = asyncio.run(ai_handler.get_response(self.session_id, long_q))
        self.assertIsInstance(result["reply"], str)

if __name__ == "__main__":
    unittest.main()
