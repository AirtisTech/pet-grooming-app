# PetGroom - 宠物美容平台

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)](https://mongodb.com/)

宠物美容预约平台，撮合宠物主人与宠物美容师。

## 功能特点

### 顾客端
- 🐕 发布美容需求订单
- 🔍 浏览并选择美容师
- 📅 在线预约时间
- 💳 在线支付（模拟）
- ⭐ 评价服务

### 美容师端
- 📋 管理个人资料
- 📥 接收订单通知
- ✅ 接单/拒单
- 📝 完成服务标记
- 💰 收入管理

### 管理端
- 📊 数据统计面板
- 👥 用户管理
- ✅ 美容师审核
- 📋 订单管理

## 技术栈

### 后端
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (实时通知)
- JWT (认证)

### 前端
- React 18
- React Router 6
- Axios
- Socket.io Client

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/AirtisTech/pet-grooming-app.git
cd pet-grooming-app
```

### 2. 后端设置

```bash
cd backend
npm install

# 创建 .env 文件
echo "MONGODB_URI=mongodb://localhost:27017/petgroom
JWT_SECRET=your_secret_key_here
PORT=3000" > .env

npm start
```

### 3. 前端设置

```bash
cd frontend
npm install
npm start
```

### 4. 访问

- 前端: http://localhost:3000
- 后端 API: http://localhost:3000/api

## API 端点

### 认证
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户 |

### 订单
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/orders | 创建订单 |
| GET | /api/orders | 订单列表 |
| GET | /api/orders/available | 可接订单 |
| PUT | /api/orders/:id | 更新订单 |
| DELETE | /api/orders/:id | 取消订单 |

### 美容师
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/groomers | 美容师列表 |
| GET | /api/groomers/profile | 我的资料 |
| PUT | /api/groomers/profile | 更新资料 |
| POST | /api/groomers/accept/:orderId | 接单 |
| POST | /api/groomers/complete/:orderId | 完成 |

## 数据库模型

### User
```javascript
{
  email: String,
  phone: String,
  password: String,
  name: String,
  role: 'customer' | 'groomer' | 'admin',
  avatar: String,
  isVerified: Boolean,
  isApproved: Boolean
}
```

### Order
```javascript
{
  customerId: ObjectId,
  groomerId: ObjectId,
  petName: String,
  petType: 'dog' | 'cat' | 'other',
  petSize: 'small' | 'medium' | 'large' | 'extra_large',
  services: ['bath', 'haircut', ...],
  address: { street, city, district },
  scheduledDate: Date,
  scheduledTime: String,
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled',
  price: Number,
  rating: Number,
  review: String
}
```

### GroomerProfile
```javascript
{
  userId: ObjectId,
  bio: String,
  skills: ['bath', 'haircut', ...],
  serviceAreas: [{ city, districts }],
  availability: { monday: {...}, ... },
  basePrice: Number,
  rating: Number,
  totalReviews: Number,
  completedJobs: Number,
  isOnline: Boolean
}
```

## Socket.io 事件

| 事件 | 描述 |
|------|------|
| new_order | 新订单通知 |
| order_available | 订单可接 |
| order_status | 订单状态变化 |
| order_accepted | 订单被接 |
| payment_received | 收款通知 |

## 目录结构

```
pet-grooming-app/
├── backend/
│   ├── models/          # 数据模型
│   ├── routes/          # API 路由
│   ├── server.js        # 入口文件
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/      # 页面组件
│   │   ├── components/ # 通用组件
│   │   ├── context/    # React Context
│   │   ├── services/   # API 服务
│   │   └── App.js      # 主应用
│   └── package.json
├── admin/               # 管理端 (开发中)
├── SPEC.md             # 规格说明书
└── README.md
```

## 开发计划

- [x] 用户认证
- [x] 订单管理
- [x] 美容师资料
- [x] 实时通知
- [x] 支付集成 (模拟)
- [ ] 实时聊天
- [ ] 地图定位
- [ ] PWA 支持
- [ ] React Native App

## 许可证

MIT
