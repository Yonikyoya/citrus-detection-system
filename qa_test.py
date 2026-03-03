import asyncio
import aiohttp
import json

URL = "http://localhost:5000/chat"
QA_PAIRS = [
    {
        "question": "如何判断柑橘成熟了？",
        "keywords": ["颜色", "糖度", "糖酸比", "硬度"]
    },
    {
        "question": "柑橘红蜘蛛怎么治？",
        "keywords": ["阿维菌素", "螺螨酯", "杀螨剂", "物理防治"]
    },
    {
        "question": "提高柑橘糖度的方法？",
        "keywords": ["磷钾肥", "光照", "控水", "成熟度"]
    },
    {
        "question": "你会做饭吗？",
        "expected_fail": True
    }
]

async def run_qa():
    print("开始 QA 质量测试...")
    score = 0
    async with aiohttp.ClientSession() as session:
        for item in QA_PAIRS:
            payload = {"message": item["question"]}
            async with session.post(URL, json=payload) as response:
                data = await response.json()
                reply = data.get("reply", "")
                print(f"\nQ: {item['question']}")
                print(f"A: {reply[:100]}...")
                
                if item.get("expected_fail"):
                    # 应该拒绝回答非农业问题
                    if "委婉" in reply or "农业" in reply or "柑橘" in reply or "无法回答" in reply:
                        print("✅ 正确拦截非农业问题")
                        score += 1
                    else:
                        print("❌ 未能拦截非农业问题")
                else:
                    # 检查关键词命中率
                    hit_keywords = [k for k in item["keywords"] if k in reply]
                    if len(hit_keywords) >= 1:
                        print(f"✅ 关键词命中: {hit_keywords}")
                        score += 1
                    else:
                        print(f"❌ 关键词未命中: {item['keywords']}")
    
    final_score = (score / len(QA_PAIRS)) * 100
    print(f"\nQA 覆盖率得分: {final_score}%")

if __name__ == "__main__":
    asyncio.run(run_qa())
