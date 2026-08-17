# 内网 Mac Mini 部署指南

开发机开发，推送到 Mac Mini 上的 Gitea 即自动部署。

## 架构

```
开发机                          Mac Mini (内网)
┌─────────────┐  git push   ┌────────────────────────────────┐
│  ai-nav     │ ──────────► │  Gitea                         │
│  (工作目录)  │             │    └─ Webhook / Actions        │
└─────────────┘             │         ├─ git pull            │
                            │         ├─ pnpm install        │
                            │         ├─ pnpm build          │
                            │         └─ pm2 restart         │
                            │                                │
                            │  Node.js (port 3001)           │
                            │    ├─ /api/*  → Express        │
                            │    └─ /*      → web/dist 静态  │
                            │  SQLite → packages/db/         │
                            └────────────────────────────────┘
```

局域网设备通过 `http://<mac-mini-ip>:3001` 访问。

## 方案 A：Gitea Actions（推荐，需已启用 Runner）

项目根目录添加 `.gitea/workflows/deploy.yaml`：

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: macos  # runner 注册的 label
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install & Build
        run: |
          pnpm install --frozen-lockfile
          pnpm build

      - name: Restart service
        run: pm2 restart ai-nav || pm2 start apps/api/dist/index.js --name ai-nav
```

前提：Gitea 启用 Actions 且 Mac Mini 上运行了 `act-runner`。

## 方案 B：Webhook + 本地部署脚本（更轻量）

不需要 Runner，Gitea push 后通知本机服务执行部署。

### 1. 部署脚本 `~/deploy-ai-nav.sh`

```bash
#!/bin/bash
set -e
cd ~/ai-nav
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pm2 restart ai-nav 2>/dev/null || pm2 start apps/api/dist/index.js --name ai-nav
echo "✅ Deployed $(date)" >> ~/deploy-ai-nav.log
```

```bash
chmod +x ~/deploy-ai-nav.sh
```

### 2. Webhook 监听

```bash
brew install webhook
```

`~/hooks.json`：

```json
[
  {
    "id": "ai-nav",
    "execute-command": "/Users/<user>/deploy-ai-nav.sh",
    "trigger-rule": {
      "match": {
        "type": "payload-hmac-sha256",
        "secret": "your-secret",
        "parameter": { "source": "header", "name": "X-Gitea-Signature" }
      }
    }
  }
]
```

```bash
pm2 start "webhook -hooks ~/hooks.json -port 9000" --name webhook
pm2 save
```

### 3. Gitea 仓库配置

Settings → Webhooks → Add Webhook：

- URL: `http://127.0.0.1:9000/hooks/ai-nav`
- Content type: `application/json`
- Secret: `your-secret`
- Events: Push

## Mac Mini 初始设置

```bash
# 环境
brew install node
npm install -g pnpm pm2

# 克隆项目（方案 B 需要）
git clone http://<mini-ip>:3000/<user>/ai-nav.git ~/ai-nav
cd ~/ai-nav && pnpm install && pnpm build

# 启动服务
pm2 start apps/api/dist/index.js --name ai-nav
pm2 save
pm2 startup   # 开机自启

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 CLAUDE_API_KEY 等
```

## 开发机设置

```bash
cd ~/src/ai-nav

# 添加 remote（一次性）
git remote add mini http://<mini-ip>:3000/<user>/ai-nav.git

# 日常：推送即部署
git push mini main
```

## 方案对比

| | Gitea Actions | Webhook |
|--|--|--|
| 额外组件 | act-runner | webhook (单二进制) |
| 构建隔离 | 有 | 无（直接在主机） |
| 日志 | Gitea UI 查看 | 本地 log 文件 |
| 复杂度 | 中 | 低 |

## 注意事项

- 服务绑定 `0.0.0.0:3001`，局域网内直接访问
- `.env` 只在 Mac Mini 维护，不进 git
- Mac Mini 关闭自动睡眠（系统设置 → 节能 → 永不睡眠）
- 防火墙需放行 Node.js 入站连接
- 路由器绑定 Mac Mini MAC 地址固定 IP
- 回滚：`git push mini <old-commit>:main`
- 数据备份：定期复制 `packages/db/` 下的 `.db` 文件
