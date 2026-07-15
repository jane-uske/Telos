# Handoff: ProofCV · AI 职业资产与求职作战平台

## Overview
ProofCV 帮程序员/互联网从业者从零散经历中提取**可追溯的职业证据**，再结合具体岗位生成可信、可核验的简历与求职材料，并覆盖 JD 匹配、岗位市场分析、面试复盘、求职进度、公开分享的完整闭环。核心价值不是「AI 写得漂亮」，而是**让每一句简历都能追溯到真实证据、拒绝编造数据**。

## About the Design Files
本包内的 `ProofCV.dc.html` 是一个用 HTML 制作的**高保真设计参考原型**（单文件、可直接在浏览器打开），展示最终外观与交互，**不是可直接搬运的生产代码**。任务是把这些设计**在目标代码库的既有环境里重建**（推荐 Next.js + React + TypeScript + Tailwind——与被集成的 Telos 技术栈一致，便于后续融合），沿用其组件与模式。若尚无环境，建议直接起 Next.js 项目。

## Fidelity
**高保真 (hifi)**。颜色、字体、间距、圆角、交互均为最终值，请按下方 Design Tokens 像素级还原。原型用内联样式 + React.createElement 实现（Design Component 运行时），重建时应改写为常规组件 + 设计系统。

## 技术定位与两个开源集成
产品本体为原创。已按真实源码集成两个 GitHub 项目：

1. **Telos**（github.com/xiashitao/Telos，Next.js 简历生成器）→ 集成进「定制简历」。移植了它的 **TemplateSpec（受约束的 JSON 设计参数）+ SpecRenderer（通用渲染器）+ 内置模板体系**。契约见 `Telos/src/lib/template-spec.ts`、`templates.ts`、`components/spec-renderer.tsx`。生产实现应直接复用 Telos 的这套代码与其 Zod schema、PDF/HTML 服务端导出（Puppeteer）。
2. **boss-zhipin-scraper**（github.com/eatmoreduck/boss-zhipin-scraper，Python CDP 爬虫）→ 集成进「岗位市场分析」。UI 消费其产物，维度**完全对齐** `scripts/job_summary.py` 的 `build_summary`（薪资区间/经验/学历/地区/高频公司/技能标签/JD 高频词）与 `build_prompt`（求职材料优化提示词）。生产实现应把该 Python 脚本作为后端服务/CLI，前端读取其 `boss_jobs_*.json` / `boss_details_*.json` 输出。注意：抓取需本地已登录 Chrome 的 DevTools Protocol，不能在浏览器内运行——前端只做展示与分析。

## Screens / Views
应用外壳：左侧 236px 固定侧边栏（分组「职业资产」「求职作战」）+ 顶部 58px bar + 主内容区。以下为全部路由：

### 1. 官网首页 (home)
- **Purpose**: 讲清价值、导流「进入演示」。
- **Layout**: 居中 max-width 1180px。Hero 两栏 1.05fr/0.95fr：左侧标题+副文案+双 CTA+三个统计；右侧「职业证据卡」演示卡 + JD 匹配/风险项小卡。下方「四步走通」4 列卡片。
- **Copy**: 主标题「先找到你**真正值钱**的经历，再让招聘者相信它。」四步：沉淀职业证据 / 解析目标岗位 / 证据对照匹配 / 生成求职材料。

### 2. 登录与引导 (auth)
- 左深色品牌栏 + 右登录表单，「使用演示账号一键体验」。演示账号：林深，全栈/前端工程师。

### 3. 工作台 (dashboard)
- 问候 + 4 统计卡（证据数/已确认/待确认/进行中岗位）+「继续你的求职闭环」步骤卡 + 深色「今日求职进度」。

### 4. 简历导入与解析 (import)
- 左 textarea 原始简历（含示例填充）；右「AI 拆解结果」→ 结构化经历卡，每段可「转为证据卡」。真实 AI 拆解。

