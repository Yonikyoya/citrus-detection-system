import os
import aiohttp
import asyncio
import logging
import time
import threading
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from database import insert_chat_message, get_chat_context, clear_chat_history

# DeepSeek API 配置
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "sk-00e4610c35b44acf877765d0691b2879")
DEEPSEEK_API_URL = os.environ.get("DEEPSEEK_API_URL", "https://api.deepseek.com/chat/completions")
MODEL_NAME = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
AI_TIMEOUT_S = float(os.environ.get("AI_TIMEOUT_S", "30"))
AI_CONNECT_TIMEOUT_S = float(os.environ.get("AI_CONNECT_TIMEOUT_S", "5"))
AI_MAX_TOKENS = int(os.environ.get("AI_MAX_TOKENS", "700"))
AI_TEMPERATURE = float(os.environ.get("AI_TEMPERATURE", "0.3"))
AI_TOP_P = float(os.environ.get("AI_TOP_P", "0.9"))
AI_MAX_CONTEXT_MESSAGES = int(os.environ.get("AI_MAX_CONTEXT_MESSAGES", "10"))
AI_CACHE_MAX_ITEMS = int(os.environ.get("AI_CACHE_MAX_ITEMS", "200"))
AI_CACHE_TTL_S = int(os.environ.get("AI_CACHE_TTL_S", "3600"))
AI_CB_FAILURE_THRESHOLD = int(os.environ.get("AI_CB_FAILURE_THRESHOLD", "5"))
AI_CB_OPEN_SECONDS = int(os.environ.get("AI_CB_OPEN_SECONDS", "30"))

# 日志配置
logger = logging.getLogger("ai_chat")

