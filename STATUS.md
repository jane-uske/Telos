# ProofCV · 实现现状

> 记录设计稿到代码的落地进度。设计源见 `project/ProofCV.dc.html`，需求脉络见 `chats/`，交接说明见 `project/design_handoff_proofcv/README.md`。

## 一句话现状

ProofCV 高保真设计已在 **Next.js 16 + TypeScript + Tailwind** 里完整重建，**17 个页面全部落地、整条求职闭环可点通**，代码在 `web/`。当前 AI 为 mock 模式（真实接口已预留），未接后端。

## 技术栈与位置

- 代码目录：**`web/`**（Next.js App Router + TS + Tailwind v4 + Zustand）
- 运行：`cd web && npm install && npm run dev` → http://localhost:3000
- 落地方式：设计稿的内联样式即像素级规范，按其 1:1 还原为常规 React 组件；设计 token / 字体 / 动画集中在 `web/src/app/globals.css`。

## 已实现页面（17 / 17）

| 分组 | 页面 | 文件 |
| --- | --- | --- |
| — | 官网首页 | `components/Home.tsx` |
| — | 登录与引导 | `components/Auth.tsx` |
| 职业资产 | 工作台 Dashboard | `components/screens/Dashboard.tsx` |
| 职业资产 | 简历导入与解析 | `components/screens/Import.tsx` |
| 职业资产 | AI 职业访谈（旗舰，多轮对话） | `components/screens/Interview.tsx` |
| 职业资产 | 职业证据库 | `components/screens/Evidence.tsx` |
| 职业资产 | GitHub 项目导入 | `components/screens/Github.tsx` |
| 求职作战 | 岗位市场分析 | `components/screens/Market.tsx` |
| 求职作战 | 岗位管理 | `components/screens/Jobs.tsx` |
| 求职作战 | JD 分析与证据匹配 | `components/screens/Jd.tsx` |
| 求职作战 | 定制简历生成（Telos 模板体系） | `components/screens/Resume.tsx` + `components/SpecRenderer.tsx` |
| 求职作战 | 求职材料中心 | `components/screens/Materials.tsx` |
| 求职作战 | 面试复盘 | `components/screens/Review.tsx` |
| 求职作战 | 求职进度看板 | `components/screens/Pipeline.tsx` |
| 求职作战 | 账号与隐私 | `components/screens/Settings.tsx` |
| 公开 | 公开职业主页 | `components/PublicProfile.tsx` |
| 公开 | 公开简历分享页 | `components/PublicResume.tsx` |

外壳（236px 侧边栏 + 58px 顶栏）：`components/AppShell.tsx`；公共组件：`components/ui.tsx`、`components/Toast.tsx`。

## 状态与数据

- **单一数据源**：`web/src/lib/store.ts`（Zustand）——证据库、岗位、各岗位的 JD 分析/匹配/简历/材料/复盘、简历 `TemplateSpec`、市场数据，以及全部 AI 处理器。证据库为共享资产，岗位复用。
- **演示数据**：`web/src/lib/seed.ts`——「林深·全栈/前端冲大厂」人设，照原型逐字移植，离线也全程可点通。

## AI（当前 mock，一个开关切真实）

所有 AI 动作统一走 `web/src/lib/ai.ts` 的 `ask()`。mock 模式下 `ask()` 延迟后返回 `null`，各处理器回落到高质量种子数据（加载动画照常）——与原型的失败兜底路径一致。

切真实：设 `NEXT_PUBLIC_AI_LIVE=1` + 实现 `POST /api/ai`（服务端用 `ANTHROPIC_API_KEY` 调 Anthropic，返回 `{ text }`）。`ask()` 已在 live 时自动 POST，无需改其他代码；对话/访谈建议走流式。

## 两个开源集成（照真实源码移植）

- **Telos**（`xiashitao/Telos`）→ 定制简历。`web/src/lib/templates.ts` 为移植的 **TemplateSpec**（受约束 JSON 设计参数 + 14 套模板），`web/src/components/SpecRenderer.tsx` 为移植的 **SpecRenderer**（单栏/左侧栏/右侧栏/顶部色块四骨架）。生产应复用其 Zod schema 与 Puppeteer PDF/HTML 导出。
- **boss-zhipin-scraper**（`eatmoreduck/boss-zhipin-scraper`）→ 岗位市场。7 个维度与优化提示词对齐 `scripts/job_summary.py`。抓取需本地已登录 Chrome 的 CDP，不能在浏览器内运行——生产由该 Python 作后端/CLI，前端只读其 JSON 产物。

## 验证

- `tsc --noEmit`、`next build` 均通过；`eslint` 通过（仅 1 条 App Router 下的 font-link 误报警告）。
- 无头 Chromium 全流程走查 **DRIVE_OK**：12 个 tab、模板切换、自定义/AI 改写栏、访谈深挖、材料/JD 生成、公开主页——零运行时错误。
- 已修复一处真实 bug：zustand v5 选择器每次返回新对象（`curSpec()`）导致简历页无限重渲染（React #185），已改为纯函数 `computeSpec()` 在组件内计算。

## 待办（未擅自扩展）

- 接真实 Anthropic：实现 `/api/ai` 服务端路由 + 流式。
- 真实 PDF 导出（接 Telos 的 Puppeteer 导出）。
- 岗位市场接 boss-zhipin-scraper 的 JSON 产物 / 后端。
- 路由改为真实 URL（现为 store 状态路由）、数据持久化（localStorage / zustand persist）。
