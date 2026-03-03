import asyncio
import aiohttp
import time
import statistics
import json
import os

# 配置
BASE_URL = "http://localhost:5000"
CONCURRENT_REQUESTS = 500
TOTAL_REQUESTS = 500
TEST_USER_COUNT = 10

async def setup_users():
    """注册并登录测试用户"""
    tokens = []
    async with aiohttp.ClientSession() as session:
        for i in range(TEST_USER_COUNT):
            username = f"perf_user_{i}_{os.getpid()}"
            password = "password123"
            
            # 注册
            await session.post(f"{BASE_URL}/api/auth/register", json={
                "username": username,
                "password": password,
                "role": "owner",
                "orchard_name": f"Orchard {i}"
            })
            
            # 登录
            async with session.post(f"{BASE_URL}/api/auth/login", json={
                "username": username,
                "password": password
            }) as resp:
                data = await resp.json()
                if "token" in data:
                    tokens.append(data["token"])
    return tokens

async def send_request(session, token, sem, request_id):
    headers = {"Authorization": f"Bearer {token}"}
    endpoint = "/stats" if request_id % 2 == 0 else "/history"
    
    start_time = time.time()
    try:
        async with sem:
            async with session.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5) as response:
                latency_ms = (time.time() - start_time) * 1000
                status = response.status
                return {
                    "id": request_id,
                    "latency_ms": latency_ms,
                    "status": status,
                    "ok": status == 200
                }
    except Exception as e:
        return {
            "id": request_id,
            "latency_ms": (time.time() - start_time) * 1000,
            "status": 0,
            "ok": False,
            "error": str(e)
        }

async def run_performance_test():
    print(f"准备压测: 并发={CONCURRENT_REQUESTS}, 总请求={TOTAL_REQUESTS}")
    
    # 确保服务器已启动
    tokens = await setup_users()
    if not tokens:
        print("错误: 无法获取测试用户令牌，请确保 Flask 服务已启动 (python app.py)")
        return

    print(f"获取到 {len(tokens)} 个测试用户令牌，开始压测...")
    
    async with aiohttp.ClientSession() as session:
        sem = asyncio.Semaphore(CONCURRENT_REQUESTS)
        tasks = [send_request(session, tokens[i % len(tokens)], sem, i) for i in range(TOTAL_REQUESTS)]
        
        start_time = time.time()
        results = await asyncio.gather(*tasks)
        total_time = time.time() - start_time
    
    success_results = [r for r in results if r["ok"]]
    latencies = [r["latency_ms"] for r in success_results]
    
    print("\n" + "="*30)
    print("      性能压测报告")
    print("="*30)
    print(f"总请求数: {TOTAL_REQUESTS}")
    print(f"成功数: {len(success_results)}")
    print(f"失败数: {TOTAL_REQUESTS - len(success_results)}")
    print(f"总耗时: {total_time:.3f}s")
    print(f"吞吐量: {len(success_results)/total_time:.2f} req/s")
    
    if latencies:
        avg_latency = statistics.mean(latencies)
        p95_latency = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max(latencies)
        print(f"平均延迟: {avg_latency:.2f} ms")
        print(f"P95 延迟: {p95_latency:.2f} ms")
        print(f"最小延迟: {min(latencies):.2f} ms")
        print(f"最大延迟: {max(latencies):.2f} ms")
        
        if avg_latency <= 200:
            print("\n结论: [通过] 平均延迟符合要求 (<= 200ms)")
        else:
            print("\n结论: [未通过] 平均延迟超过要求 (> 200ms)")
            
    if len(success_results) == TOTAL_REQUESTS:
        print("并发稳定性: [通过] 无请求失败")
    else:
        print("并发稳定性: [未通过] 存在请求失败")
    print("="*30)

if __name__ == "__main__":
    run_performance_test_loop = asyncio.get_event_loop()
    run_performance_test_loop.run_until_complete(run_performance_test())