### 5. AI 职业访谈 (interview) — 旗舰
- 无选中项目时：候选项目网格（未确认的证据卡）+「自由访谈」。
- 进行中：左聊天面板（连续追问）+ 右「本次要挖到的」7 项清单（随对话进度打勾）+「结束并生成总结」。总结含 summary/abilities/missing，可「更新到证据卡」。深挖背景/职责边界/关键决策/技术难点/协作/量化结果/可验证证据。

### 6. 职业证据库 (evidence) — 核心资产
- 顶部筛选 chips（全部/已确认/待确认/证据不足）+ 2 列证据卡。每卡：标题、项目、背景、关键行动列表、成果（绿色 ↑）、技能标签、来源、状态 pill、note 警示（待确认/证据不足），可「标记为已确认」。

### 7. GitHub 项目导入 (github)
- URL 输入 + 分析。结果：技术栈、复杂度进度条、解决的问题、可用于简历的经历（每条需「确认」）。**强制警示**：推断不代表个人贡献，提交数量≠贡献深度。

### 8. 岗位市场分析 (market) — 集成 boss-zhipin-scraper
- 顶部免责说明（数据来自 CDP 抓取）。搜索控件：关键词 / 城市下拉 / 页数 / 「连接 Chrome 抓取」（对齐 CLI 参数 --keyword/--city/--pages）。
- 样本卡（keyword@city，列表/详情数）+「技能供需对照」（市场高频技能 × 用户证据技能 → 绿✓已覆盖 / 橙补缺）。
- 7 个维度柱状卡（见集成说明）。岗位列表（明文薪资，可「对照证据」跳 JD）。「求职材料优化提示词」生成（真实 AI，还原 build_prompt）。

### 9. 岗位管理 (jobs)
- 3 列岗位卡（logo/公司/岗位/状态/匹配覆盖度条/更新时间）+「新增岗位」卡。点击进 JD 工作台。

### 10. JD 分析与证据匹配 (jd) — 差异化
- 岗位 chips 切换。左 JD textarea +「分析 JD」；右：岗位拆解（核心职责/必要能力/加分能力/隐含要求+面试重点）+ 证据匹配工作台。
- **匹配非单一分数**：深色条展示 4 指标（要求覆盖度/证据强度/表达清晰度/风险项）+ 三栏（强/弱/未匹配，每项标出对应证据）+ 红色「禁止夸大·风险表述」（原表述→稳妥改法）。真实 AI。

### 11. 定制简历生成 (resume) — 集成 Telos
- 左预览「纸面」（SpecRenderer 渲染，A4/ATS 标注，导出 PDF）；右三段切换：**模板**（14 个 Telos 模板缩略图一键换装）/ **自定义**（骨架/页眉对齐/风格/字号/标题样式/中英文/密度/字族/强调色——即 TemplateSpec 白名单字段）/ **AI 改写**（差异逐条接受/拒绝，含风险修正）。可追溯性提示：每条 bullet 带「已核验/待确认」+ 证据链。

### 12. 求职材料中心 (materials)
- 左 tab 列（招呼语/邮件私信开场/30秒/2分钟自我介绍/项目讲述稿/面试追问/能力缺口）+ 右内容（可复制）。真实 AI，均基于已确认证据。

### 13. 面试复盘 (review)
- 岗位 chips。无复盘：录音拖入（转写，仅本地）+ 转写 textarea +「AI 复盘」。有复盘：整体评分卡 + 一句话诊断 + 高光/失误两栏 + 「被问到的问题·回答评估」（逐题 good/ok/weak + 更好答法）+ 能力缺口 + 下一轮准备清单。可反哺证据库/材料。真实 AI。

### 14. 求职进度 (pipeline)
- 7 列看板（收藏/准备投递/已投递/已回复/面试中/Offer/拒绝），岗位卡可左右移动状态。

### 15/16. 公开职业主页 (publicProfile) / 公开简历分享页 (publicResume)
- 全屏、专业、适配桌面/移动。顶部 proofcv.me 链接 + 复制链接/二维码/返回编辑。主页：档案 + 精选证据（标「可验证」）+ CTA。简历页：A4 纸面简历 + 下载 PDF + 「可追溯」页脚。隐私开关控制公开内容。

