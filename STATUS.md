# RoleReady（原 ProofCV）· 实现现状

> 记录设计稿到代码的落地进度。设计源见 `project/ProofCV.dc.html`，需求脉络见 `chats/`，交接说明见 `project/design_handoff_proofcv/README.md`。
> 品牌：产品正式定名 **RoleReady**，标识为深色圆角方块 + 白色 R + 紫蓝渐变上行箭头（`web/src/components/BrandMark.tsx`，favicon 为 `web/src/app/icon.svg`）。本机存储键仍沿用 `proofcv*` 以保证老用户数据不丢；备份文件导出标识改为 `roleready`，导入兼容旧标识。

## 一句话现状

在 v1（17 页高保真还原）的基础上完成 **v2 迭代**：产品重心收敛为「岗位申请包」，页面收敛到 8 个，整条主流程真实可操作并形成反哺闭环——**导入旧简历 → 访谈补全 → 职业证据 → 导入岗位 → 岗位专属简历 → 面试 QA → 模拟面试 → 真实录音复盘 → 复盘结果经确认后更新下一版 QA / 简历 / 证据**。v2.1 接入两项真实能力：**Boss 直聘爬虫产物批量导入岗位**、**本地 Chrome 真实导出简历 PDF**（Telos 同构）。v2.2 完成**真实 AI 接入**（设置页填用户自己的 API URL + Key，双协议透传，平台不托管）与**全量本机持久化**（IndexedDB + 备份导出/导入迁移）；未配置 Key 时保持 mock 演示模式。v2.3 为模拟面试 / AI 访谈加入**浏览器实时语音输入**（免打字，识别结果确认后发送）。v2.4 落地 **Agent 三件套**（批量岗位分析排序、带工具的面试官/访谈官、一键备齐申请包编排）——全部带确认关卡，工具调用全程透明展示。

**首页 v3（叙事重构）**：`web/src/components/Home.tsx` 整体重写为连续滚动叙事，视觉体系（米白底 / 黑标题 / 紫强调 / 设计 token）未推翻。结构：首屏「原文 → AI 追问 → 重写 → 追问预演 → 就绪」慢速循环案例演示 → ① 旧简历模糊句被逐句标记（scrollytelling）→ ② AI 访谈问答、散落信息归位成证据卡（scrollytelling）→ ③ 三岗位（业务前端/前端基础设施/AI 应用工程）同经历切换写法、高亮差异 → ④ 面试钩子句连线到预测/深挖/答案/风险四张浮层卡 → ⑤ 录音转录逐行标记（清楚/含糊/被追问/缺证据/新问题）并进入下一轮 QA 闭环 → 最终「岗位申请包」逐项勾选状态卡 +「机会无法保证，准备可以」。毛玻璃仅用于浮层卡；支持 `prefers-reduced-motion`（全部呈现静态终态）；移动端关闭 scrollytelling 降级为整段渐显；所有 CTA 接入真实流程（导入 / 演示 / 岗位列表 / j1 演示申请包）。样式基建在 `globals.css` 的 `hv-*` 段。应用内已与首页视觉同步：全局背景统一为暖米白（`--app-bg`）、顶栏毛玻璃、工作台首引导条用玻璃卡、深色行动卡加 mono 小标签、区块级联入场（`pcv-fade`），共享微交互类（`pcv-press` 悬停轻抬 / `pcv-row` 行悬停浅紫底 / `pcv-link` 链接）已接入 `ui.tsx` 的 Btn、JobChips 与工作台，其余页面自动继承，均支持 reduced-motion。导航层级重构：侧边栏把「申请包总览 / 专属简历 / 面试 QA / 模拟面试 / 面试复盘」收进「当前申请包」分组（显示当前岗位、可切换），申请包页头部新增五步准备进度流水线（每步可点击跳转、带 ✓/!/○ 状态与告警），正文按 01 岗位拆解 / 02 证据匹配 / 03 迭代记录编号小节组织，拆解网格改为三短列 + 隐含要求整行双栏，替代原先高低不齐的 2×2 与底部四张模块大卡。

## 技术栈与位置

- 代码目录：**`web/`**（Next.js App Router + TS + Tailwind v4 + Zustand）
- 运行：`cd web && npm install && npm run dev` → http://localhost:3000
- 视觉沿用 v1 设计语言（设计 token / 字体 / 动画在 `web/src/app/globals.css`），未推翻。

