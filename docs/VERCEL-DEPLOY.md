# RoleReady · Vercel 部署指南

> **当前线上（2026-07-16）**：Vercel 项目 **`roleready`**（team janes-projects），生产域名
> **https://roleready.remi.run**（Cloudflare CNAME → cname.vercel-dns.com，misconfigured=false）。
> 未接 Git 集成，发版走 CLI：`cd web && npx vercel deploy --prod`。
> Deployment Protection 已设为仅保护 Preview（production 公开）。
> `NEXT_PUBLIC_RR_API_BASE` 未设置，走代码默认 `https://api.remi.run`（后端已上线，见 `docs/BACKEND-API.md`）。

## 一次性设置

1. Vercel 新建项目，导入本仓库。
2. **Root Directory 设为 `web`**（Settings → General → Root Directory）。其余保持默认：
   - Framework Preset：Next.js（自动识别）
   - Build Command：`npm run build`
   - Install Command：`npm install`
3. 直接 Deploy 即可——**构建不访问 AI、不要求 Chrome、不要求任何私有环境变量**。

## 环境变量（全部可选）

| 变量 | Preview | Production | 说明 |
|---|---|---|---|
| `NEXT_PUBLIC_RR_API_BASE` | 可指向测试后端 | `https://api.remi.run` | 托管后端（登录/在线 AI/用量）基地址；不设则默认 `https://api.remi.run`。后端契约见 `docs/BACKEND-API.md` |

建议：Preview 环境指向 staging 后端（或暂不设置，未登录时全站为基础模式 + BYOK，可正常演示本地功能）；Production 指向正式 api.remi.run。改动纯前端逻辑时 Preview 无需任何变量。

`CHROME_PATH` 仅供本地开发的服务端 PDF 导出用，**不要**配到 Vercel。

## 部署后自检

1. `GET https://<domain>/api/health` → `{"ok":true,"app":"roleready",...}`，响应头含 `Cache-Control: no-store`。
2. 响应头（任意页面）：`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy: camera=(), geolocation=(), microphone=(self)`（语音输入需要麦克风）。
3. 首页 →「开始使用」→ 空白工作台；「查看演示」→ 演示模式徽标。
4. 简历编辑器 →「打印 / 保存 PDF」：浏览器打印预览里只有干净简历，无「已核验/证据不足/★」等内部标注。**线上 PDF 全部走浏览器打印，不依赖服务端 Chrome**；「服务端导出」按钮在 Vercel 上会明确报错（预期行为，仅本地有 Chrome 时可用）。
5. 登录（需后端就绪）：GitHub 跳转回来自动续跑刚才的 AI 操作；`/admin` 管理员可看用量总览。

## 已知边界

- `POST /api/ai` 是 BYOK（用户自带 Key）纯透传路由，无状态、不落盘，可在 Vercel Functions 正常运行（上游超时 90s，注意函数超时配置需 ≥ 90s 或调低 `UPSTREAM_TIMEOUT`；Hobby 计划默认 10s 上限时 BYOK 长请求会被截断——推荐引导用户走登录托管链路）。
- `POST /api/export/pdf` 依赖本机 Chrome，Vercel 上必然失败且会向用户明确报错——这是设计内行为，不影响主流程（打印路径不经过它）。
- 用户数据全部在浏览器 IndexedDB，切换域名（例如从 preview 域切到正式域）等同于换设备——需要用设置页的导出/导入备份迁移。