### 17. 账号与隐私 (settings)
- 账号信息 + 公开/隐私开关（公开主页、简历分享）+「公开哪些内容」勾选。

## Interactions & Behavior
- 路由 = 内部 state（screen: home|auth|app|publicProfile|publicResume；app 内 tab 决定页面）。生产用真实 router。
- AI 调用：原型用 `window.claude.complete`（Anthropic）；生产替换为服务端调 Anthropic API（claude-sonnet 系列），流式更佳。每个 AI 动作都有加载态（spinner + 进度条动画）+ 失败兜底演示数据。
- 访谈为多轮上下文对话；结束生成 JSON 总结。
- Toast：底部居中，2.2s 自动消失。
- 动画：pcvFade（进入 .3s）、pcvSpin（加载）、pcvBar（进度）、pcvPulse（打字点）。

## State Management
关键 state：screen/tab、evidence[]（证据卡，含 status: confirmed|pending|insufficient）、jobs[]（含 status 求职进度枚举、jd、match）、analyses{jobId}、matches{jobId}、resumes{jobId}、mats{jobId}、reviews{jobId}、resumeSpec（TemplateSpec）、marketData。生产建议：证据库为单一数据源，岗位复用证据；数据本地优先（如 Telos 用 localStorage/zustand persist）。

## Design Tokens
- **品牌主色 (iris)**: `#5850ec`，hover `#4840d8`，浅底 `#f1f0fb` / `#faf9ff`
- **墨黑/文字**: `#16181d`；次级 `#2f333d` `#4b5060`；muted `#6b7280` `#8a919e` `#a3a8b5`
- **描边/分隔**: `#ececf2` `#eef0f4` `#f0f0f5` `#e6e8ee`
- **App 背景**: `#f6f7fb`；卡片 `#fff`；首页暖白 `#faf9f7`
- **证据状态色**: 已确认/强匹配 `#12805c`（浅底 `#e6f5ee`/`#eef8f2`）；待确认/弱匹配 `#c2810c`（浅底 `#fdf3e0`/`#fdf7ec`）；证据不足 `#8a919e`（浅底 `#f2f3f5`）；风险/失误 `#d64545`（浅底 `#fff5f5`）
- **暖色点缀 (coach)**: `#e8896b`
- **字体**: UI `Noto Sans SC`；展示/大标题 `Noto Serif SC`（weight 900）；技术/数字/代码 `JetBrains Mono`
- **圆角**: 卡片 14–16px；按钮/输入 9–11px；chip/pill 99px；证据小标签 5–7px
- **阴影**: 卡片悬浮 `0 24px 60px -30px rgba(30,30,60,.35)`；纸面 `0 10px 40px -18px rgba(30,30,60,.35)`
- **侧边栏**: 236px；顶部 bar 58px；内容 padding 28px；主内容 max-width ~1080px
- **TemplateSpec 字段**（Telos，简历模板参数）: skeleton(single|sidebar-left|sidebar-right|banner) / sidebarRatio / header{align,style(plain|underline|band),nameScale(md|lg|xl)} / section{titleStyle(caps|underline|leftbar|band),titleLang(zh|en),density(compact|normal|loose)} / typography{font(sans|serif|mono)} / colors{accent,headerBg,sidebarBg}。颜色只接受 oklch()/#hex（防注入）。

## Assets
无位图资源。图标用文字/几何/内联 SVG；Logo 为字母 P 方块（#5850ec）。头像为占位（首字）。生产可换真实图标库与用户上传头像。演示数据角色：林深（全栈/前端，5 年，冲大厂）。

## Files
- `ProofCV.dc.html` — 完整高保真原型（全部 17 个页面 + 逻辑）。用浏览器打开即可交互；「进入演示」进入应用。
- 集成源码参考（不在本包，按 URL 获取）：`xiashitao/Telos`（template-spec.ts / templates.ts / spec-renderer.tsx / schema.ts）、`eatmoreduck/boss-zhipin-scraper`（scripts/job_summary.py / boss_cdp_raw.py）。