## 页面（8 个业务页 + 设置，不再扩张）

| 页面 | 文件 | 说明 |
| --- | --- | --- |
| 工作台 | `screens/Dashboard.tsx` | 下一步行动引擎（「你现在最应该继续做什么」）+ 当前岗位 / 待完善证据 / 待准备问题 / 最近复盘 + 可关闭的首次引导 |
| 职业证据库 | `screens/Evidence.tsx` | 证据卡含：名称/背景/实际负责/关键行动/难点/协作/结果/技能/来源/确认状态，卡内可编辑；「导入旧简历」（`Import.tsx`）与「AI 访谈」（`Interview.tsx`）作为证据流程的子步骤保留，不占导航位 |
| 岗位列表 | `screens/Jobs.tsx` | 内联新增（公司/岗位/JD）→ 创建申请包；**导入 Boss 直聘数据**（boss-zhipin-scraper 的 boss_jobs/boss_details JSON，文件或粘贴，按 id 合并、缺 JD 如实标注、预览勾选确认、与已有岗位去重）批量创建申请包；状态推进 ‹ ›；卡片显示准备阶段与 QA/模拟/复盘计数 |
| 岗位申请包 | `screens/Package.tsx` | **核心页**：JD + 拆解 + 匹配分析（重点写 / 弱化 / 缺证据 / 禁止夸大四类明确结论）+ 简历/QA/模拟/复盘四模块入口 + 历次优化建议时间线 |
| 简历编辑器 | `screens/Resume.tsx` | 一份简历绑定一个岗位；每条内容关联证据（已确认/待确认/证据不足）；AI 建议逐条接受/拒绝/修改；★ 面试钩子标记；易被追问提示；多版本保存/恢复；改动后提示 QA/模拟已过时；保留 Telos 模板/自定义轨；**导出 PDF 为真实导出**（Telos 同构的 Puppeteer HTML→PDF：`/api/export/pdf` + puppeteer-core + 本地 Chrome，`lib/chrome.ts` 自动定位、`CHROME_PATH` 可覆盖；内部标注已核验/证据不足/★ 不会出现在给企业的 PDF 里） |
| 面试 QA | `screens/Qa.tsx` | 30s/2min 自我介绍、项目讲述、简历追问、技术/业务/协作/风险/反问；每题标注来源 bullet、对应岗位要求、深挖追问；准备状态：未准备/准备中/已掌握/高风险；答案可编辑；简历更新后显示过时横幅 |
| 模拟面试 | `screens/Mock.tsx` | 基于申请包（简历+钩子+薄弱点+历史缺口）的面试官；**语音回答**（浏览器 Web Speech API 边说边转文字，识别结果可修改后再发送，Firefox 等不支持时降级打字）；结束生成报告：较好/被问穿/不完整/需重备/简历修改建议/下次重点；历史场次可回看 |
| 面试记录与复盘 | `screens/Records.tsx` | 录音上传（模拟四段流水线：上传→转录→区分说话人→分析）或粘贴转写；时间轴对话（说话人+含糊/中断/缺证据/矛盾标记）、问答提取（追问链/简历触发/钩子命中/更好答法）、结构化笔记、**修改建议须用户逐条确认**后写入 QA（origin=real）/ 简历（转为待决策建议）/ 证据卡备注 |
| 设置 | `screens/Settings.tsx` | **AI 接入**：用户自己的 API URL + Key + 模型名，Anthropic 原生 / OpenAI 兼容双协议，测试连接，Key 明文存本机 localStorage（可选「仅本次使用」、一键清除）；**数据与迁移**：导出备份 JSON / 导入（先预览数量对比、明确确认才覆盖）/ 恢复演示数据（两次点击确认），显示站点存储用量 |

已按「页面范围/暂时不要做」删除：岗位市场、求职进度看板、求职材料中心、GitHub 导入、设置页、公开主页/公开简历分享（Telos 简历渲染 `SpecRenderer.tsx` 保留在编辑器内）。

## 状态与数据

