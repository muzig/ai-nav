# 玻璃导航正式发布（2026-10-18）

- 正式主页：http://100.76.127.16/
- 链接管理：http://100.76.127.16/manage.html
- 前端采用 Vite 双页面构建；导航 CSS 与管理页 CSS 独立打包。
- 当前镜像：`ai-nav:glass-20261018`，镜像 ID：`sha256:c9966d8641db7d21626e90612eb1915996a41618f7506deae2777202d4b51c20`。
- 构建时包含工作区现有修改；部署时的源码快照及文件校验记录已保留。
- 主页切换与旧样式清理单独提交；原有管理页组件、样式和 nginx 配置的工作区改动不包含在此次提交中。
- 旧 demos 及各风格素材已从源码和运行静态目录移除；导航共用字体、图标移至 public/navigation。
- 数据卷仍为 ai-nav_db-data；无数据库迁移；切换前后 33 条导航核心字段一致。
- 构建、资源完整性、API 健康、正式主页搜索/收藏/书签、管理页添加链接弹窗均通过。

## 回滚

备份：`/Users/muzig/backups/ai-nav/glass-home-20261018-467337e/`，包含旧前端源码、旧运行静态目录、新源码快照、改动补丁和 release.json。

在当前 Compose 项目目录执行：

```sh
docker tag ai-nav:rollback-glass-20261018 ai-nav-ai-nav:latest
docker compose -p ai-nav -f docker-compose.yml up -d --no-build ai-nav
docker cp /Users/muzig/backups/ai-nav/glass-home-20261018-467337e/runtime-web/. ai-nav-ai-nav-1:/app/apps/web/dist/
```

回滚后重新核对主页与 /api/health，不改变或覆盖数据库卷。
