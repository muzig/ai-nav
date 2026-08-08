# Local Services 图标源与缓存方案研究

更新时间：2026-08-08

## 结论

推荐以 **Homarr Labs 的 Dashboard Icons** 作为 `ai-nav` 的 Local Services 主图标源，并且只把实际命中的 SVG 固定到仓库中；不要在浏览器运行时依赖 CDN，也不要把整个图标仓库或图标包塞进前端。

原因很直接：Dashboard Icons 面向 dashboard/app directory，当前库说明有 1,800+ 个服务图标、SVG/PNG/WebP 和明暗变体；对本项目当前可识别的 Grafana、Gitea、Opengist、Cloudreve、Immich、TeslaMate 覆盖为 6/6。它由 Homarr Labs 维护，仓库采用 Apache-2.0，并明确提供按 slug 获取单个文件的 URL 规则。[Dashboard Icons README](https://github.com/homarr-labs/dashboard-icons#readme) · [LICENSE](https://github.com/homarr-labs/dashboard-icons/blob/main/LICENSE)

本项目采用的运行时回退顺序是：

1. 通过受控别名表从本地书签标题识别出的打包图标；
2. 对现有 Immich 导入记录保留一个严格限定的 `2283` 端口兼容映射；
3. 未识别的 Local Service 直接使用随应用打包的通用服务图标，不请求私网 favicon；
4. 公共书签继续使用自己的 favicon，加载失败时回退到首字母。

其中 Immich 这条现有书签的标题只是 IP，因此 `2283` 只作为当前数据的窄兼容规则，并有单元测试约束，不能扩展成任意端口猜测表。未知的 `:6300` 服务不会被错误赋予品牌；Content Studio、lexicon、dsa-web 等自定义应用使用 Lucide 的通用界面、词典或代码图标。未来如需用户定制，可再为书签增加显式 `icon_key`。

## 当前服务覆盖核对

以下结果来自 2026-08-08 对三个官方仓库固定提交的只读 `git ls-tree` 核对。Dashboard Icons 和 selfh.st 均为 6/6；Simple Icons 为 3/6。

| 当前服务 | Dashboard Icons | selfh.st/icons | Simple Icons |
| --- | --- | --- | --- |
| Grafana | [grafana.svg](https://github.com/homarr-labs/dashboard-icons/blob/0d6481f2a87cf611e2bf25adcf8fb07351ed2440/svg/grafana.svg) | [grafana.svg](https://github.com/selfhst/icons/blob/e53fe4e3dea2360e1a16b8e2fc6f0b54844f71dd/svg/grafana.svg) | [grafana.svg](https://github.com/simple-icons/simple-icons/blob/34c22501f9ac9f22b12f825677ccbab1fb22e14b/icons/grafana.svg) |
| Gitea | [gitea.svg](https://github.com/homarr-labs/dashboard-icons/blob/0d6481f2a87cf611e2bf25adcf8fb07351ed2440/svg/gitea.svg) | [gitea.svg](https://github.com/selfhst/icons/blob/e53fe4e3dea2360e1a16b8e2fc6f0b54844f71dd/svg/gitea.svg) | [gitea.svg](https://github.com/simple-icons/simple-icons/blob/34c22501f9ac9f22b12f825677ccbab1fb22e14b/icons/gitea.svg) |
| Opengist | [opengist.svg](https://github.com/homarr-labs/dashboard-icons/blob/0d6481f2a87cf611e2bf25adcf8fb07351ed2440/svg/opengist.svg) | [opengist.svg](https://github.com/selfhst/icons/blob/e53fe4e3dea2360e1a16b8e2fc6f0b54844f71dd/svg/opengist.svg) | 无 |
| Cloudreve | [cloudreve.svg](https://github.com/homarr-labs/dashboard-icons/blob/0d6481f2a87cf611e2bf25adcf8fb07351ed2440/svg/cloudreve.svg) | [cloudreve.svg](https://github.com/selfhst/icons/blob/e53fe4e3dea2360e1a16b8e2fc6f0b54844f71dd/svg/cloudreve.svg) | 无 |
| Immich | [immich.svg](https://github.com/homarr-labs/dashboard-icons/blob/0d6481f2a87cf611e2bf25adcf8fb07351ed2440/svg/immich.svg) | [immich.svg](https://github.com/selfhst/icons/blob/e53fe4e3dea2360e1a16b8e2fc6f0b54844f71dd/svg/immich.svg) | [immich.svg](https://github.com/simple-icons/simple-icons/blob/34c22501f9ac9f22b12f825677ccbab1fb22e14b/icons/immich.svg) |
| TeslaMate | [teslamate.svg](https://github.com/homarr-labs/dashboard-icons/blob/0d6481f2a87cf611e2bf25adcf8fb07351ed2440/svg/teslamate.svg) | [teslamate.svg](https://github.com/selfhst/icons/blob/e53fe4e3dea2360e1a16b8e2fc6f0b54844f71dd/svg/teslamate.svg) | 无 |

## 三个候选

| 候选 | 许可证与品牌限制 | 单图标取用 | 缓存/本地打包 | 包体与本项目覆盖 | 判断 |
| --- | --- | --- | --- | --- | --- |
| [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons)（Homarr Labs） | 仓库 Apache-2.0；再分发需带许可证、保留相关 notices，修改文件要注明。Apache-2.0 不授予商标许可；项目 README 也声明产品名和商标归各自所有，图标仅用于识别。[LICENSE §4/§6](https://github.com/homarr-labs/dashboard-icons/blob/main/LICENSE) · [项目免责声明](https://github.com/homarr-labs/dashboard-icons#legal) | 官方规则是 `<base>/<format>/<kebab-slug>.<format>`，可直接取单个 SVG，并有 `-light`/`-dark` 变体。[使用说明](https://github.com/homarr-labs/dashboard-icons#direct-links) | 仓库没有面向消费者的 npm 资产包；最合适的是把少量固定版本 SVG vendor 到 `src/assets`，由构建器生成内容哈希。 | 固定提交有 3,295 个 SVG 文件（含变体）。本项目 6/6；六个标准 SVG 共 143,239 bytes（约 140 KiB），其中 Cloudreve 单个为 132,929 bytes。配置为独立资源后前端 JS 无图标数据增量。 | **首选** |
| [selfh.st/icons](https://github.com/selfhst/icons) | CC-BY-4.0；发布时必须保留作者/版权、许可证、来源链接，并标注修改。许可证明确不授予商标权。[LICENSE §2(b)/§3(a)](https://github.com/selfhst/icons/blob/main/LICENSE) | 官方仓库提供 SVG/PNG/WebP/AVIF/ICO，标准、light、dark 变体；文件由仓库经 jsDelivr 提供。[README](https://github.com/selfhst/icons#formats) | 官方 Docker 服务原生支持 `remote`/`local`/`hybrid`，并提供 `CACHE_TTL`、`CACHE_SIZE`、超时和本地只读目录挂载。[官方部署文档](https://github.com/selfhst/icons/wiki#environment-variables) | 固定提交约 2,434 个规范化名称、7,115 个 SVG，并各有 7,560 个 PNG/WebP/AVIF；本项目 6/6。没有官方 npm 资产包，整库复制明显过重。 | 动态大目录/已有 Docker 基础设施时可选；对本项目偏重，且署名要求更高 |
| [Simple Icons](https://github.com/simple-icons/simple-icons) | 集合标为 CC0-1.0，但官方免责声明明确说这不代表其中每个图标都是 CC0；每个图标的独立许可数据可能缺失或过期，品牌权限仍需逐项核对。[LICENSE](https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md) · [官方免责声明](https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md) | 可从 `icons/<slug>.svg` 取单文件，也可从 `simple-icons` ESM 导入具名图标；包声明 `sideEffects: false` 并提供 `./icons/*` export。[README](https://github.com/simple-icons/simple-icons#node-usage) · [package.json](https://github.com/simple-icons/simple-icons/blob/develop/package.json) | 固定 npm 版本后可复制选定 SVG，或依赖 bundler tree-shaking；不需要运行时网络。 | npm `simple-icons@16.28.0` 官方元数据：解压 16,059,948 bytes、3,471 files、0 dependencies；本项目只覆盖 3/6，且主要是单色品牌轮廓。[npm](https://www.npmjs.com/package/simple-icons/v/16.28.0) | 适合作为公共网站品牌补充，不适合作为 Local Services 主源 |

Dashboard Icons 已经是 **Homarr Labs** 维护的项目，不需要再把 Homarr 当成第四个独立图标源。Lobe Icons 也没有进入前三：官方定位是 AI/LLM 品牌集合，对上述六个自托管服务的固定仓库快照为 0/6；它更适合未来补充 Claude、OpenAI、Ollama 等 AI 书签，而不是解决当前 Local Services。[Lobe Icons 官方范围与静态包](https://github.com/lobehub/lobe-icons#readme) · [静态 SVG npm 包](https://www.npmjs.com/package/%40lobehub/icons-static-svg)

## 推荐的缓存与映射设计

### 1. 只缓存命中的资产

采用目录：

```text
apps/web/src/assets/service-icons/
  grafana.svg
  gitea.svg
  opengist.svg
  cloudreve.svg
  immich.svg
  teslamate.svg
  manifest.json
  LICENSE.dashboard-icons
```

`manifest.json` 至少记录：

```json
{
  "source": "https://github.com/homarr-labs/dashboard-icons",
  "commit": "0d6481f2a87cf611e2bf25adcf8fb07351ed2440",
  "license": "Apache-2.0",
  "icons": {
    "grafana": { "file": "grafana.svg", "sha256": "..." }
  }
}
```

更新动作应是显式的开发操作，而不是页面加载时下载：从固定 commit（不能用可变的 `main`/`latest`）获取 allowlist 中的 slug，校验 HTTP 状态、MIME、大小上限和 SHA-256，再替换本地文件。Vite 对生产资源生成内容哈希，API 仅对 `/assets` 设置一年 immutable 缓存；这样私网或互联网断开时仍有图标，也不会把 CDN 可用性变成首页依赖。

如对 SVG 运行 SVGO 或做其他修改，需要在第三方 notices 中注明修改；未经审查的远程 SVG 不应直接内联进 DOM。缓存资产通过源码 import 取得 Vite 生成的哈希 URL，再作为普通 `<img>` 使用。

### 2. 映射必须是小型 allowlist

建议把品牌识别与文件路径分开：

```ts
const SERVICE_ICON_ALIASES = {
  grafana: ['grafana'],
  gitea: ['gitea', 'git with a cup of tea'],
  opengist: ['opengist'],
  cloudreve: ['cloudreve'],
  immich: ['immich'],
  teslamate: ['teslamate'],
} as const;
```

匹配时对标题做小写和空白规范化；只允许 alias 返回代码中已导入的图标。不要把任意书签标题拼进文件路径。当前 `2283` 规则仅服务于已确认的 Immich 导入记录，其他未命中的 IP 标题统一显示通用服务图标；未来可允许用户在编辑书签时选择 `icon_key`。

### 3. 不建议的方案

- 不直接保存 `cdn.jsdelivr.net/...@main/...`：版本可变，离线失效，也没有真正满足“要缓存”。
- 不安装或复制完整图库：本项目当前只需几个文件；完整库只增加 `node_modules`、构建上下文和许可证维护面。
- 不继续把 Google S2 favicon 当作私网服务兜底：公共服务无法访问私网 IP，IP 本身也没有可推断的品牌身份。
- 不运行 selfh.st Docker sidecar，除非以后需要上千个图标的动态检索；它确实自带缓存，但当前六个静态文件不值得增加一个常驻服务。

## 可复现数据

仓库覆盖和文件数来自以下官方提交：

- Dashboard Icons [`0d6481f`](https://github.com/homarr-labs/dashboard-icons/tree/0d6481f2a87cf611e2bf25adcf8fb07351ed2440)：3,295 个 `svg/` 条目；六个选择项合计 143,239 bytes。
- selfh.st/icons [`e53fe4e`](https://github.com/selfhst/icons/tree/e53fe4e3dea2360e1a16b8e2fc6f0b54844f71dd)：2,434 个去除 light/dark 后的名称，7,115 个 SVG。
- Simple Icons [`34c2250`](https://github.com/simple-icons/simple-icons/tree/34c22501f9ac9f22b12f825677ccbab1fb22e14b)：3,453 个 `icons/*.svg`；npm 体积另以官方 registry 的 `npm view simple-icons@latest dist.unpackedSize dist.fileCount` 核对。

这些数值是快照，不应当成为运行时逻辑；真正需要固定的是 manifest 中的来源 commit、选定 slug、哈希和许可证记录。

> 许可证部分是工程合规摘要，不构成法律意见。所有候选都包含第三方品牌标识；开源仓库许可证不能替代品牌方的商标使用规则。
