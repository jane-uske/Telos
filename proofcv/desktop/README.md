# Telos 桌面壳（Electron）

把 `../web`（telos.remi.run 线上同款）打包成 macOS 桌面应用。**渲染层零改动**：
Web 应用静态导出后由 `app://telos` 自定义协议伺服，原来的三个 Next API 路由在主进程原生实现。

```
渲染进程（静态导出的 SPA，代码与线上完全一致）
   │  fetch("/api/…")                    fetch(NEXT_PUBLIC_RR_API_BASE + …)
   ▼                                      ▼
app://telos 协议处理器（main.js route()）
   ├─ /api/ai          → api/ai.js   主进程 net.fetch 透传（BYOK，走系统代理）
   ├─ /api/export/pdf  → api/pdf.js  隐藏窗口 + printToPDF（无需本地 Chrome）
   ├─ /api/health      → 直接应答 { desktop: true }
   ├─ /rr-api/*        → api.remi.run 同源代理（托管登录/AI 免 CORS）
   └─ 其余             → lib/static.js 伺服 web-out/（SPA 回落 index.html）
```

## 从零构建（新机器拉下来即编即跑）

```bash
git clone git@github.com:jane-uske/Telos.git
cd Telos/proofcv/web && npm install        # Node ≥ 22
cd ../desktop && npm install               # electron + electron-builder
npm run build                              # 导出 web → 冒烟验收 → 打 dmg（三步连跑）
```

分步命令：

```bash
npm run build:web    # 静态导出 ../web → web-out/（⚠️ 期间别开着 web 的 next dev）
npm run smoke        # 无头验收：hydration/子路由/localStorage/PDF 导出/OAuth 注入全链路
npm run dist         # 打 dmg → dist/Telos-<版本>-<本机架构>.dmg
npm start            # 直接跑开发壳（要求 web-out/ 已构建）
```

网络不畅时（Electron 二进制下载卡住）：

```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm install
```

> dmg 目标是 macOS（跟随本机架构）。其他平台没配打包目标，但 `npm start` 跑开发壳不受限。

## 与 Web 版的行为差异

- **数据**：照旧存 IndexedDB/localStorage，但落在 Electron 的 userData 里，与浏览器互不相通。
  从浏览器迁移用应用内设置页的「导出/导入备份 JSON」。
- **PDF 导出**：Electron 即 Chromium，去掉了找本地 Chrome 的依赖；离线时 Noto 字体拉不到，
  回落 PingFang SC（中文照常成字）。
- **托管模式**：邮箱验证码登录、托管 AI、额度查询经 `/rr-api` 代理可用。
- **GitHub OAuth**：桌面版在受控弹窗里走完 网关→GitHub→回跳；回跳目标改写为
  Web 源（网关白名单内），token 在导航层截获后以 `#rr_token=` 重载主窗口——
  与 Web 流程同构，Web 版页面不会真的加载。弹窗里的 GitHub 会话存在 Electron
  自己的 profile 里，与系统浏览器不共享（首次要在弹窗里登一次 GitHub）。
- **签名**：dmg 未签名（`identity: null`）。本机能跑；分发给别人需 Apple Developer 签名+公证，
  否则对方要右键绕 Gatekeeper。

## 维护约定

- `api/ai.js` 与 `web/src/app/api/ai/route.ts` 逻辑同构，语义变更需两边同步改。
- Web 侧的桌面开关都挂在 `TELOS_DESKTOP=1`（见 `web/next.config.ts`）；
  export 模式下 `distDir`（`.next-desktop`）就是导出目录，没有独立的 `out/`。
- 新增页面路径时更新 `web/src/app/[[...slug]]/page.tsx` 的 `generateStaticParams`
  （与 `routing.ts` 的 `TAB_TO_SEG` 保持一致）；漏了也有 SPA 回落，只是少一份预渲染。
