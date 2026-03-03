# 果园管理系统接口文档 (API Documentation)

## 1. 认证接口 (Authentication)

### 1.1 用户注册 (User Registration)
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "owner1",
    "password": "password123",
    "role": "owner",
    "orchard_name": "我的果园",
    "location": "广西南宁"
  }
  ```
- **Response**: `201 Created`

### 1.2 用户登录 (User Login)
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "owner1",
    "password": "password123"
  }
  ```
- **Response**: `200 OK` (返回 JWT Token)

## 2. 数据隔离与检测接口 (Detection & Data Isolation)

### 2.1 提交检测 (Submit Detection)
- **URL**: `/detect`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Request**: `multipart/form-data` (image file)
- **Response**: `200 OK` (检测结果)

### 2.2 查询历史 (Query History)
- **URL**: `/history`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (当前用户的数据列表)

### 2.3 获取详情 (Get Detail)
- **URL**: `/api/v1/detection/<id>`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (仅当记录属于当前用户时返回)

## 3. 用户与果园管理 (User & Orchard Management)

### 3.1 获取果园信息
- **URL**: `/api/orchard/info`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`

### 3.2 管理子账号 (Admin/Owner Only)
- **URL**: `/api/orchard/users`
- **Method**: `GET` (列表) / `POST` (新增)
- **Headers**: `Authorization: Bearer <token>`
