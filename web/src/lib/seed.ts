// Seeded demo data for the "林深 · 全栈/前端冲大厂" persona.
// Ported verbatim from the ProofCV prototype's seed* methods.

import type {
  Evidence,
  Job,
  Analysis,
  Match,
  Resume,
  Mats,
  Review,
  MarketData,
} from "./types";

export const seedEvidence = (): Evidence[] => [
  { id: "e1", title: "实时协作编辑器 · 协同冲突算法重构", project: "某在线文档 SaaS", background: "编辑器多人同编在高并发下频繁冲突丢字，日活增长后投诉激增。", actions: ["独立设计基于 CRDT 的冲突合并方案，替换原有 OT 实现", "搭建 WebSocket 增量同步与断线补偿机制", "编写压测脚本模拟 500 并发协同"], results: ["同编延迟 800ms→120ms", "冲突丢字投诉下降约 90%"], skills: ["CRDT", "WebSocket", "React", "TypeScript"], roles: ["高级前端", "全栈"], source: "原简历 + 访谈确认", status: "confirmed" },
  { id: "e2", title: "电商中台前端性能优化", project: "某电商中台", background: "商家后台首屏 5s+，大促期间频繁卡顿。", actions: ["引入路由级代码分割与资源预取", "重构长列表为虚拟滚动", "建立前端性能监控看板"], results: ["首屏 5.1s→1.6s", "LCP 达标率 62%→94%"], skills: ["性能优化", "Webpack", "React", "监控"], roles: ["高级前端"], source: "原简历", status: "confirmed" },
  { id: "e3", title: "微服务 API 网关", project: "公司内部基础设施", background: "服务间调用缺乏统一鉴权与限流。", actions: ["基于 Go 实现网关的鉴权/限流/灰度模块", "对接公司 SSO"], results: ["统一接入 20+ 服务"], skills: ["Go", "微服务", "限流", "JWT"], roles: ["全栈", "后端"], source: "原简历", status: "pending", note: "「20+ 服务」缺少来源，个人贡献边界待澄清" },
  { id: "e4", title: "开源组件库维护", project: "个人 GitHub 项目", background: "维护一套 React 表单组件库。", actions: ["设计受控/非受控双模式 API", "完善单测与文档站"], results: ["GitHub 480 star"], skills: ["React", "TypeScript", "开源"], roles: ["前端"], source: "GitHub 待拆解", status: "insufficient", note: "star 数不代表贡献深度，需补充你解决的具体问题" },
  { id: "e5", title: "跨端埋点 SDK", project: "某数据团队", background: "多端埋点口径不一致。", actions: ["统一 Web/小程序埋点 SDK 接口", "设计上报队列与失败重试"], results: ["接入 8 条业务线"], skills: ["SDK", "JavaScript", "数据"], roles: ["前端", "全栈"], source: "访谈补充", status: "pending", note: "待确认你是主导还是参与" },
  { id: "e6", title: "CI/CD 与前端工程化", project: "团队工程化", background: "发布流程手动、易出错。", actions: ["搭建基于 GitHub Actions 的 CI", "引入 monorepo 与统一 lint"], results: ["发布耗时下降约 60%"], skills: ["CI/CD", "Monorepo", "工程化"], roles: ["全栈"], source: "原简历", status: "confirmed" },
  { id: "e7", title: "AI 辅助代码评审内部工具", project: "内部效率工具", background: "评审耗时长。", actions: ["调用大模型 API 做 diff 摘要与风险提示", "设计人审确认流程"], results: ["团队试用中"], skills: ["LLM", "Node.js", "工具"], roles: ["全栈"], source: "访谈补充", status: "pending", note: "成果尚无量化数据" },
  { id: "e8", title: "技术分享与新人 mentor", project: "团队协作", background: "团队新人多。", actions: ["组织每周前端分享", "带 2 名新人"], results: ["沉淀内部文档 30+ 篇"], skills: ["协作", "分享", "Mentor"], roles: ["高级前端"], source: "原简历", status: "confirmed" },
];

