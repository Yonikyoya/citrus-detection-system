"""
诊断注册问题的脚本
检查数据库、bcrypt、用户创建等各个环节
"""

import sys
import traceback

def test_step(name, func):
    """测试一个步骤并显示结果"""
    print(f"\n{'='*60}")
    print(f"测试：{name}")
    print('='*60)
    try:
        result = func()
        print(f"✅ 通过")
        if result is not None:
            print(f"   结果：{result}")
        return True
    except Exception as e:
        print(f"❌ 失败")
        print(f"   错误：{str(e)}")
        traceback.print_exc()
        return False

def test_import_bcrypt():
    import bcrypt
    password = "test123456"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return f"bcrypt 正常，哈希长度：{len(hashed)}"

def test_database_init():
    from database import init_db, get_db_name
    db_path = get_db_name()
    init_db()
    return f"数据库初始化成功，路径：{db_path}"

def test_create_user():
    from database import create_user, get_user_by_username
    import bcrypt
    
    # 生成测试用户
    test_username = f"diagnose_user_{int(__import__('time').time())}"
    password = "diagnose123"
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # 创建用户
    user_id = create_user(test_username, password_hash, 'worker')
    
    if user_id:
        # 验证用户是否存在
        user = get_user_by_username(test_username)
        if user:
            return f"用户创建成功，ID: {user_id}, 用户名：{user['username']}"
        else:
            raise Exception("用户创建成功但查询失败")
    else:
        raise Exception("create_user 返回 None")

def test_auth_module():
    from auth import hash_password, check_password
    password = "testpass123"
    hashed = hash_password(password)
    verified = check_password(password, hashed)
    
    if not verified:
        raise Exception("密码验证失败")
    
    return f"密码加密验证通过，哈希：{hashed[:20]}..."

def test_flask_app():
    """测试 Flask 应用是否能正常启动"""
    import app as app_module
    from app import app
    
    with app.app_context():
        # 测试请求上下文
        return f"Flask 应用加载成功，模板文件夹：{app.template_folder}"

def main():
    print("="*60)
    print("开始诊断注册功能")
    print("="*60)
    
    tests = [
        ("导入 bcrypt 模块", test_import_bcrypt),
        ("数据库初始化", test_database_init),
        ("密码加密验证", test_auth_module),
        ("创建用户流程", test_create_user),
        ("Flask 应用加载", test_flask_module),
    ]
    
    results = []
    for name, func in tests:
        results.append(test_step(name, func))
    
    print("\n" + "="*60)
    print("诊断总结")
    print("="*60)
    passed = sum(results)
    total = len(results)
    print(f"通过：{passed}/{total}")
    
    if passed == total:
        print("\n✅ 所有测试通过！系统配置正确。")
        print("\n如果网页注册仍然失败，请检查:")
        print("1. Flask 应用是否正在运行（python app.py）")
        print("2. 浏览器访问的 URL 是否正确（http://localhost:5000/register）")
        print("3. Flask 控制台的实时日志输出")
    else:
        print("\n❌ 有测试失败。请根据上面的错误信息修复。")
    
    print("="*60)

if __name__ == "__main__":
    main()
