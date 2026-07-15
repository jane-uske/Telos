# ProofCV · 实现现状

> 记录设计稿到代码的落地进度。设计源见 `project/ProofCV.dc.html`，需求脉络见 `chats/`，交接说明见 `project/design_handoff_proofcv/README.md`。

## 一句话现状

在 v1（17 页高保真还原）的基础上完成 **v2 迭代**：产品重心收敛为「岗位申请包」，页面收敛到 8 个，整条主流程真实可操作并形成反哺闭环——**导入旧简历 → 访谈补全 → 职业证据 → 导入岗位 → 岗位专属简历 → 面试 QA → 模拟面试 → 真实录音复盘 → 复盘结果经确认后更新下一版 QA / 简历 / 证据**。v2.1 接入两项真实能力：**Boss 直聘爬虫产物批量导入岗位**、**本地 Chrome 真实导出简历 PDF**（Telos 同构）。AI 仍为 mock 模式（真实接口已预留）。

## 技术栈与位置

- 代码目录：**`web/`**（Next.js App Router + TS + Tailwind v4 + Zustand）
- 运行：`cd web && npm install && npm run dev` → http://localhost:3000
- 视觉沿用 v1 设计语言（设计 token / 字体 / 动画在 `web/src/app/globals.css`），未推翻。

## 页面（8 个，不再扩张）

| 页面 | 文件 | 说明 |
| --- | --- | --- |
| 工作台 | `screens/Dashboard.tsx` | 下一步行动引擎（「你现在最应该继续做什么」）+ 当前岗位 / 待完善证据 / 待准备问题 / 最近复盘 + 可关闭的首次引导 |
| 职业证据库 | `screens/Evidence.tsx` | 证据卡含：名称/背景/实际负责/关键行动/难点/协作/结果/技能/来源/确认状态，卡内可编辑；「导入旧简历」（`Import.tsx`）与「AI 访谈」（`Interview.tsx`）作为证据流程的子步骤保留，不占导航位 |
| 岗位列表 | `screens/Jobs.tsx` | 内联新增（公司/岗位/JD）→ 创建申请包；**导入 Boss 直聘数据**（boss-zhipin-scraper 的 boss_jobs/boss_details JSON，文件或粘贴，按 id 合并、缺 JD 如实标注、预览勾选确认、与已有岗位去重）批量创建申请包；状态推进 ‹ ›；卡片显示准备阶段与 QA/模拟/复盘计数 |
| 岗位申请包 | `screens/Package.tsx` | **核心页**：JD + 拆解 + 匹配分析（重点写 / 弱化 / 缺证据 / 禁止夸大四类明确结论）+ 简历/QA/模拟/复盘四模块入口 + 历次优化建议时间线 |
| 简历编辑器 | `screens/Resume.tsx` | 一份简历绑定一个岗位；每条内容关联证据（已确认/待确认/证据不足）；AI 建议逐条接受/拒绝/修改；★ 面试钩子标记；易被追问提示；多版本保存/恢复；改动后提示 QA/模拟已过时；保留 Telos 模板/自定义轨；**导出 PDF 为真实导出**（Telos 同构的 Puppeteer HTML→PDF：`/api/export/pdf` + puppeteer-core + 本地 Chrome，`lib/chrome.ts` 自动定位、`CHROME_PATH` 可覆盖；内部标注已核验/证据不足/★ 不会出现在给企业的 PDF 里） |
| 面试 QA | `screens/Qa.tsx` | 30s/2min 自我介绍、项目讲述、简历追问、技术/业务/协作/风险/反问；每题标注来源 bullet、对应岗位要求、深挖追问；准备状态：未准备/准备中/已掌握/高风险；答案可编辑；简历更新后显示过时横幅 |
| 模拟面试 | `screens/Mock.tsx` | 基于申请包（简历+钩子+薄弱点+历史缺口）的面试官；结束生成报告：较好/被问穿/不完整/需重备/简历修改建议/下次重点；历史场次可回看 |
| 面试记录与复盘 | `screens/Records.tsx` | 录音上传（模拟四段流水线：上传→转录→区分说话人→分析）或粘贴转写；时间轴对话（说话人+含糊/中断/缺证据/矛盾标记）、问答提取（追问链/简历触发/钩子命中/更好答法）、结构化笔记、**修改建议须用户逐条确认**后写入 QA（origin=real）/ 简历（转为待决策建议）/ 证据卡备注 |