class AIChatHandler:
    def __init__(self, api_key=DEEPSEEK_API_KEY):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        # 性能监控数据
        self.stats = {
            "total_calls": 0,
            "success_calls": 0,
            "failed_calls": 0,
            "total_latency": 0.0,
            "cache_hits": 0,
            "circuit_open": 0
        }
        # 简单的内存缓存
        self._cache = {}
        self._lock = threading.Lock()
        self._cb_failures = 0
        self._cb_open_until = 0.0

    def get_stats(self):
        """获取性能监控指标"""
        avg_latency = self.stats["total_latency"] / self.stats["success_calls"] if self.stats["success_calls"] > 0 else 0
        return {
            **self.stats,
            "avg_latency": round(avg_latency, 3),
            "cache_hit_rate": f"{(self.stats['cache_hits'] / self.stats['total_calls'] * 100):.1f}%" if self.stats["total_calls"] > 0 else "0%"
        }

    def preprocess_input(self, text):
        """用户输入预处理和安全过滤"""
        if not text:
            return ""
        text = text.strip()
        # 长度限制
        if len(text) > 1000:
            text = text[:1000]
        # 简单过滤：检查是否包含极端负面词汇或攻击性内容（示例）
        sensitive_words = ["暴力", "违法", "攻击"]
        for word in sensitive_words:
            if word in text:
                logger.warning(f"检测到敏感词: {word}")
                return "您的输入包含敏感内容，请重新输入。"
        return text

    def _cache_get(self, key):
        now = time.time()
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            value, ts = entry
            if now - ts > AI_CACHE_TTL_S:
                self._cache.pop(key, None)
                return None
            return value

    def _cache_set(self, key, value):
        now = time.time()
        with self._lock:
            if len(self._cache) >= AI_CACHE_MAX_ITEMS:
                oldest_key = None
                oldest_ts = None
                for k, (_, ts) in self._cache.items():
                    if oldest_ts is None or ts < oldest_ts:
                        oldest_key = k
                        oldest_ts = ts
                if oldest_key is not None:
                    self._cache.pop(oldest_key, None)
            self._cache[key] = (value, now)

    def _circuit_open(self):
        now = time.time()
        with self._lock:
            return now < self._cb_open_until

    def _circuit_record_success(self):
        with self._lock:
            self._cb_failures = 0
            self._cb_open_until = 0.0

    def _circuit_record_failure(self):
        now = time.time()
        with self._lock:
            self._cb_failures += 1
            if self._cb_failures >= AI_CB_FAILURE_THRESHOLD:
                self._cb_open_until = now + AI_CB_OPEN_SECONDS
                self.stats["circuit_open"] += 1

    def _fallback_kb(self, question):
        q = question.lower()
        if "成熟" in question or "采摘" in question:
            return (
                "判断柑橘成熟度建议综合看：\n"
                "1) 果皮颜色由绿转黄/橙且均匀；\n"
                "2) 可溶性固形物（糖度）一般≥12%更适合采收（品种有差异）；\n"
                "3) 糖酸比升高、果香增强；\n"
                "4) 果肉硬度下降但不发软。\n"
                "若条件允许，建议用手持糖度计抽检多个果位。"
            )
        if "红蜘蛛" in question or "螨" in question:
            return (
                "柑橘红蜘蛛防治建议综合治理：\n"
                "1) 冬季清园、修剪通风，降低越冬虫源；\n"
                "2) 监测到螨量上升尽早处理，轮换不同作用机理杀螨剂，避免抗性；\n"
                "3) 常用有效成分示例：阿维菌素、螺螨酯等（按标签与当地植保建议使用）；\n"
                "4) 注意喷匀叶背，避开高温强光时段。\n"
                "如能提供发生期（嫩梢/膨果期）与症状细节，可给更具体方案。"
            )
        if "糖度" in question or "增甜" in question:
            return (
                "提高柑橘糖度常用思路：\n"
                "1) 花后与膨果期合理控氮、增施磷钾（避免徒长）；\n"
                "2) 改善光照（修剪疏枝、合理负载）；\n"
                "3) 转色前后适度控水，避免果实稀释；\n"
                "4) 病虫害与裂果管理，减少树体消耗。\n"
                "不同品种与树龄用量差异大，建议结合土壤/叶片检测制定配方。"
            )
        if "做饭" in question or "电影" in question or "天气" in q:
            return "我主要回答柑橘种植与农业技术问题。你可以问我成熟度判断、病虫害防治、施肥与管理等。"
        return None

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=0.5, min=1, max=5),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError)),
        reraise=True
    )
    async def _call_api(self, messages, timeout_s):
        self.stats["total_calls"] += 1
        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "temperature": AI_TEMPERATURE,
            "top_p": AI_TOP_P,
            "max_tokens": AI_MAX_TOKENS
        }
        
        start_time = time.time()
        client_timeout = aiohttp.ClientTimeout(total=timeout_s, connect=AI_CONNECT_TIMEOUT_S, sock_read=timeout_s)
        try:
            async with aiohttp.ClientSession(headers=self.headers, timeout=client_timeout) as session:
                async with session.post(
                    DEEPSEEK_API_URL,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        latency_ms = int((time.time() - start_time) * 1000)
                        logger.error(f"deepseek_error status={response.status} latency_ms={latency_ms} body={error_text}")
                        self.stats["failed_calls"] += 1
                        if response.status == 429:
                            return {"ok": False, "status": 429, "latency_ms": latency_ms, "error_type": "rate_limit", "error_detail": error_text}
                        return {"ok": False, "status": response.status, "latency_ms": latency_ms, "error_type": "http_error", "error_detail": error_text}
                    
                    result = await response.json()
                    latency = time.time() - start_time
                    self.stats["success_calls"] += 1
                    self.stats["total_latency"] += latency
                    latency_ms = int(latency * 1000)
                    logger.info(f"deepseek_ok status=200 latency_ms={latency_ms}")
                    
                    return {"ok": True, "status": 200, "latency_ms": latency_ms, "data": result}
        except asyncio.TimeoutError:
            self.stats["failed_calls"] += 1
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"deepseek_timeout latency_ms={latency_ms}")
            raise
        except Exception as e:
            self.stats["failed_calls"] += 1
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"deepseek_exception latency_ms={latency_ms} err={str(e)}")
            raise

    async def get_response(self, user_id, session_id, user_input):
        start_time = time.time()
        processed_input = self.preprocess_input(user_input)
        if not processed_input:
            return {"reply": "请输入您的问题。", "code": "EMPTY_INPUT", "retryable": False, "latency_ms": int((time.time() - start_time) * 1000)}
        if processed_input == "您的输入包含敏感内容，请重新输入。":
            return {"reply": processed_input, "code": "INPUT_BLOCKED", "retryable": False, "latency_ms": int((time.time() - start_time) * 1000)}

        insert_chat_message(user_id, session_id, "user", processed_input)

        cache_key = processed_input
        cached = self._cache_get(cache_key)
        if cached is not None:
            self.stats["total_calls"] += 1
            self.stats["cache_hits"] += 1
            insert_chat_message(user_id, session_id, "assistant", cached)
            return {"reply": cached, "code": "CACHE_HIT", "retryable": False, "latency_ms": int((time.time() - start_time) * 1000)}

        if self._circuit_open():
            msg = "暂时无法连接智能助手，但你可以继续提问。我会记住你的问题。"
            insert_chat_message(user_id, session_id, "assistant", msg)
            return {"reply": msg, "code": "CIRCUIT_OPEN", "retryable": True, "latency_ms": int((time.time() - start_time) * 1000)}

        history = get_chat_context(user_id, session_id, limit=AI_MAX_CONTEXT_MESSAGES)
        
        system_prompt = (
            "你是一个柑橘种植专家和农业助手。请遵循以下规则：\n"
            "1. 仅回答与柑橘种植、成熟度检测、病虫害防治、农业技术相关的问题。\n"
            "2. 如果用户的问题不在农业范围内，请委婉拒绝并引导回农业话题。\n"
            "3. 回答应具体、科学，包含建议的农药、施肥量或检测指标（如糖度、成熟度）。\n"
            "4. 如果你不确定，请建议用户咨询当地农技站。"
        )
        
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": processed_input})

        try:
            result = await self._call_api(messages, timeout_s=AI_TIMEOUT_S)
            if not result.get("ok"):
                self._circuit_record_failure()
                if result.get("status") == 429:
                    msg = "暂时无法连接智能助手，但你可以继续提问。我会记住你的问题。"
                    insert_chat_message(user_id, session_id, "assistant", msg)
                    return {"reply": msg, "code": "RATE_LIMIT", "retryable": True, "deepseek_status": 429, "latency_ms": int((time.time() - start_time) * 1000)}
                kb = self._fallback_kb(processed_input)
                if kb:
                    insert_chat_message(user_id, session_id, "assistant", kb)
                    self._cache_set(cache_key, kb)
                    return {"reply": kb, "code": "FALLBACK_KB", "retryable": True, "deepseek_status": result.get("status"), "latency_ms": int((time.time() - start_time) * 1000)}
                msg = "暂时无法连接智能助手，但你可以继续提问。我会记住你的问题。"
                insert_chat_message(user_id, session_id, "assistant", msg)
                return {"reply": msg, "code": "AI_UNAVAILABLE", "retryable": True, "deepseek_status": result.get("status"), "latency_ms": int((time.time() - start_time) * 1000)}

            self._circuit_record_success()
            reply = result["data"]["choices"][0]["message"]["content"]
            insert_chat_message(user_id, session_id, "assistant", reply)
            self._cache_set(cache_key, reply)
            return {"reply": reply, "code": "OK", "retryable": False, "deepseek_status": 200, "deepseek_latency_ms": result.get("latency_ms"), "latency_ms": int((time.time() - start_time) * 1000)}
        except Exception as e:
            self._circuit_record_failure()
            logger.error(f"chat_failed user_id={user_id} session={session_id} err={str(e)}", exc_info=True)
            msg = "暂时无法连接智能助手，但你可以继续提问。我会记住你的问题。"
            insert_chat_message(user_id, session_id, "assistant", msg)
            return {"reply": msg, "code": "EXCEPTION", "retryable": True, "latency_ms": int((time.time() - start_time) * 1000)}

# 单例模式
ai_handler = AIChatHandler()
