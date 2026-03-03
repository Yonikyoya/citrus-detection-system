import asyncio
import aiohttp
import time
import statistics
import json

# 配置
URL = "http://localhost:5000/chat"
CONCURRENT_REQUESTS = 100
TOTAL_REQUESTS = 100
TEST_QUESTIONS = [
    "如何判断柑橘成熟了？",
    "砂糖橘几月份采摘？",
    "柑橘病虫害怎么防治？",
    "提高柑橘糖度的方法有哪些？",
    "什么是红蜘蛛？怎么治？"
]

async def warmup_cache(session):
    for q in TEST_QUESTIONS:
        try:
            await session.post(URL, json={"message": q, "session_id": "warmup"}, timeout=10)
        except Exception:
            pass

async def send_request(session, sem, request_id):
    question = TEST_QUESTIONS[request_id % len(TEST_QUESTIONS)]
    payload = {"message": question, "session_id": f"stress_test_{request_id}"}
    
    start_time = time.time()
    try:
        async with sem:
            async with session.post(URL, json=payload, timeout=15) as response:
                latency = time.time() - start_time
                status = response.status
                content = await response.json()
                ok = "reply" in content
                retryable = bool(content.get("retryable"))
                server_ms = content.get("server_latency_ms")
                return {
                    "id": request_id,
                    "latency": latency,
                    "status": status,
                    "ok": ok,
                    "retryable": retryable,
                    "server_latency_ms": server_ms,
                }
    except Exception as e:
        return {
            "id": request_id,
            "latency": time.time() - start_time,
            "status": 0,
            "ok": False,
            "retryable": True,
            "server_latency_ms": None,
            "error": str(e)
        }

async def run_stress_test():
    print(f"开始压测: 并发={CONCURRENT_REQUESTS}, 总请求={TOTAL_REQUESTS}")
    async with aiohttp.ClientSession() as session:
        await warmup_cache(session)
        sem = asyncio.Semaphore(CONCURRENT_REQUESTS)
        tasks = [send_request(session, sem, i) for i in range(TOTAL_REQUESTS)]
        results = await asyncio.gather(*tasks)
    
    responded = [r for r in results if r.get("status") in (200, 503)]
    responded_count = len(responded)
    answered = [r for r in results if r.get("status") == 200 and r.get("ok")]
    answered_count = len(answered)
    retryable_count = sum(1 for r in results if r.get("retryable"))
    under_500ms = [
        r for r in responded
        if isinstance(r.get("server_latency_ms"), int) and r["server_latency_ms"] <= 500
    ]
    
    print("\n--- 压测结果 ---")
    print(f"总请求数: {TOTAL_REQUESTS}")
    print(f"收到响应(200/503): {responded_count}")
    print(f"成功生成答案(200): {answered_count}")
    print(f"可重试响应数(retryable): {retryable_count}")
    print(f"500ms 内响应数(server_latency_ms<=500): {len(under_500ms)}")
    
    latencies = [r["latency"] for r in responded]
    if latencies:
        print(f"端到端平均延迟: {statistics.mean(latencies):.3f}s")
        p95 = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max(latencies)
        print(f"端到端 P95 延迟: {p95:.3f}s")
        print(f"端到端最小延迟: {min(latencies):.3f}s")
        print(f"端到端最大延迟: {max(latencies):.3f}s")
    
    errors = [r for r in results if r.get("status") not in (200, 503)]
    if errors:
        print("\n--- 错误详情 (Top 5) ---")
        for e in errors[:5]:
            print(f"ID {e['id']}: Status {e['status']}, Error: {e['error']}")

if __name__ == "__main__":
    asyncio.run(run_stress_test())
