# AI Nav · Aaxion 风格预览

入口：`/demos/aaxion/`。这是独立预览，正式主页没有切换。

参考用户指定的 [Aaxion 设计](https://dribbble.com/shots/27816601-Logistics-Management-Dashboard-UI-Aaxion)，采用近黑色、荧光黄绿和圆角表面；按反馈简化为服务导航。

- 左侧保留服务、书签、收藏、管理与外观切换。
- 统一分类面板，分类名称在左，服务图标按固定列对齐；窄屏改为顶部导航及双列入口。
- 去掉统计图、精选入口和大表格。保留搜索、Cmd/Ctrl K、Escape、分类、收藏与深浅色切换。
- 玻璃表面配合可透出的背景光照、28px 模糊和边缘高光，文字保持不透明。
- 只读使用现有 `/api/bookmarks` 与 `/api/categories`。收藏沿用浏览器 `ai-nav-raycast-favorites`，主题使用 `ai-nav-aaxion-theme`。

入口文件为 `index.html`、`nav.css`、`nav.js`。`fonts/` 包含本地 Manrope 字体与 OFL 授权，`icons/` 包含服务图标。`review.html` 为独立响应式检查页。

验证：JavaScript 语法检查通过；实际浏览器搜索 Gitea 返回 1 项并保持 Tailscale 地址，收藏增加/取消、21 个书签、开发与创作 3 项、深浅色切换均通过。390/900/1440/2048/2560px 无横向溢出。
