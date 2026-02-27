# 🚀 GitHub Pages 部署指南

## 方案优势

✅ **免费 HTTPS 访问** - 通过 `https://luccadoremi.github.io/brain-sync/`  
✅ **无需暴露服务器 IP** - 更安全  
✅ **自动构建部署** - push 代码自动更新  
✅ **全球 CDN 加速** - GitHub 提供  

---

## 📋 部署步骤

### 1️⃣ 创建 GitHub Personal Access Token

1. 访问 GitHub Settings → Developer settings → Personal access tokens → **Tokens (classic)**
2. 点击 **Generate new token (classic)**
3. 填写信息：
   - **Note**: `brain-sync-deploy`
   - **Expiration**: 90 days (或更长)
   - **Select scopes**:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
4. 点击 **Generate token**，复制生成的 token (格式: `ghp_xxx...`)

### 2️⃣ 配置 Git 认证

在服务器上运行：

```bash
cd /root/project/MindSync

# 设置认证（用你的 token 替换 YOUR_TOKEN）
git remote set-url origin https://YOUR_TOKEN@github.com/Luccadoremi/brain-sync.git

# 推送代码
git push -u origin main
```

### 3️⃣ 启用 GitHub Pages

1. 访问仓库 https://github.com/Luccadoremi/brain-sync
2. 进入 **Settings** → **Pages**
3. **Source** 选择: **GitHub Actions**
4. 保存后，GitHub Actions 会自动触发构建

### 4️⃣ 配置后端 API 密钥

为了让前端能访问你的后端 API，需要在 GitHub 仓库配置 Secret：

1. 进入 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **New repository secret**
3. 添加以下 secret：
   - **Name**: `VITE_API_URL`
   - **Value**: `http://YOUR_SERVER_IP:8000` (替换为你服务器的实际地址)

### 5️⃣ 验证部署

1. 查看 **Actions** 标签页，确认 workflow 运行成功（绿色✅）
2. 访问: `https://luccadoremi.github.io/brain-sync/`
3. 应该能看到你的 Brain-Sync 应用

---

## 🔐 后端安全配置

由于前端部署在 GitHub Pages，后端仍在你的服务器上，需要配置 CORS：

### 方式 1: 允许 GitHub Pages 域名（推荐）

编辑 `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://luccadoremi.github.io",
        "http://localhost:3000"  # 保留本地开发
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 方式 2: 使用环境变量

1. 创建 `backend/.env`:
```bash
ALLOWED_ORIGINS=https://luccadoremi.github.io,http://localhost:3000
```

2. 修改 `backend/main.py`:
```python
import os
from dotenv import load_dotenv

load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔄 后续更新流程

修改代码后，只需提交并推送：

```bash
cd /root/project/MindSync
git add .
git commit -m "Update feature"
git push
```

GitHub Actions 会自动构建并部署到 Pages。

---

## 🛡️ 进一步安全加固（可选）

### 选项 A: 为后端添加 API Key 认证

已经实现了 Bearer Token 认证，确保在前端调用时带上 token。

### 选项 B: 使用 Cloudflare Tunnel

如果不想暴露后端 IP，可以使用 Cloudflare Tunnel：

1. 安装 cloudflared
2. 创建 tunnel: `cloudflare tunnel create brain-sync`
3. 配置路由到 `localhost:8000`
4. 获得 `*.trycloudflare.com` 域名
5. 更新 `VITE_API_URL` secret

### 选项 C: 使用 Nginx + Basic Auth

为后端 API 添加密码保护：

```nginx
location /api {
    auth_basic "Brain-Sync API";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:8000;
}
```

---

## 📱 移动端访问

前端已经优化了移动端体验，直接用手机浏览器访问 GitHub Pages 地址即可：

`https://luccadoremi.github.io/brain-sync/`

---

## 🆘 故障排查

### Actions 失败

- 检查 `VITE_API_URL` secret 是否配置
- 查看 Actions 日志获取详细错误信息

### 前端部署成功但无法加载数据

- 确认后端服务正在运行: `curl http://localhost:8000/docs`
- 检查防火墙是否开放 8000 端口
- 确认 CORS 配置包含 GitHub Pages 域名

### CORS 错误

- 更新后端 `allow_origins` 包含 `https://luccadoremi.github.io`
- 重启后端服务

---

完成以上步骤后，你就有了一个安全的、基于 HTTPS 的 RSS 阅读器，无需再通过 IP 访问！🎉