export const seedJobs = (): Job[] => [
  { id: "j1", company: "字节跳动", role: "高级前端工程师 · 抖音电商", status: "interviewing", statusLabel: "面试中", match: 82, updated: "今天", logo: "字", jd: "负责抖音电商 C 端核心链路的前端开发；主导复杂交互与性能优化；具备 React 深度经验，熟悉工程化与监控；有大型协同/中台经验优先；关注用户体验与稳定性。" },
  { id: "j2", company: "腾讯", role: "全栈工程师 · 云产品", status: "applied", statusLabel: "已投递", match: 74, updated: "2 天前", logo: "腾", jd: "负责云产品控制台前后端开发，Node/Go 均可；熟悉微服务与网关；能独立负责模块设计与落地。" },
  { id: "j3", company: "某 AI 独角兽", role: "前端工程师 · AI 应用", status: "preparing", statusLabel: "准备投递", match: 0, updated: "待分析", logo: "AI", jd: "负责 AI 产品前端，熟悉大模型 API 集成、流式渲染、复杂状态管理；有从 0-1 产品经验优先。" },
];

export const seedAnalyses = (): Record<string, Analysis> => ({
  j1: {
    responsibilities: ["抖音电商 C 端核心链路前端开发", "主导复杂交互与前端性能优化", "保障高并发下的稳定性与体验"],
    mustHave: ["React 深度经验", "前端性能优化", "工程化与监控体系"],
    niceToHave: ["大型协同/中台经验", "跨端能力", "数据驱动的体验优化"],
    hidden: ["能独立扛核心链路、对稳定性负责", "抗压与快速迭代", "对业务指标（转化/留存）有 sense"],
    interviewFocus: ["一次深度性能优化的完整过程", "协同/一致性问题如何定位与解决", "如何在快速迭代中保证质量"],
  },
});

export const seedMatches = (): Record<string, Match> => ({
  j1: {
    metrics: { coverage: 82, strength: 74, clarity: 88, risk: 2 },
    strong: [
      { req: "React 深度经验", ev: "实时协作编辑器 · 协同冲突算法重构", note: "CRDT + React 大型协同，直接命中" },
      { req: "前端性能优化", ev: "电商中台前端性能优化", note: "首屏 5.1s→1.6s，有监控佐证" },
      { req: "工程化与监控", ev: "CI/CD 与前端工程化", note: "GitHub Actions + monorepo" },
    ],
    weak: [{ req: "大型协同/中台经验", ev: "跨端埋点 SDK", note: "相关但主导/参与边界待在访谈中确认" }],
    none: [{ req: "数据驱动的体验优化", ev: null, note: "暂无以业务指标衡量体验改动的证据，建议访谈补充" }],
    risks: [
      { text: "原简历「支撑日活 3 万」缺少数据来源", fix: "改为「支撑团队高并发协同场景」或补充监控截图" },
      { text: "「投诉下降约 90%」为估算值", fix: "标注为估算或改为定性描述" },
    ],
  },
});

export const seedResumes = (): Record<string, Resume> => ({
  j1: {
    summary: "5 年经验全栈/前端工程师，擅长大型协同系统与前端性能优化。主导过实时协作编辑器的冲突算法重构与电商中台性能治理，熟悉工程化与监控体系，能独立负责核心链路并对稳定性负责。",
    exp: [
      { company: "某在线文档 SaaS", role: "高级前端", period: "2022.06-至今", bullets: [
        { text: "主导实时协作编辑器冲突算法重构，用 CRDT 替换原 OT 实现，将多人同编延迟从 800ms 降至 120ms", ev: "实时协作编辑器 · 协同冲突算法重构", status: "confirmed" },
        { text: "设计 WebSocket 增量同步与断线补偿机制，显著降低协同丢字问题", ev: "实时协作编辑器 · 协同冲突算法重构", status: "confirmed" },
      ] },
      { company: "某电商公司", role: "前端工程师", period: "2020.07-2022.05", bullets: [
        { text: "负责商家中台前端性能治理，首屏由 5.1s 优化至 1.6s，LCP 达标率 62%→94%", ev: "电商中台前端性能优化", status: "confirmed" },
        { text: "统一 Web/小程序埋点 SDK 接口并设计失败重试队列（个人贡献边界待确认）", ev: "跨端埋点 SDK", status: "pending" },
      ] },
    ],
    skills: ["React", "TypeScript", "Node.js", "Go", "性能优化", "CRDT", "Webpack", "CI/CD"],
  },
});

