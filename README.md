# 🧠 Brain-Sync (大脑外脑)

个人知识管理系统 - Personal Knowledge Management System

## 📖 产品概述

Brain-Sync 是一个"先过滤、再沉淀"的个人知识管理系统。利用 Qwen 大模型作为"数字助理"，每天替你初步消化 RSS/播客信息，只有经过 AI 提炼且你认为有价值的内容，才会被结构化地沉淀到个人知识库中。

### 核心功能

- **📰 信息流 (Feed)**: 展示 RSS 订阅内容,点击后 AI 自动分析(翻译+总结+见解)
- **📚 知识库 (Vault)**: 四大分类的个人笔记库,支持 Markdown 和标签系统
- **⚙️ 设置**: RSS 源管理和系统配置

## 🚀 快速开始

### 后端部署 (FastAPI + SQLite)

1. **进入后端目录**
```bash
cd backend
```

2. **创建 Python 虚拟环境**
```bash
python3 -m venv venv
source venv/bin/activate
```

3. **安装依赖**
```bash
pip install -r requirements.txt
```

4. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件,填入你的配置:
# ACCESS_TOKEN=your_secure_password
# QWEN_API_KEY=your_qwen_api_key
```

5. **运行后端服务**
```bash
# 使用脚本运行
./run.sh

# 或直接运行
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

后端将运行在 `http://localhost:8000`
API 文档: `http://localhost:8000/docs`

### 前端部署 (React + Vite PWA)

1. **进入前端目录**
```bash
cd frontend
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

前端将运行在 `http://localhost:3000`

4. **构建生产版本**
```bash
npm run build
```

构建产物在 `dist/` 目录

### 部署到生产环境

#### 后端部署 (到你的服务器)

1. 将 `backend/` 目录上传到服务器
2. 安装依赖并配置环境变量
3. 使用 systemd 或 supervisor 守护进程运行

#### 前端部署 (到 Vercel)

1. 在 Vercel 中导入项目
2. 设置构建配置:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `frontend`
3. 添加环境变量 `VITE_API_URL` 指向你的后端 API 地址
4. 部署完成后,可以作为 PWA 添加到手机主屏幕

## 📱 PWA 安装

### iOS (Safari)
1. 用 Safari 打开网站
2. 点击分享按钮
3. 选择"添加到主屏幕"

### Android (Chrome)
1. 用 Chrome 打开网站
2. 点击菜单
3. 选择"添加到主屏幕"

## 🔧 技术栈

### 后端
- **FastAPI**: 高性能 Python Web 框架
- **SQLAlchemy**: ORM 数据库操作
- **SQLite**: 轻量级数据库
- **Feedparser**: RSS 解析
- **OpenAI SDK**: 调用 Qwen 大模型

### 前端
- **React 19**: UI 框架
- **Vite**: 构建工具
- **React Router**: 路由
- **Axios**: HTTP 客户端
- **React Markdown**: Markdown 渲染
- **Vite PWA Plugin**: PWA 支持

## 📁 项目结构

```
MindSync/
├── backend/                 # 后端代码
│   ├── main.py             # FastAPI 应用入口
│   ├── models.py           # 数据库模型
│   ├── schemas.py          # Pydantic 模型
│   ├── database.py         # 数据库配置
│   ├── config.py           # 配置管理
│   ├── routers/            # API 路由
│   │   ├── auth.py         # 认证路由
│   │   ├── rss.py          # RSS 源管理
│   │   ├── feeds.py        # 信息流
│   │   └── notes.py        # 笔记管理
│   ├── services/           # 业务逻辑
│   │   ├── rss_service.py  # RSS 抓取
│   │   └── ai_service.py   # AI 分析
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── App.jsx         # 主应用
│   │   ├── pages/          # 页面组件
│   │   │   ├── Login.jsx   # 登录页
│   │   │   ├── Feed.jsx    # 信息流页
│   │   │   ├── Vault.jsx   # 知识库页
│   │   │   └── Settings.jsx # 设置页
│   │   ├── components/     # 公共组件
│   │   ├── contexts/       # React Context
│   │   └── services/       # API 服务
│   ├── vite.config.js      # Vite 配置
│   └── package.json        # 依赖配置
└── producd.md             # 产品需求文档
```

## 🔑 使用说明

1. **首次使用**: 输入你设置的 ACCESS_TOKEN 登录
2. **添加 RSS 源**: 进入设置页面,添加你关注的博客或播客 RSS 链接
3. **抓取内容**: 点击"手动抓取所有源"按钮
4. **查看信息流**: 返回首页,点击感兴趣的内容查看 AI 分析
5. **保存到知识库**: 对有价值的内容点击"一键入库",选择分类保存
6. **管理笔记**: 在知识库页面查看、搜索和管理你的笔记

## 📄 许可证

MIT License

## 👤 作者

个人项目

---

**注意**: 这是一个单用户系统,仅供个人使用。请妥善保管你的 ACCESS_TOKEN 和 QWEN_API_KEY。