- 单一数据源：`web/src/lib/store.ts`（Zustand）。核心对象见 `web/src/lib/types.ts`：升级版 `Evidence`（含 responsibilities/challenges/collaboration）、带建议与钩子的 `ResumeBullet`、`ResumeVersion`、`QaItem`（cat/prep/fromBullet/jdReq/followUps/origin）、`MockSession`+`MockReport`、`InterviewRecord`（transcript/qas/hooks/notes/suggestions）。
- **本机持久化**：zustand persist + IndexedDB 适配器（`lib/storage.ts`，隐私模式回落 localStorage），只落领域数据与导航位置，瞬态不落盘；`skipHydration` + 挂载后手动 rehydrate 避免 SSR 注水竞争；schema 升级走 persist 的 version/migrate。**平台无数据库，资料全在用户设备**；换设备迁移 = 设置页导出 JSON + 新设备导入（导入前预览数量对比并需明确确认，见 `lib/backup.ts`）。
- 反哺闭环：简历改动 → `qaStale/mockStale` 提示刷新；复盘建议确认后分别落到 QA / 简历待决策建议 / 证据卡备注；QA 中标注「来自真实面试」。
- 演示数据：`web/src/lib/seed.ts`。j1（字节）预置完整申请包（含一场模拟 + 一次真实一面复盘与待确认建议），j2（腾讯）仅分析，j3（AI 独角兽）全空白供从零走闭环。

## AI（真实接入已完成，用户自带 Key）

所有 AI 动作统一走 `web/src/lib/ai.ts` 的 `ask()`，模式由设置页的运行时配置决定（`lib/aiConfig.ts`，存本机 localStorage）：

- **未填 Key**：mock 模式，`ask()` 返回 null，各处理器回落到**不编造事实**的确定性兜底（证据→简历编译、简历→QA 生成、JD 关键词匹配、转写解析）。侧边栏「设置」项常驻显示当前模式（Mock / AI 已接入）。
- **填了 URL + Key**：真实模式。`POST /api/ai`（`app/api/ai/route.ts`）是**纯透传路由**——支持 Anthropic 原生（/v1/messages）与 OpenAI 兼容（/chat/completions，中转站通用）双协议，自动补全端点路径，Key 随请求内存转发、不落盘不记日志；上游报错原话带回（错 Key/错模型/欠费可直接看到），调用失败会 toast 告知并回落兜底，不假装成功。
- **语音输入（v2.3）**：模拟面试与 AI 访谈支持边说边转文字——`lib/speech.ts`（Web Speech API，zh-CN、continuous+interim、停顿自动续录）+ `components/VoiceInput.tsx`。零配置零成本；如实标注：识别由浏览器厂商语音服务完成（Chrome 发给 Google 语音服务，非本地推理），Firefox 不支持时降级打字；识别结果只进输入框，**用户改完自己发送，不自动提交**。
- 音频**文件**转写（面试记录页的录音上传）仍需接转录服务——Web Speech API 只能识别麦克风流，不能转录文件；上传路径目前为演示流水线，粘贴转写路径为真实解析。`NEXT_PUBLIC_AI_LIVE` 环境变量已退役。

## 验证

- `tsc --noEmit`、`next build`、`eslint` 通过（仅 1 条 v1 遗留的 font-link 误报警告）。
- 无头 Chromium 全闭环走查 **DRIVE_OK**（`导入→证据编辑/确认→访谈并入→新建岗位→分析 JD→生成简历→生成 QA→接受建议/标钩子/存版本→QA 过时横幅→模拟面试出报告→复盘建议逐条采纳→QA/简历/证据联动验证→粘贴转写复盘→上传流水线→工作台`），零运行时错误。
- v2.1 增量走查 **E2E_OK**：Boss JSON 粘贴/双文件导入→按 id 合并→「仅摘要」如实标注→批量创建→重复导入全部跳过→导入 JD 直通申请包分析；导出 PDF 真实下载（`%PDF` 魔数、pdftotext 可抽全文=ATS 可解析、内部标注 0 出现）。
- v2.2 增量走查 **E2E_V22_OK**（本地假 AI 上游同时模拟双协议并校验端点/Key）：错误 Key 上游 401 原话回显→OpenAI 兼容/Anthropic 原生测试连接均成功→侧边栏徽标切换→真实透传分析 JD（结果带上游标记，非兜底）→刷新后配置与数据从 IndexedDB 恢复→导出备份校验内容→两次确认清空恢复演示数据→导入备份预览+确认后完整还原→再次刷新仍在。v2.1 用例回归通过。
- v2.4 增量走查 **E2E_V24_OK**（假上游支持 tool_use 循环）：导入 2 岗→批量分析（进度→完成 toast→5 岗覆盖度排序+「先准备这个」）→一键备齐（分析跳过→简历→无待决策建议自动续跑 QA→备齐横幅）→切真实模式→模拟面试官发起 search_evidence（透明记录「查证据库→命中」+ 最终追问来自上游标记）→访谈官并行调用查证据库+起草证据卡（右栏草稿卡实时出现、确认关卡文案在）。v2.2/v2.3 用例回归通过。
- 修复一处 zustand v5 选择器返回新数组导致的无限重渲染（React #185）。