export const seedMats = (): Record<string, Mats> => ({
  j1: {
    greeting: "您好，我是林深，5 年前端/全栈，主导过实时协作编辑器的协同算法重构（同编延迟 800ms→120ms）和电商中台性能治理（首屏 5.1s→1.6s）。看到贵司抖音电商高级前端的岗位很感兴趣，尤其是核心链路的性能与稳定性方向，方便聊聊吗？",
    email: "王老师您好，\n\n我是林深，关注到贵司「抖音电商 · 高级前端」岗位。我过去主导过大型协同编辑器的性能与一致性优化，也负责过电商中台的首屏治理，和岗位对核心链路性能/稳定性的要求比较契合。附件是针对该岗位定制的简历，期待有机会进一步交流。\n\n祝好，林深",
    intro30: "我是林深，5 年前端/全栈。最擅长两件事：大型协同系统的一致性与性能，以及从监控出发的前端性能治理。做过同编延迟 800ms→120ms 的算法重构，也把电商中台首屏从 5 秒压到 1.6 秒。我习惯对核心链路的稳定性负责。",
    intro120: "我是林深，5 年经验，主要做前端/全栈。\n\n最能代表我的是两个项目：一是实时协作编辑器，我主导把冲突合并从 OT 换成 CRDT，配合 WebSocket 增量同步，把多人同编延迟从 800ms 降到 120ms，同时解决了高并发下的丢字问题；二是电商商家中台的性能治理，我从建监控看板入手，用路由级分包和虚拟滚动把首屏从 5.1 秒压到 1.6 秒，LCP 达标率从 62% 提到 94%。\n\n我比较看重「对核心链路和稳定性负责」，也习惯用数据说话——这也是我对贵司抖音电商这个岗位比较有信心的原因。",
    story: "背景：我们的在线文档在日活增长后，多人同编经常冲突丢字，投诉很多。\n我的职责：我独立负责协同层重构。\n关键决策：评估后我放弃在旧 OT 上打补丁，改用 CRDT——因为它在弱网和高并发下收敛性更好，代价是内存占用上升，我用增量 GC 做了折中。\n难点：断线重连后的状态补偿，我设计了基于版本向量的补偿协议。\n结果：同编延迟 800ms→120ms，丢字类投诉大幅下降（这个比例是我根据工单估算的）。\n证据：有对应的 PR 和监控看板截图可以展示。",
    questions: ["CRDT 相比 OT 的具体权衡？内存问题怎么控制的？", "120ms 是怎么测的，测试环境和真实环境差异多大？", "断线补偿协议在极端情况下会不会丢数据？", "这个项目里哪些是你独立做的，哪些是团队一起做的？", "如果让你在抖音电商这种量级重做，你会怎么设计？"],
    gaps: [
      { g: "缺少以业务指标衡量体验优化的经历", s: "准备一个「性能优化 → 转化/留存变化」的小案例，哪怕是定性推理" },
      { g: "超大流量（亿级）经验偏少", s: "提前想清楚现有方案在更大量级下的瓶颈与应对" },
    ],
  },
});

