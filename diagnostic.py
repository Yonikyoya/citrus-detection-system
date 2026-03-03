import os
import requests
import time
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("diagnostic")

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "sk-00e4610c35b44acf877765d0691b2879")
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

def check_connectivity():
    logger.info("--- 开始 API 连通性测试 ---")
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": "ping"}],
        "max_tokens": 5
    }
    
    start_time = time.time()
    try:
        response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload, timeout=10)
        latency = time.time() - start_time
        logger.info(f"状态码: {response.status_code}")
        logger.info(f"响应延迟: {latency:.3f}s")
        
        if response.status_code == 200:
            logger.info("认证成功，API 正常。")
            logger.info(f"响应内容: {response.json().get('choices', [{}])[0].get('message', {}).get('content')}")
        elif response.status_code == 401:
            logger.error("认证失败: API Key 无效。")
        elif response.status_code == 402:
            logger.error("配额受限: 账户余额不足。")
        elif response.status_code == 429:
            logger.error("频率受限: 请求过快。")
        else:
            logger.error(f"其他错误: {response.text}")
            
    except requests.exceptions.Timeout:
        logger.error("请求超时（10s）。")
    except Exception as e:
        logger.error(f"连接异常: {str(e)}")

def check_quota():
    logger.info("--- 开始配额检查 ---")
    # 注意：DeepSeek 可能没有专门的公开端点查询余额，通常通过 402 错误判断
    # 但我们可以尝试发送一个非常小的请求来间接确认
    pass

if __name__ == "__main__":
    check_connectivity()
