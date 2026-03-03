# AI 对话系统启动流程与配置检查清单

## 1. 启动前检查（必做）

### 1) 服务端口与进程
- 确认 5000 端口未被占用：`http://127.0.0.1:5000/chat/ping` 能返回 200
- 如已占用，修改环境变量：
  - `PORT=5001`（或其他端口）
  - 前端 `script.js` 的接口地址需要同步调整

### 2) DeepSeek 访问配置
- 环境变量（推荐）：
  - `DEEPSEEK_API_KEY`：你的 API Key
  - `DEEPSEEK_API_URL`：默认 `https://api.deepseek.com/chat/completions`
  - `DEEPSEEK_MODEL`：默认 `deepseek-chat`
- 连通性自检（命令行）：
  - `python diagnostic.py`
  - 正常应看到 `status 200` 且有短回复

### 3) 网络与证书
- DNS 正常：能解析 `api.deepseek.com`
- HTTPS 证书链正常：`requests` 能访问 DeepSeek
- 若在企业网络/代理环境：
  - 检查系统代理、拦截规则与防火墙放行

### 4) 超时与降级策略（可调）
- 默认配置适合“能用优先”，复杂问题可能需要更长时间：
  - `AI_TIMEOUT_S`（默认 30）
  - `AI_CONNECT_TIMEOUT_S`（默认 5）
- 失败保护：
  - 熔断阈值 `AI_CB_FAILURE_THRESHOLD`（默认 5）
  - 熔断时间 `AI_CB_OPEN_SECONDS`（默认 30）

## 2. 启动方式

### 方式 A：直接启动（开发/单机）
1. 进入项目目录
2. 执行：
   - `python app.py`
3. 浏览器访问：
   - `http://127.0.0.1:5000/chat/ping`

### 方式 B：带监控自愈启动（推荐）
1. 配置告警（可选）：
   - `OPS_WEBHOOK_URL`：运维 webhook（HTTP POST JSON）
2. 启动监控器：
   - `python ops_monitor.py`
3. 监控器将每 15 秒探活一次，连续 4 次失败（约 1 分钟）自动重启并通知。

## 3. 启动后验证（必须通过）
- `/chat/ping` 返回 200：
  - `curl http://127.0.0.1:5000/chat/ping`
- `/chat` 返回动态回复：
  - POST JSON：`{"message":"如何判断柑橘成熟了？"}`
- 前端验证：
  - 后端关闭时发送消息：必须出现“暂时无法连接智能助手…”并缓存到本地
  - 后端恢复后重新打开聊天：应自动补发，红点计数归零

