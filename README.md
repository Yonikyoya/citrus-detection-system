# 柑橘成熟度检测系统 (Citrus Maturity Detection)

基于 YOLOv8 的柑橘成熟度智能检测与可视化平台。用户上传柑橘图像，系统自动识别成熟度（未成熟/成熟/腐烂），并提供采摘建议、数据统计和趋势分析。

![系统首页截图](screenshot.png) <!-- 请替换为实际的截图路径 -->

## ✨ 功能特性

- **智能检测**：上传柑橘图像，实时检测成熟度等级，并返回成熟度百分比、糖度预测、采摘建议。
- **数据中心**：历史记录管理，支持按日期、成熟度筛选，删除记录，导出为 CSV 文件。
- **数据分析**：可视化展示近 7 天成熟度趋势、成熟等级分布、腐烂比例变化和糖度分布。
- **预警中心**：根据腐烂率动态提示风险等级，并给出相应农事建议。
- **仪表盘首页**：展示今日检测数、成熟果比例、腐烂比例、平均糖度等关键指标。
- **AI 智能问答**（可选）：内置农业知识助手，解答种植相关问题。

## 🛠️ 技术栈

| 层次   | 技术                                |
| ------ | ----------------------------------- |
| 前端   | HTML5, CSS3, JavaScript, ECharts, Font Awesome |
| 后端   | Python, Flask, Flask-CORS           |
| 模型   | YOLOv8 (Ultralytics)                |
| 数据库 | SQLite                              |
| 图像处理 | OpenCV, NumPy                      |

## 📦 安装与运行

### 1. 克隆仓库
```bash
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名
2. 创建并激活虚拟环境（推荐）
使用 conda：

bash
conda create -n citrus python=3.8
conda activate citrus
或使用 venv：

bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
3. 安装依赖
bash
pip install -r requirements.txt
如果尚未生成 requirements.txt，可手动安装核心依赖：

bash
pip install flask flask-cors ultralytics opencv-python numpy
4. 下载预训练模型
将训练好的 YOLOv8 模型权重文件放在 runs/detect/train5/weights/best.pt（或修改 app.py 中的路径）。

5. 初始化数据库
首次运行会自动创建数据库 citrus.db，无需额外操作。

6. 启动后端服务
bash
python app.py
服务默认运行在 http://localhost:5000。

7. 访问前端页面
直接用浏览器打开项目根目录下的 index.html（推荐使用 Live Server 或将其部署到静态服务器）。

🚀 使用说明
打开首页，查看今日统计数据与近 7 天趋势。

进入“智能检测”页，上传柑橘图片，点击“开始检测”获取结果。

检测后可点击“保存结果”将记录存入数据库。

在“数据中心”筛选、查看、删除或导出历史记录。

“数据分析”页展示各类统计图表（基于数据库真实数据）。

“预警中心”根据腐烂率动态提示风险。

📁 项目结构
text
.
├── app.py                  # Flask 后端主程序
├── database.py             # 数据库操作封装
├── style.css               # 全局样式
├── script.js               # 公共前端脚本
├── index.html              # 首页
├── detect.html             # 智能检测页
├── data.html               # 数据中心页
├── analysis.html           # 数据分析页
├── warning.html            # 预警中心页
├── about.html              # 关于系统页
├── uploads/                # 上传图片存储目录
├── runs/                   # YOLO 模型权重目录
├── citrus.db               # SQLite 数据库（自动生成）
├── requirements.txt        # Python 依赖
└── README.md               # 本文件
🤝 贡献指南
欢迎提交 Issue 或 Pull Request。请确保代码风格一致，并附上必要的说明。

📄 许可证
本项目采用 MIT 许可证。详情请参见 LICENSE 文件。

开发人员：你的名字
毕业设计：西南大学计算机科学与技术专业
如有问题：请通过 [你的邮箱] 联系

text

**修改说明：**
- 所有代码块都已正确闭合（用三个反引号包裹）。
- 列表格式调整为标准 Markdown（无序列表使用 `-`，缩进统一）。
- 项目结构部分用代码块展示文件树，避免被解析为列表。
- 表格保持原样。
- 占位符（用户名、仓库名、你的名字、邮箱）保留，方便用户自行替换。

现在你可以直接复制以上内容到你的 `README.md` 文件中。
