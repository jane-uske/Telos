# RoleReady

> 你的职业资料属于你，不属于平台。

把零散经历整理成**站得住脚的证据**，再针对每个目标岗位生成专属简历、面试 QA、模拟面试与真实面试复盘——每面一次，下一次准备得更充分。

**核心主流程**：开始使用 → 整理经历（上传旧简历 / AI 访谈从零整理）→ 添加目标岗位 → 分析岗位 → 生成岗位专属简历 → 生成面试 QA → 模拟面试 → 粘贴真实面试转写复盘 → 确认后反哺简历 / QA / 经历 → 工作台给出下一步。

## 隐私模型（产品底线）

- 简历、经历、岗位、QA、模拟与复盘**默认只存当前浏览器的 IndexedDB**，平台没有你的求职正文。
- 只有你主动使用在线 AI 时，完成该任务所需内容才被**临时发送处理，用完即弃**，服务端只记身份与用量元数据。
- 登录（GitHub / 邮箱验证码）只管在线 AI 的身份与额度：登录不会上传本机数据，退出登录、删除账号都不影响本机数据。
- 未登录 = **基础模式**：全部本地功能可用（整理/编辑/岗位/模板/导入导出/打印 PDF），规则生成的结果会明确标注「基础模式 · 未调用在线 AI」，绝不伪装成 AI。
- 换设备迁移 = 设置页导出备份 JSON + 新设备导入；可随时清空本机数据。

## AI 三种通路

| 模式 | 触发条件 | 链路 |
|---|---|---|
| 在线 AI（默认） | 已登录 | 浏览器 → api.remi.run → sub2api.remi.run → 模型（契约见 [docs/BACKEND-API.md](docs/BACKEND-API.md)） |
| 自带 Key（高级） | 设置页填自己的 URL+Key | 浏览器 → 本应用 `/api/ai` 纯透传 → 你填的服务商（无需登录） |
| 基础模式 | 两者皆无 | 本地确定性规则，不联网，明确标注 |

## 开发

```bash
cd web
npm install
npm run dev          # http://localhost:3000
npm run build        # 生产构建（无需任何环境变量 / Chrome / AI）
npx tsc --noEmit && npx eslint src
```

- 技术栈：Next.js 16 App Router + React 19 + TypeScript + Tailwind v4 + Zustand（persist → IndexedDB）。
- 本地联调托管后端：`NEXT_PUBLIC_RR_API_BASE=http://localhost:8787 npm run dev`（假后端见 `docs/BACKEND-API.md` 末尾）。
- 部署：Vercel，Root Directory 设为 `web`，见 [docs/VERCEL-DEPLOY.md](docs/VERCEL-DEPLOY.md)。

## 仓库结构

| 路径 | 内容 |
|---|---|
| `web/` | 应用本体（唯一需要部署的目录） |
| `docs/PRODUCT-PLAN.md` | 产品规划与分阶段实施记录 |
| `docs/BACKEND-API.md` | api.remi.run 托管后端契约（登录 / AI 代理 / 用量审计） |
| `docs/VERCEL-DEPLOY.md` | 部署指南 |
| `STATUS.md` | 实现现状（按版本迭代记录） |
| `project/`, `chats/` | 最初的 Claude Design 高保真交接稿（历史资料，勿删） |

## 明确不做

云端保存简历正文、多设备同步、自动投递、自动打招呼、社区、企业端、复杂会员、公开职业主页、DOCX 复杂解析、真实录音转录（「即将上线」占位，不做假动画）、大规模视觉重构。