已按「页面范围/暂时不要做」删除：岗位市场、求职进度看板、求职材料中心、GitHub 导入、设置页、公开主页/公开简历分享（Telos 简历渲染 `SpecRenderer.tsx` 保留在编辑器内）。

## 状态与数据

- 单一数据源：`web/src/lib/store.ts`（Zustand）。核心对象见 `web/src/lib/types.ts`：升级版 `Evidence`（含 responsibilities/challenges/collaboration）、带建议与钩子的 `ResumeBullet`、`ResumeVersion`、`QaItem`（cat/prep/fromBullet/jdReq/followUps/origin）、`MockSession`+`MockReport`、`InterviewRecord`（transcript/qas/hooks/notes/suggestions）。
- 反哺闭环：简历改动 → `qaStale/mockStale` 提示刷新；复盘建议确认后分别落到 QA / 简历待决策建议 / 证据卡备注；QA 中标注「来自真实面试」。
- 演示数据：`web/src/lib/seed.ts`。j1（字节）预置完整申请包（含一场模拟 + 一次真实一面复盘与待确认建议），j2（腾讯）仅分析，j3（AI 独角兽）全空白供从零走闭环。

## AI（当前 mock，一个开关切真实）

所有 AI 动作统一走 `web/src/lib/ai.ts` 的 `ask()`；mock 下返回 null，各处理器回落到**不编造事实**的兜底：证据→简历确定性编译、简历→QA 确定性生成、JD 关键词匹配、转写文本确定性解析（识别说话人/抽取问答/标记含糊）。切真实：`NEXT_PUBLIC_AI_LIVE=1` + 实现 `POST /api/ai`。音频转写需接转录服务（上传路径当前为演示流水线，粘贴转写路径为真实解析）。

## 验证

- `tsc --noEmit`、`next build`、`eslint` 通过（仅 1 条 v1 遗留的 font-link 误报警告）。
- 无头 Chromium 全闭环走查 **DRIVE_OK**（`导入→证据编辑/确认→访谈并入→新建岗位→分析 JD→生成简历→生成 QA→接受建议/标钩子/存版本→QA 过时横幅→模拟面试出报告→复盘建议逐条采纳→QA/简历/证据联动验证→粘贴转写复盘→上传流水线→工作台`），零运行时错误。
- v2.1 增量走查 **E2E_OK**：Boss JSON 粘贴/双文件导入→按 id 合并→「仅摘要」如实标注→批量创建→重复导入全部跳过→导入 JD 直通申请包分析；导出 PDF 真实下载（`%PDF` 魔数、pdftotext 可抽全文=ATS 可解析、内部标注 0 出现）。
- 修复一处 zustand v5 选择器返回新数组导致的无限重渲染（React #185）。

## Telos 合并指引（为「给 Telos 提 PR」准备）

本仓库刻意与 Telos 保持同构，迁移时基本是平移：

- `web/src/lib/templates.ts` + `web/src/components/SpecRenderer.tsx` 本就移植自 Telos（TemplateSpec / SpecRenderer），合并时以 Telos 的 Zod schema 版本为准，把本仓库新增的 bullet 标注（evStatus/hook，带 `data-pcv-annot`）作为可选扩展带过去。
- `web/src/app/api/export/pdf/route.ts` + `web/src/lib/chrome.ts`：与 Telos 的 Puppeteer 导出同构（HTML→PDF、printBackground、A4），差异只在“客户端送已渲染 DOM”这一步，可直接并入或替换其导出路由。
- `web/src/lib/bossImport.ts` + `screens/Jobs.tsx` 的导入面板：纯前端模块，无 ProofCV 专有依赖（只依赖 store 的 `createJobsFromImport`），可整体搬运。
- 注意：本会话的 GitHub 权限限定在本仓库（跨账号仓库无法挂载）。实际提 PR 时，**新开一个以 `xiashitao/Telos` 为源的会话**，把上述模块搬入并按 Telos 结构适配。

## 待办（未擅自扩展）

- 接真实 Anthropic：实现 `/api/ai` 服务端路由 + 流式；录音接真实转写服务。
- 路由改为真实 URL（现为 store 状态路由）、数据持久化（zustand persist）。