export const seedReviews = (): Record<string, Review> => ({
  j1: {
    score: 76,
    verdict: '项目深度和主导性很强，但一遇到量化数据和超大流量设计就露怯——把"记不清/没细看"补成可核验的数字，你就是稳的 offer 级候选人。',
    highlights: ["开场自我介绍紧扣岗位，用 800ms→120ms 的量化成果快速建立可信度", "项目主导边界表达清晰，主动区分了个人贡献与团队协作", "面对不会的问题没有硬编，态度诚实"],
    issues: ['被追问 CRDT 内存权衡时答"记不太清"，暴露对自己项目细节掌握不牢', '"120ms 在本地压测"却没主动说明真实环境差异，显得不够严谨', "亿级流量设计题准备不足，只给了方向没有落地思路"],
    qa: [
      { q: "CRDT 相比 OT 你具体怎么权衡的？内存问题怎么控制？", quality: "weak", comment: ' 关键项目题却答得含糊。应准备："OT 需中心化转换、扩展性差；CRDT 无中心、收敛性好，代价是元数据内存膨胀，我们用增量 GC + 墓碑压缩把内存控制在 X MB。"带上数字。' },
      { q: "120ms 是在什么环境测的？", quality: "ok", comment: "诚实是对的，但应主动补：本地 500 并发压测得 120ms，线上灰度实测 P95 约 180ms——展示你有真实环境意识。" },
      { q: "放到亿级流量你会怎么设计？", quality: "weak", comment: "只说了分片和边缘节点。应结构化：读写分离 → 房间分片 → 热点房间再拆 → 边缘就近接入 → 降级策略，并点出瓶颈在广播扇出。" },
      { q: "团队里你的角色？", quality: "good", comment: '回答清晰可信，主导协同层 + 带新人的表述正好命中"能独立扛核心链路"的隐含要求。' },
    ],
    gaps: ["对自研项目的关键技术数字掌握不牢（内存、真实环境延迟）", "超大流量系统设计缺少结构化落地框架", '缺少"真实环境 vs 压测环境"的严谨表达习惯'],
    nextPrep: ["把 CRDT 内存/GC 的具体数字和方案背熟，准备一页纸", "写一个亿级协同系统设计的结构化提纲（分片/扇出/降级）", '为每个量化成果补上"测量环境 + 数据来源"一句话', "下一轮开场后主动抛出你最强的那个技术决策，先声夺人"],
  },
});

export const seedMarket = (): MarketData => ({
  keyword: "前端", city: "上海", total_jobs: 64, total_details: 41,
  salary_ranges: [["25-40K", 18], ["20-35K", 15], ["30-50K", 12], ["18-30K", 9], ["40-60K", 6], ["15-25K", 4]],
  experience: [["3-5年", 28], ["1-3年", 16], ["5-10年", 12], ["经验不限", 5], ["应届", 3]],
  degrees: [["本科", 44], ["学历不限", 11], ["硕士", 7], ["大专", 2]],
  districts: [["浦东新区", 19], ["徐汇区", 12], ["长宁区", 9], ["杨浦区", 8], ["静安区", 7]],
  companies: [["字节跳动", 6], ["拼多多", 5], ["携程", 4], ["哔哩哔哩", 4], ["小红书", 3], ["蚂蚁集团", 3]],
  skill_tags: [["React", 52], ["TypeScript", 44], ["Vue", 31], ["Webpack", 22], ["Node.js", 20], ["性能优化", 18], ["小程序", 14], ["CSS", 12]],
  jd_terms: [["React", 48], ["TypeScript", 40], ["工程化", 26], ["性能优化", 24], ["Node", 19], ["组件库", 15], ["可视化", 12], ["微前端", 10], ["SSR", 9], ["监控", 8]],
  jobs: [
    { title: "高级前端工程师", company: "字节跳动", salary: "30-55K·15薪", location: "上海·浦东新区·张江", experience: "3-5年", degree: "本科", tags: ["React", "TypeScript", "工程化", "性能优化"] },
    { title: "前端工程师（C端）", company: "小红书", salary: "25-45K·14薪", location: "上海·长宁区", experience: "3-5年", degree: "本科", tags: ["React", "Node.js", "小程序"] },
    { title: "资深前端", company: "拼多多", salary: "35-60K·16薪", location: "上海·长宁区", experience: "5-10年", degree: "本科", tags: ["React", "微前端", "监控"] },
    { title: "前端开发工程师", company: "携程", salary: "22-38K·13薪", location: "上海·徐汇区", experience: "3-5年", degree: "本科", tags: ["Vue", "TypeScript", "SSR"] },
    { title: "前端工程师", company: "哔哩哔哩", salary: "25-42K", location: "上海·杨浦区", experience: "1-3年", degree: "本科", tags: ["React", "可视化", "Webpack"] },
    { title: "前端架构师", company: "蚂蚁集团", salary: "45-70K·16薪", location: "上海·浦东新区", experience: "5-10年", degree: "硕士", tags: ["React", "组件库", "工程化", "微前端"] },
  ],
});
