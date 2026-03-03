# 使用 Python 3.12 基础镜像
FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖（如 OpenCV 依赖）
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 设置环境变量
ENV HOST=0.0.0.0
ENV PORT=5000
ENV FLASK_DEBUG=0
ENV LOG_LEVEL=INFO
ENV MODEL_PATH=runs/detect/train5/weights/best.pt
ENV UPLOAD_FOLDER=uploads
ENV CITRUS_DB_PATH=data/citrus.db

# 创建上传目录和数据目录
RUN mkdir -p uploads data

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["python", "app.py"]