## Telos 合并指引（为「给 Telos 提 PR」准备）

本仓库刻意与 Telos 保持同构，迁移时基本是平移：

- `web/src/lib/templates.ts` + `web/src/components/SpecRenderer.tsx` 本就移植自 Telos（TemplateSpec / SpecRenderer），合并时以 Telos 的 Zod schema 版本为准，把本仓库新增的 bullet 标注（evStatus/hook，带 `data-pcv-annot`）作为可选扩展带过去。
- `web/src/app/api/export/pdf/route.ts` + `web/src/lib/chrome.ts`：与 Telos 的 Puppeteer 导出同构（HTML→PDF、printBackground、A4），差异只在“客户端送已渲染 DOM”这一步，可直接并入或替换其导出路由。
- `web/src/lib/bossImport.ts` + `screens/Jobs.tsx` 的导入面板：纯前端模块，无 ProofCV 专有依赖（只依赖 store 的 `createJobsFromImport`），可整体搬运。
- `web/src/app/api/ai/route.ts`（双协议透传）+ `lib/aiConfig.ts` + `lib/storage.ts`（IndexedDB persist 适配器）+ `lib/backup.ts` + `screens/Settings.tsx`：「用户自带 Key + 资料全本机」这套能力零 ProofCV 专有依赖，可整体搬给 Telos。
- 注意：本会话的 GitHub 权限限定在本仓库（跨账号仓库无法挂载）。实际提 PR 时，**新开一个以 `xiashitao/Telos` 为源的会话**，把上述模块搬入并按 Telos 结构适配。

## Agent 能力（v2.4 已实现）

原则不变：**不做全自动求职 Agent**（护城河是证据确认、逐条采纳这套人工关卡；自动投递仍明确排除）。已落地的三个「带确认关卡的 Agent」：

1. **批量岗位分析**（岗位列表页「准备优先级」面板）：一键排队分析所有未分析岗位（`batchAnalyze`，实时进度），完成后按证据覆盖度排序，每岗标注缺证据项/弱匹配/风险数，#1 标「先准备这个」——只做分析排序，不替用户生成任何内容。mock/真实模式均可用。
2. **带工具的面试官/访谈官**（`lib/agentTools.ts` + `ask` 之外新增 `askAgent` 工具循环，上限 4 轮）：模拟面试官可调 `search_evidence`（追问前核实说法有无证据支撑，没有就深挖）；访谈官另有 `draft_evidence_card`（把问清楚的事实实时沉淀为右栏草稿卡，**只记原话事实、结束访谈经用户确认才入库**，且只填补证据卡的空字段）。每次工具调用都在聊天气泡上方显示透明记录（「⚙ 查证据库「×」→ 命中 N 条」）。
3. **一键备齐申请包**（申请包页）：分析 JD→生成简历→**若有 AI 建议则暂停**（黄色引导条：去逐条确认或跳过）→生成 QA→完成横幅引导去模拟面试。`prepPackage`/`prepContinueQa` 状态机，进度实时展示。

技术边界：Agent 工具循环**仅 Anthropic 原生协议**（`/api/ai` 对 OpenAI 兼容档带 tools 的请求返回 400，聊天自动回落普通生成）；工具在用户浏览器本地执行（读证据库/写草稿），不出设备；Agent 不可用或失败时静默回落 `ask()`/本地兜底并 toast 告知。

## 待办（未擅自扩展）

- 录音**文件**接真实转写服务（上传路径目前是演示流水线；实时语音输入已上线）。
- 长对话（访谈/模拟面试）加流式输出；路由改为真实 URL（现为 store 状态路由）。
