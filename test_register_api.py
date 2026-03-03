"""
测试注册接口是否正常工作的脚本
使用方法：python test_register_api.py
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_register():
    print("=" * 60)
    print("开始测试注册接口")
    print("=" * 60)
    
    # 测试数据
    test_data = {
        "username": f"test_user_{json.dumps(__import__('time').time())}",
        "password": "test123456",
        "confirm_password": "test123456",
        "role": "worker"
    }
    
    print(f"\n请求 URL: POST {BASE_URL}/api/auth/register")
    print(f"请求数据：{json.dumps(test_data, indent=2)}")
    print()
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"响应状态码：{response.status_code}")
        print(f"响应 Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        print(f"响应内容：{response.text[:500]}")
        print()
        
        # 尝试解析 JSON
        try:
            json_response = response.json()
            print("✓ 响应是有效的 JSON 格式")
            print(f"解析后的数据：{json.dumps(json_response, indent=2, ensure_ascii=False)}")
            
            if json_response.get("success"):
                print("\n✅ 注册成功！")
                return True
            else:
                print(f"\n⚠️  注册失败：{json_response.get('message')}")
                return False
        except json.JSONDecodeError as e:
            print(f"✗ 响应不是有效的 JSON: {e}")
            print(f"原始响应：{response.text}")
            return False
            
    except requests.exceptions.ConnectionError as e:
        print(f"✗ 连接错误：无法连接到服务器")
        print(f"错误详情：{e}")
        print("\n请检查:")
        print("1. Flask 应用是否已启动（运行 python app.py）")
        print("2. 服务是否在 http://localhost:5000 运行")
        print("3. 防火墙是否阻止了连接")
        return False
    except Exception as e:
        print(f"✗ 发生异常：{e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_register()
    print("\n" + "=" * 60)
    if success:
        print("测试通过 ✅")
    else:
        print("测试失败 ❌")
    print("=" * 60)
