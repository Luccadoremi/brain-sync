# 部署指南

## 后端部署到服务器

### 1. 准备服务器环境

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装 Python 3.10+
sudo apt install python3 python3-pip python3-venv -y
```

### 2. 上传代码到服务器

```bash
# 在本地打包
cd /root/project/MindSync
tar -czf brain-sync-backend.tar.gz backend/

# 上传到服务器
scp brain-sync-backend.tar.gz user@your-server:/home/user/

# 在服务器上解压
ssh user@your-server
cd /home/user
tar -xzf brain-sync-backend.tar.gz
cd backend
```

### 3. 安装依赖

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 4. 配置环境变量

```bash
# 创建 .env 文件
cp .env.example .env

# 编辑配置
nano .env

# 必须配置的项:
# ACCESS_TOKEN=设置一个强密码
# QWEN_API_KEY=你的通义千问API密钥
```

### 5. 使用 systemd 配置自启动服务

创建服务文件 `/etc/systemd/system/brain-sync.service`:

```ini
[Unit]
Description=Brain-Sync FastAPI Backend
After=network.target

[Service]
User=your-username
WorkingDirectory=/home/user/backend
Environment="PATH=/home/user/backend/venv/bin"
ExecStart=/home/user/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl daemon-reload
sudo systemctl enable brain-sync
sudo systemctl start brain-sync
sudo systemctl status brain-sync
```

### 6. 配置 Nginx 反向代理 (可选)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 前端部署到 Vercel

### 方法 1: 使用 Vercel CLI (推荐)

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 进入前端目录
cd /root/project/MindSync/frontend

# 部署
vercel

# 按提示操作:
# - 设置项目名称: brain-sync
# - 选择团队或个人账号
# - 确认配置
```

### 方法 2: 使用 Vercel 网站

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "New Project"
3. 选择 "Import Git Repository" 或直接上传 `frontend` 文件夹
4. 配置项目:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (如果是整个项目仓库)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加环境变量:
   - `VITE_API_URL`: 你的后端 API 地址 (如 `https://api.yourdomain.com`)
6. 点击 "Deploy"

### 部署后配置

部署完成后,Vercel 会提供一个域名如 `brain-sync-xxxxx.vercel.app`

更新后端 CORS 设置,在 `backend/main.py` 中:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://brain-sync-xxxxx.vercel.app"],  # 改为你的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 定时任务 - 自动抓取 RSS

在服务器上配置 cron job:

```bash
# 编辑 crontab
crontab -e

# 添加任务: 每天早上 6 点自动抓取
0 6 * * * curl -X POST http://localhost:8000/rss/fetch -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

或创建 Python 脚本 `cron_fetch.py`:

```python
import requests

API_URL = "http://localhost:8000"
ACCESS_TOKEN = "your_access_token"

headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
response = requests.post(f"{API_URL}/rss/fetch", headers=headers)
print(response.json())
```

然后在 crontab 中:

```
0 6 * * * /home/user/backend/venv/bin/python /home/user/backend/cron_fetch.py
```

---

## 数据备份

SQLite 数据库文件位于 `backend/brain_sync.db`,定期备份即可:

```bash
# 备份脚本
#!/bin/bash
BACKUP_DIR="/home/user/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

cp /home/user/backend/brain_sync.db $BACKUP_DIR/brain_sync_$TIMESTAMP.db

# 保留最近 7 天的备份
find $BACKUP_DIR -name "brain_sync_*.db" -mtime +7 -delete
```

添加到 crontab 每天备份:

```
0 2 * * * /home/user/backup.sh
```

---

## 故障排查

### 后端无法启动

```bash
# 查看日志
sudo journalctl -u brain-sync -f

# 检查端口占用
sudo netstat -tlnp | grep 8000

# 手动测试
cd /home/user/backend
source venv/bin/activate
python main.py
```

### 前端无法访问后端

1. 检查 CORS 配置
2. 确认 `VITE_API_URL` 环境变量正确
3. 检查服务器防火墙规则
4. 验证后端服务运行状态

---

祝部署顺利! 🎉
