# ProofCV · 实现现状

> 记录设计稿到代码的落地进度。设计源见 `project/ProofCV.dc.html`，需求脉络见 `chats/`，交接说明见 `project/design_handoff_proofcv/README.md`。

## 一句话现状

在 v1（17 页高保真还原）的基础上完成 **v2 迭代**：产品重心收敛为「岗位申请包」，页面收敛到 8 个，整条主流程真实可操作并形成反哺闭环——**导入旧简历 → 访谈补全 → 职业证据 → 导入岗位 → 岗位专属简历 → 面试 QA → 模拟面试 → 真实录音复盘 → 复盘结果经确认后更新下一版 QA / 简历 / 证据**。AI 仍为 mock 模式（真实接口已预留），未接后端。

## 技术栈与位置

- 代码目录：**`web/`**（Next.js App Router + TS + Tailwind v4 + Zustand）
- 运行：`cd web && npm install && npm run dev` → http://localhost:3000
- 视觉沿用 v1 设计语言（设计 token / 字体 / 动画在 `web/src/app/globals.css`），未推翻。

## 页面（8 个，不再扩张）

| 页面 | 文件 | 说明 |
| --- | --- | --- |
| 工作台 | `screens/Dashboard.tsx` | 下一步行动引擎（「你现在最应该继续做什么」）+ 当前岗位 / 待完善证据 / 待准备问题 / 最近复盘 + 可关闭的首次引导 |
| 职业证据库 | `screens/Evidence.tsx` | 证据卡含：名称/背景/实际负责/关键行动/难点/协作/结果/技能/来源/确认状态，卡内可编辑；「导入旧简历」（`Import.tsx`）与「AI 访谈」（`Interview.tsx`）作为证据流程的子步骤保留，不占导航位 |
| 岗位列表 | `screens/Jobs.tsx` | 内联新增（公司/岗位/JD）→ 创建申请包；状态推进 ‹ ›；卡片显示准备阶段与 QA/模拟/复盘计数 |
| 岗位申请包 | `screens/Package.tsx` | **核心页**：JD + 拆解 + 匹配分析（重点写 / 弱化 / 缺证据 / 禁止夸大四类明确结论）+ 简历/QA/模拟/复盘四模块入口 + 历次优化建议时间线 |
| 简历编辑器 | `screens/Resume.tsx` | 一份简历绑定一个岗位；每条内容关联证据（已确认/待确认/证据不足）；AI 建议逐条接受/拒绝/修改；★ 面试钩子标记；易被追问提示；多版本保存/恢复；改动后提示 QA/模拟已过时；保留 Telos 模板/自定义轨 |
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
- 修复一处 zustand v5 选择器返回新数组导致的无限重渲染（React #185）。

## 待办（未擅自扩展）

- 接真实 Anthropic：实现 `/api/ai` 服务端路由 + 流式；录音接真实转写服务。
- 真实 PDF 导出（接 Telos 的 Puppeteer 导出）。
- 路由改为真实 URL（现为 store 状态路由）、数据持久化（zustand persist）。
