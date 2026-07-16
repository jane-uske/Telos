// Seeded demo data for the "林深 · 全栈/前端冲大厂" persona.
// 只在用户显式点「查看演示」时加载（store.loadDemo），绝不默认混入真实数据。
// j1（字节）预置完整申请包（分析/简历/QA/模拟/真实复盘），j2（腾讯）只有分析，
// j3（AI 独角兽）完全空白 —— 用户可以在 j3 上从零走完整条闭环。
// 同时导出 fallback* 系列：基础模式（不调用在线 AI）的确定性生成器（不编造事实）。

import type {
  Evidence,
  Job,
  Analysis,
  Match,
  Resume,
  ResumeBullet,
  ResumeVersion,
  QaItem,
  MockSession,
  MockReport,
  InterviewRecord,
  TranscriptSeg,
  RecordQa,
  SegFlag,
  UserProfile,
} from "./types";

/** 演示账号「林深」的简历页眉信息（仅演示模式加载） */
export const demoProfile = (): UserProfile => ({
  name: "林深",
  headline: "全栈 / 高级前端工程师",
  city: "杭州",
  email: "lin.shen@demo.dev",
  link: "github.com/linshen",
});

export const seedEvidence = (): Evidence[] => [
  {
    id: "e1", title: "实时协作编辑器 · 协同冲突算法重构", project: "某在线文档 SaaS",
    background: "编辑器多人同编在高并发下频繁冲突丢字，日活增长后投诉激增。",
    responsibilities: ["独立负责协同层（冲突合并 + 同步协议）的方案与落地", "不负责编辑器渲染层与 UI"],
    actions: ["独立设计基于 CRDT 的冲突合并方案，替换原有 OT 实现", "搭建 WebSocket 增量同步与断线补偿机制", "编写压测脚本模拟 500 并发协同"],
    challenges: ["技术：CRDT 元数据内存膨胀，用增量 GC + 墓碑压缩折中", "业务：不能停服迁移，设计了双写灰度方案"],
    collaboration: "与后端 2 人协作定义同步协议，向 PM 同步灰度节奏",
    results: ["同编延迟 800ms→120ms（本地 500 并发压测）", "冲突丢字投诉下降约 90%（按工单估算）"],
    skills: ["CRDT", "WebSocket", "React", "TypeScript"], roles: ["高级前端", "全栈"],
    source: "原简历 + 访谈确认", status: "confirmed",
  },
  {
    id: "e2", title: "电商中台前端性能优化", project: "某电商中台",
    background: "商家后台首屏 5s+，大促期间频繁卡顿。",
    responsibilities: ["主导性能专项，制定指标与优化路线", "监控看板由我搭建，具体页面改造分工到 3 人小组"],
    actions: ["引入路由级代码分割与资源预取", "重构长列表为虚拟滚动", "建立前端性能监控看板"],
    challenges: ["技术：老代码耦合重，分包需先拆公共依赖", "业务：大促前冻结窗口短，改动需分批灰度"],
    collaboration: "带 3 人小组分工改造，与运维协作接入监控采集",
    results: ["首屏 5.1s→1.6s", "LCP 达标率 62%→94%"],
    skills: ["性能优化", "Webpack", "React", "监控"], roles: ["高级前端"],
    source: "原简历", status: "confirmed",
  },
  {
    id: "e3", title: "微服务 API 网关", project: "公司内部基础设施",
    background: "服务间调用缺乏统一鉴权与限流。",
    responsibilities: ["鉴权与限流模块由我实现；灰度模块与他人合作，边界待澄清"],
    actions: ["基于 Go 实现网关的鉴权/限流/灰度模块", "对接公司 SSO"],
    challenges: ["技术：限流在突发流量下的精度与性能平衡"],
    results: ["统一接入 20+ 服务"],
    skills: ["Go", "微服务", "限流", "JWT"], roles: ["全栈", "后端"],
    source: "原简历", status: "pending", note: "「20+ 服务」缺少来源，个人贡献边界待澄清",
  },
  {
    id: "e4", title: "开源组件库维护", project: "个人 GitHub 项目",
    background: "维护一套 React 表单组件库。",
    responsibilities: ["独立维护，API 设计与文档均为个人完成"],
    actions: ["设计受控/非受控双模式 API", "完善单测与文档站"],
    challenges: ["技术：受控/非受控切换时的状态同步一致性"],
    results: ["GitHub 480 star"],
    skills: ["React", "TypeScript", "开源"], roles: ["前端"],
    source: "GitHub 待拆解", status: "insufficient", note: "star 数不代表贡献深度，需补充你解决的具体问题",
  },
  {
    id: "e5", title: "跨端埋点 SDK", project: "某数据团队",
    background: "多端埋点口径不一致。",
    responsibilities: ["主导还是参与待确认——访谈中需澄清个人边界"],
    actions: ["统一 Web/小程序埋点 SDK 接口", "设计上报队列与失败重试"],
    challenges: ["技术：弱网下上报丢失与重复上报的取舍"],
    results: ["接入 8 条业务线"],
    skills: ["SDK", "JavaScript", "数据"], roles: ["前端", "全栈"],
    source: "访谈补充", status: "pending", note: "待确认你是主导还是参与",
  },
  {
    id: "e6", title: "CI/CD 与前端工程化", project: "团队工程化",
    background: "发布流程手动、易出错。",
    responsibilities: ["CI 流水线与 monorepo 迁移由我主导"],
    actions: ["搭建基于 GitHub Actions 的 CI", "引入 monorepo 与统一 lint"],
    challenges: ["业务：迁移期间不能影响 4 条业务线的发布节奏"],
    results: ["发布耗时下降约 60%"],
    skills: ["CI/CD", "Monorepo", "工程化"], roles: ["全栈"],
    source: "原简历", status: "confirmed",
  },
  {
    id: "e7", title: "AI 辅助代码评审内部工具", project: "内部效率工具",
    background: "评审耗时长。",
    responsibilities: ["从 0 到 1 独立开发，推广由 TL 支持"],
    actions: ["调用大模型 API 做 diff 摘要与风险提示", "设计人审确认流程"],
    challenges: ["业务：如何让团队信任 AI 提示而不过度依赖"],
    results: ["团队试用中"],
    skills: ["LLM", "Node.js", "工具"], roles: ["全栈"],
    source: "访谈补充", status: "pending", note: "成果尚无量化数据",
  },
  {
    id: "e8", title: "技术分享与新人 mentor", project: "团队协作",
    background: "团队新人多。",
    responsibilities: ["组织分享与带教均为个人主导"],
    actions: ["组织每周前端分享", "带 2 名新人"],
    challenges: ["业务：新人水平差异大，制定了分层带教计划"],
    results: ["沉淀内部文档 30+ 篇"],
    skills: ["协作", "分享", "Mentor"], roles: ["高级前端"],
    source: "原简历", status: "confirmed",
  },
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
  j2: {
    responsibilities: ["云产品控制台前后端开发", "独立负责模块从设计到落地"],
    mustHave: ["Node 或 Go 服务端能力", "微服务与网关理解", "独立模块设计能力"],
    niceToHave: ["云产品/ToB 经验", "全链路监控"],
    hidden: ["能一个人把模块从方案写到上线", "跨前后端沟通成本低"],
    interviewFocus: ["网关项目中你个人负责的边界", "一次独立设计模块的完整决策过程"],
  },
});

export const seedMatches = (): Record<string, Match> => ({
  j1: {
    metrics: { coverage: 82, strength: 74, clarity: 88, risk: 2 },
    strong: [
      { req: "React 深度经验", evId: "e1", ev: "实时协作编辑器 · 协同冲突算法重构", note: "CRDT + React 大型协同，直接命中，应放在第一条重点写" },
      { req: "前端性能优化", evId: "e2", ev: "电商中台前端性能优化", note: "首屏 5.1s→1.6s，有监控佐证，重点写" },
      { req: "工程化与监控", evId: "e6", ev: "CI/CD 与前端工程化", note: "GitHub Actions + monorepo，作为支撑项写" },
    ],
    weak: [{ req: "大型协同/中台经验", evId: "e5", ev: "跨端埋点 SDK", note: "相关但主导/参与边界待在访谈中确认，确认前不要写「主导」" }],
    none: [{ req: "数据驱动的体验优化", ev: null, note: "暂无以业务指标衡量体验改动的经历佐证，建议访谈补充，简历先不写" }],
    downplay: [
      { text: "微服务 API 网关（Go）", why: "与前端岗位相关度低，且贡献边界未澄清——一句话带过即可，不要展开" },
      { text: "开源组件库 480 star", why: "star 数容易被追问贡献深度，细节不足前建议弱化或不写" },
    ],
    risks: [
      { text: "原简历「支撑日活 3 万」缺少数据来源", fix: "改为「支撑团队高并发协同场景」或补充监控截图" },
      { text: "「投诉下降约 90%」为估算值", fix: "标注为估算或改为定性描述" },
    ],
  },
  j2: {
    metrics: { coverage: 74, strength: 62, clarity: 80, risk: 1 },
    strong: [
      { req: "Node/Go 服务端能力", evId: "e3", ev: "微服务 API 网关", note: "Go 网关直接命中，但先在访谈中澄清个人边界再重点写" },
      { req: "独立模块设计", evId: "e1", ev: "实时协作编辑器 · 协同冲突算法重构", note: "独立负责协同层，可作为独立设计能力的主要支撑" },
    ],
    weak: [{ req: "微服务与网关理解", evId: "e3", ev: "微服务 API 网关", note: "「20+ 服务」无来源，写之前先确认数字" }],
    none: [{ req: "云产品/ToB 经验", ev: null, note: "暂无云产品相关经历，面试中如实说明并用中台经验类比" }],
    downplay: [{ text: "开源组件库", why: "与云产品全栈岗位关联弱，简历上一句话即可" }],
    risks: [{ text: "「统一接入 20+ 服务」缺少来源", fix: "确认数字或改为「统一接入多个内部服务」" }],
  },
});

// —— j1 简历：新内容模型（每条 bullet 关联经历 / 建议 / 钩子 / 追问提示） ——

const j1Bullets = {
  b1: {
    id: "b1",
    text: "主导实时协作编辑器冲突算法重构，用 CRDT 替换原 OT 实现，将多人同编延迟从 800ms 降至 120ms",
    evId: "e1", ev: "实时协作编辑器 · 协同冲突算法重构", evStatus: "confirmed", hook: true,
    probe: "CRDT 的内存开销与 GC 策略、120ms 的测量环境（本地压测 vs 线上）",
  } as ResumeBullet,
  b2: {
    id: "b2",
    text: "设计 WebSocket 增量同步与断线补偿机制，显著降低协同丢字问题",
    evId: "e1", ev: "实时协作编辑器 · 协同冲突算法重构", evStatus: "confirmed", hook: false,
    probe: "断线补偿协议在极端弱网下会不会丢数据",
  } as ResumeBullet,
  b3: {
    id: "b3",
    text: "支撑日活 3 万团队的高频协同使用",
    original: "支撑日活 3 万团队的高频协同使用",
    suggestion: "支撑高并发多人协同场景的稳定运行",
    reason: "「日活 3 万」缺少数据来源，被追问时无法自证——改为稳妥表述避免夸大",
    risk: true,
    ev: null, evStatus: "none", hook: false,
  } as ResumeBullet,
  b4: {
    id: "b4",
    text: "负责商家中台前端性能治理，首屏由 5.1s 优化至 1.6s，LCP 达标率 62%→94%",
    evId: "e2", ev: "电商中台前端性能优化", evStatus: "confirmed", hook: false,
    probe: "收益如何归因到具体手段、监控口径怎么定的",
  } as ResumeBullet,
  b5: {
    id: "b5",
    text: "统一 Web/小程序埋点 SDK 接口并设计失败重试队列",
    evId: "e5", ev: "跨端埋点 SDK", evStatus: "pending", hook: false,
    probe: "这段经历「主导还是参与」尚未确认，面试官追问边界时有风险",
  } as ResumeBullet,
  b6: {
    id: "b6",
    text: "熟悉各种前端技术，有丰富的项目经验",
    original: "熟悉各种前端技术，有丰富的项目经验",
    suggestion: "精通 React / TypeScript，熟悉 Node.js / Go 与前端工程化",
    reason: "笼统表述改为可核验的具体技术栈，命中 JD「React 深度经验」",
    ev: null, evStatus: "none", hook: false,
  } as ResumeBullet,
};

export const seedResumes = (): Record<string, Resume> => ({
  j1: {
    summary: "5 年经验全栈/前端工程师，擅长大型协同系统与前端性能优化。主导过实时协作编辑器的冲突算法重构与电商中台性能治理，熟悉工程化与监控体系，能独立负责核心链路并对稳定性负责。",
    exp: [
      { company: "某在线文档 SaaS", role: "高级前端", period: "2022.06-至今", bullets: [j1Bullets.b1, j1Bullets.b2, j1Bullets.b3] },
      { company: "某电商公司", role: "前端工程师", period: "2020.07-2022.05", bullets: [j1Bullets.b4, j1Bullets.b5, j1Bullets.b6] },
    ],
    skills: ["React", "TypeScript", "Node.js", "Go", "性能优化", "CRDT", "Webpack", "CI/CD"],
  },
});

export const seedResumeVersions = (): Record<string, ResumeVersion[]> => ({
  j1: [
    {
      id: "v1", label: "投递版 v1", savedAt: "7 月 8 日",
      data: {
        summary: "5 年经验全栈/前端工程师，擅长大型协同系统与前端性能优化。",
        exp: [
          { company: "某在线文档 SaaS", role: "高级前端", period: "2022.06-至今", bullets: [{ ...j1Bullets.b1, hook: false, probe: undefined }, { ...j1Bullets.b2, probe: undefined }] },
          { company: "某电商公司", role: "前端工程师", period: "2020.07-2022.05", bullets: [{ ...j1Bullets.b4, probe: undefined }] },
        ],
        skills: ["React", "TypeScript", "Node.js", "性能优化", "CRDT"],
      },
    },
  ],
});

// —— j1 面试 QA ——

export const seedQa = (): Record<string, QaItem[]> => ({
  j1: [
    { id: "q1", cat: "intro", q: "30 秒自我介绍", prep: "done", highRisk: false, origin: "generated", jdReq: "整体匹配", answer: "我是林深，5 年前端/全栈。最擅长两件事：大型协同系统的一致性与性能，以及从监控出发的前端性能治理。做过同编延迟 800ms→120ms 的算法重构，也把电商中台首屏从 5 秒压到 1.6 秒。我习惯对核心链路的稳定性负责。" },
    { id: "q2", cat: "intro", q: "2 分钟自我介绍", prep: "doing", highRisk: false, origin: "generated", jdReq: "整体匹配", answer: "我是林深，5 年经验，主要做前端/全栈。\n\n最能代表我的是两个项目：一是实时协作编辑器，我主导把冲突合并从 OT 换成 CRDT，配合 WebSocket 增量同步，把多人同编延迟从 800ms 降到 120ms，同时解决了高并发下的丢字问题；二是电商商家中台的性能治理，我从建监控看板入手，用路由级分包和虚拟滚动把首屏从 5.1 秒压到 1.6 秒，LCP 达标率从 62% 提到 94%。\n\n我比较看重「对核心链路和稳定性负责」，也习惯用数据说话——这也是我对抖音电商这个岗位比较有信心的原因。" },
    { id: "q3", cat: "project", q: "项目讲述：实时协作编辑器（STAR）", fromBullet: "b1", jdReq: "React 深度经验", prep: "done", highRisk: false, origin: "generated", answer: "背景：我们的在线文档在日活增长后，多人同编经常冲突丢字，投诉很多。\n我的职责：我独立负责协同层重构。\n关键决策：评估后我放弃在旧 OT 上打补丁，改用 CRDT——因为它在弱网和高并发下收敛性更好，代价是内存占用上升，我用增量 GC 做了折中。\n难点：断线重连后的状态补偿，我设计了基于版本向量的补偿协议。\n结果：同编延迟 800ms→120ms（本地 500 并发压测），丢字类投诉大幅下降（按工单估算约 90%）。\n佐证：有对应的 PR 和监控看板截图可以展示。", followUps: ["CRDT 内存膨胀的具体数字？", "为什么不继续优化 OT？", "双写灰度怎么保证数据一致？"] },
    { id: "q4", cat: "resume", q: "CRDT 相比 OT 你具体怎么权衡的？内存问题怎么控制？", fromBullet: "b1", jdReq: "React 深度经验", prep: "risk", highRisk: true, origin: "generated", answer: "（待补强：一面已被问穿）OT 需要中心化转换、扩展性差；CRDT 无中心、收敛性好，代价是元数据内存膨胀。我们用增量 GC + 墓碑压缩控制内存——具体数字需要我回去整理后补上。", followUps: ["内存最终控制在多少？", "墓碑压缩的触发时机？", "如果内存继续涨怎么办？"] },
    { id: "q5", cat: "resume", q: "120ms 这个数字是怎么测出来的？", fromBullet: "b1", jdReq: "前端性能优化", prep: "risk", highRisk: true, origin: "generated", answer: "（待补强）本地 500 并发压测得到 120ms；真实环境会更高，需主动说明数据口径：线上灰度的 P95 数字要回去核实后补充。诚实说明「压测环境 vs 真实环境」的差异，反而展示严谨。", followUps: ["线上真实 P95 是多少？", "压测脚本怎么模拟真实编辑行为？"] },
    { id: "q6", cat: "resume", q: "断线补偿协议在极端弱网下会不会丢数据？", fromBullet: "b2", jdReq: "高并发稳定性", prep: "doing", highRisk: false, origin: "generated", answer: "基于版本向量做补偿：客户端重连时带上本地版本向量，服务端 diff 后下发缺失操作。极端情况下（本地缓存被清）会退化为全量拉取，不丢数据但体验降级。可以补充：这个退化路径有单独的监控埋点。", followUps: ["版本向量冲突怎么解？", "全量拉取的频率有多高？"] },
    { id: "q7", cat: "tech", q: "首屏 5.1s→1.6s，每项手段的收益怎么归因？", fromBullet: "b4", jdReq: "前端性能优化", prep: "done", highRisk: false, origin: "generated", answer: "先建监控看板定口径（LCP/FCP 分位数），再分批灰度：路由级分包 -1.8s、虚拟滚动 -1.1s、资源预取 -0.6s，每批改动独立灰度对照。归因靠灰度组 vs 对照组的分位数差，不是拍脑袋。", followUps: ["为什么用 P75 不用平均值？", "灰度样本量怎么保证置信？"] },
    { id: "q8", cat: "tech", q: "如果把协同编辑放到抖音电商这种亿级流量，你会怎么设计？", jdReq: "高并发稳定性", prep: "risk", highRisk: true, origin: "real", answer: "（一面已暴露：只答了方向没有落地）结构化提纲：读写分离 → 按文档/房间分片 → 热点房间二次拆分 → 边缘就近接入 → 广播扇出是瓶颈，需要合并推送 + 分级降级（只读模式）。准备一页纸架构草图。", followUps: ["分片键怎么选？", "热点房间的判定标准？", "降级时用户感知怎么处理？"] },
    { id: "q9", cat: "biz", q: "性能优化给业务指标（转化/留存）带来了什么变化？", fromBullet: "b4", jdReq: "数据驱动的体验优化", prep: "todo", highRisk: true, origin: "generated", answer: "（依据缺口：暂无业务指标数据）可准备定性推理：首屏 3.5s 的改善减少了商家操作流失，大促期间卡顿投诉下降。如实说明当时未追踪转化指标，但说清「如果重来会怎么设指标」。", followUps: ["为什么当时不设业务指标？", "你觉得性能和转化的关系怎么量化？"] },
    { id: "q10", cat: "collab", q: "举一个你跨团队推动事情的例子", fromBullet: "b1", jdReq: "协作与推动", prep: "doing", highRisk: false, origin: "generated", answer: "协同层重构需要后端改同步协议：我先写了协议对比文档（改动成本 vs 收益），拉后端 2 人过方案，用双写灰度降低他们的风险顾虑，最终按我的方案落地。要点：用文档和灰度方案降低协作方的决策成本。", followUps: ["后端不同意时怎么办？", "灰度期间出过问题吗？"] },
    { id: "q11", cat: "collab", q: "埋点 SDK 这段，哪些是你个人做的，哪些是团队做的？", fromBullet: "b5", jdReq: "大型协同/中台经验", prep: "todo", highRisk: true, origin: "generated", answer: "（风险：个人边界尚未确认——先去经历库确认这段经历，再写答案。确认前不要在面试中说「主导」。）", followUps: ["接口设计是谁定的？", "8 条业务线是你推的还是团队推的？"] },
    { id: "q12", cat: "risk", q: "简历里「日活 3 万」这个数字是怎么来的？", fromBullet: "b3", jdReq: "可信度", prep: "risk", highRisk: true, origin: "generated", answer: "（高风险：该数字缺少来源，简历编辑器中已有去夸大建议待处理）如果保留数字，必须能答出来源；否则接受 AI 建议改为稳妥表述。", followUps: ["3 万是注册还是活跃？", "数据从哪个系统看到的？"] },
    { id: "q13", cat: "reverse", q: "反问：团队目前协同/性能链路上最大的技术挑战是什么？", prep: "done", highRisk: false, origin: "generated", answer: "用于判断岗位真实工作内容与我的匹配度，也展示对技术本身的兴趣。追问方向：这个挑战目前卡在哪，团队期望新人多久能接手。" },
    { id: "q14", cat: "reverse", q: "反问：这个岗位未来半年最重要的目标是什么？", prep: "todo", highRisk: false, origin: "generated", answer: "了解考核预期与团队优先级，判断和自己的成长方向是否一致。" },
  ],
});

// —— j1 模拟面试记录 ——

export const seedMocks = (): Record<string, MockSession[]> => ({
  j1: [
    {
      id: "m1", date: "3 天前",
      msgs: [
        { role: "assistant", content: "你好，我是今天的模拟面试官。看到你简历第一条写「主导协作编辑器冲突算法重构」——先用两分钟讲讲这个项目，重点说你个人做了什么。" },
        { role: "user", content: "好的。我们的文档产品多人同编经常丢字，我独立负责协同层重构，把 OT 换成 CRDT，配合增量同步，延迟从 800ms 降到 120ms。" },
        { role: "assistant", content: "800ms 到 120ms 很亮眼。这个 120ms 是什么环境测的？线上真实用户的数字是多少？" },
        { role: "user", content: "是本地 500 并发压测的数字，线上的话……我记得 P95 大概 180ms 左右，但具体我需要再确认。" },
        { role: "assistant", content: "建议把线上口径核实后写进准备答案——压测和线上混在一起说是被问穿的高发点。继续：CRDT 的内存膨胀你们怎么控制的，有具体数字吗？" },
        { role: "user", content: "用了增量 GC 和墓碑压缩，具体内存数字我记不太清了。" },
        { role: "assistant", content: "这是第二次在数字上模糊了。这条是你标记的面试钩子，面试官一定会往深处追——内存峰值、GC 触发策略、压缩比，至少要能答出一个可靠数字。我们换个方向：如果这套方案放到亿级流量，你怎么扩展？" },
        { role: "user", content: "可能要做分片，再加边缘节点……这块我还没系统想过。" },
      ],
      report: {
        overall: "主导性和技术选型的表达都到位，但「钩子」背后的细节数字连续两次答不上来——钩子引来了追问，你却接不住，比不设钩子更危险。",
        good: ["项目背景和个人职责边界讲得清晰", "对「压测 vs 线上」的差异有意识，被点破后没有嘴硬"],
        exposed: ["CRDT 内存控制的具体数字（钩子被问穿）", "线上真实延迟口径不确定"],
        incomplete: ["亿级流量扩展设计只有方向没有结构"],
        redo: ["「CRDT 内存怎么控制」——补上内存峰值/GC 策略/压缩比三个数字", "「亿级流量怎么设计」——按分片/扇出/降级写结构化提纲"],
        resumeSuggestions: ["b1 这条建议补充数据口径（本地压测 + 线上 P95），避免数字被动"],
        nextFocus: ["下次模拟优先追问：内存数字是否已补齐、亿级设计是否有结构", "检验 2 分钟自我介绍是否能压在 2 分钟内"],
      },
    },
  ],
});

// —— j1 真实面试记录（一面） ——

const j1Transcript: TranscriptSeg[] = [
  { t: "00:00", speaker: "interviewer", text: "先自我介绍一下吧。" },
  { t: "00:12", speaker: "me", text: "我是林深，5 年前端/全栈，主导过实时协作编辑器的冲突算法重构，同编延迟从 800ms 降到 120ms；也做过电商中台的性能治理，首屏从 5.1 秒压到 1.6 秒。" },
  { t: "01:05", speaker: "interviewer", text: "协作编辑器这个有意思。CRDT 相比 OT 你具体怎么权衡的？内存问题怎么控制？" },
  { t: "01:24", speaker: "me", text: "呃…主要是 CRDT 收敛性更好，内存我们做了增量 GC，不过具体数字我记不太清了。", flags: ["vague", "noEvidence"] },
  { t: "02:40", speaker: "interviewer", text: "那 120ms 是在什么环境测的？" },
  { t: "02:52", speaker: "me", text: "本地压测环境，真实环境可能会高一些，这块我没细看。", flags: ["vague"] },
  { t: "04:10", speaker: "interviewer", text: "如果放到抖音电商这种亿级流量，你会怎么设计？" },
  { t: "04:31", speaker: "me", text: "我需要再想想，可能要加分片和边缘节点……", flags: ["broken"] },
  { t: "06:02", speaker: "interviewer", text: "好，那我们聊聊你在团队里的角色。" },
  { t: "06:15", speaker: "me", text: "我主要负责协同层，渲染层是另一位同事负责的。我还带过两个新人，组织每周的前端分享。" },
  { t: "08:47", speaker: "interviewer", text: "你们编辑器的发布是怎么做灰度的？出了问题怎么回滚？" },
  { t: "09:03", speaker: "me", text: "我们有双写灰度方案，新旧协同引擎并行跑，对比一致性之后逐步放量。回滚就是把流量切回旧引擎。" },
];

const j1RecordQas: RecordQa[] = [
  { q: "CRDT 相比 OT 你具体怎么权衡的？内存问题怎么控制？", a: "呃…主要是 CRDT 收敛性更好，内存我们做了增量 GC，不过具体数字我记不太清了。", chain: 1, fromResume: "b1", hookHit: true, issue: "钩子成功引来追问，但关键数字答不上——含糊且缺依据", better: "OT 需要中心化转换服务、横向扩展差；CRDT 无中心、最终收敛，代价是元数据内存膨胀。我们用增量 GC + 墓碑压缩，把单文档内存控制在可接受范围（具体数字需你核实后填入）。" },
  { q: "120ms 是在什么环境测的？", a: "本地压测环境，真实环境可能会高一些，这块我没细看。", chain: 1, fromResume: "b1", hookHit: true, issue: "「没细看」损害严谨形象——数据口径必须主动交代", better: "120ms 是本地 500 并发压测数字；上线后灰度阶段我们持续看监控，线上 P95 的具体数字我需要核实后补充。压测和线上口径分开说，反而加分。" },
  { q: "如果放到抖音电商这种亿级流量，你会怎么设计？", a: "我需要再想想，可能要加分片和边缘节点……", chain: 0, fromResume: null, hookHit: false, issue: "回答中断、只有方向没有结构", better: "结构化：读写分离 → 按房间分片 → 热点房间二次拆分 → 边缘就近接入；瓶颈在广播扇出，用合并推送 + 分级降级（只读模式）兜底。" },
  { q: "你在团队里的角色？", a: "我主要负责协同层，渲染层是另一位同事负责的。我还带过两个新人。", chain: 0, fromResume: "b1", hookHit: false, better: "" },
  { q: "编辑器发布怎么做灰度？出问题怎么回滚？", a: "双写灰度方案，新旧引擎并行跑，对比一致性后逐步放量，回滚切回旧引擎。", chain: 0, fromResume: null, hookHit: false, better: "" },
];

export const seedRecords = (): InterviewRecord[] => [
  {
    id: "r1", jobId: "j1", date: "昨天", source: "字节一面_0712.m4a", duration: "38:24",
    transcript: j1Transcript,
    qas: j1RecordQas,
    hooks: [
      { hook: "主导实时协作编辑器冲突算法重构（b1）", hit: true, note: "成功引导：面试官顺着这条连续追问了 2 轮（CRDT 权衡 → 测量环境），但两次都没接住细节" },
    ],
    notes: [
      { section: "面试流程", content: "自我介绍 1 分钟 → 项目深挖 5 分钟 → 系统设计 2 分钟 → 团队协作 2 分钟 → 工程实践 1 分钟。整体节奏快，追问密度高。" },
      { section: "技术考察", content: "集中在协同编辑器：CRDT/OT 权衡、内存控制、测量口径、亿级扩展。面试官明显在验证简历第一条的真实深度。" },
      { section: "行为考察", content: "团队角色问题回答良好，个人/团队边界清晰，主动提到带新人。" },
      { section: "面试官关注点", content: "反复出现的关键词：数据口径、真实环境、可扩展性。二面大概率继续追系统设计。" },
    ],
    score: 76,
    verdict: "钩子有效——面试官整场围着协作编辑器打转；但数字接不住，把最强的项目答成了最大的失分点。",
    highlights: ["开场自我介绍紧扣岗位，用量化成果快速建立可信度", "个人/团队边界表达清晰", "灰度发布回答扎实（双写方案讲得具体）"],
    issues: ["CRDT 内存权衡答「记不太清」，钩子被问穿", "「本地压测/没细看」暴露数据口径不严谨", "亿级设计题只有方向没有结构"],
    gaps: ["自研项目的关键技术数字掌握不牢", "超大流量系统设计缺少结构化框架", "缺少「压测 vs 线上」的严谨表达习惯"],
    nextPrep: ["把 CRDT 内存/GC 数字核实并背熟", "写一页亿级协同系统设计提纲", "为每个量化成果补「测量环境 + 数据来源」"],
    suggestions: [
      { id: "s0", target: "qa", state: "accepted", title: "「亿级流量协同架构」加入高风险题", detail: "一面已考、回答中断——已加入 QA 并标记高风险（q8）。" },
      { id: "s1", target: "qa", state: "pending", title: "新问题：编辑器灰度发布与回滚", detail: "面试官问了简历之外的工程实践问题，你答得不错——建议沉淀为正式准备答案，二面可能深挖。", qa: { cat: "tech", q: "编辑器发布怎么做灰度？出问题怎么回滚？", answer: "双写灰度：新旧协同引擎并行跑，实时对比一致性指标，按 1%→10%→50% 放量；异常时流量一键切回旧引擎。可补充：一致性对比的具体指标是什么。", jdReq: "工程化与监控", prep: "doing", highRisk: false, followUps: ["一致性对比看哪些指标？", "灰度期间发现过什么问题？"] } },
      { id: "s2", target: "resume", state: "pending", title: "b1 建议补充数据口径", detail: "「120ms」两次被追问测量环境。建议在简历中主动标注口径，化被动为主动。数字需你核实后确认。", bulletId: "b1", suggestion: "主导实时协作编辑器冲突算法重构，用 CRDT 替换原 OT 实现，本地 500 并发压测下多人同编延迟从 800ms 降至 120ms", reason: "真实面试中「120ms」两次被追问测量环境——主动写明口径" },
      { id: "s3", target: "evidence", state: "pending", title: "经历卡待补：CRDT 内存与 GC 的具体数字", detail: "「实时协作编辑器」经历卡的难点部分缺少内存峰值/GC 策略/压缩比数字，一面被问穿。建议回查监控或 PR 记录补齐。", evidenceId: "e1", note: "一面复盘：CRDT 内存开销与 GC 策略的具体数字待整理（内存峰值 / GC 触发策略 / 墓碑压缩比）" },
    ],
  },
];

/* ================= AI mock 模式的兜底生成器 =================
   原则：不编造事实。兜底内容要么来自用户已确认的经历（确定性拼装），
   要么是明确标注「待补充/待确认」的准备框架。 */

const BASE_SUMMARY_PREFIX = "通用简历，不绑定具体岗位。";

/** 基础模式简历的个人简介模板。job 为 null 时是通用简历的说法 */
export function resumeSummary(job: Job | null, evCount: number): string {
  const from = "以下内容全部来自你的职业经历库（" + evCount + " 张经历卡），无编造成分——请补充时间段";
  return job
    ? "面向「" + job.company + " · " + job.role + "」定制。" + from + "并按岗位调整叙事重点。"
    : BASE_SUMMARY_PREFIX + from + "。之后添加目标岗位时，可以基于这份简历派生岗位定制版。";
}

/** 这段简介是不是我们生成的通用简历模板——只有它才可以在打底时安全改写，
 *  AI 写的或用户自己改过的简介一律不动 */
export function isBaseTemplateSummary(summary: string): boolean {
  return summary.startsWith(BASE_SUMMARY_PREFIX);
}

// 经历 → 简历的确定性编译（fallback：AI 不可用时也能生成可追溯的简历）
// job 为 null 时编译的是不绑定岗位的通用简历
export function fallbackResume(job: Job | null, evidence: Evidence[]): Resume {
  const usable = evidence.filter((e) => e.status !== "insufficient");
  const byProject = new Map<string, Evidence[]>();
  usable.forEach((e) => {
    const k = e.project;
    byProject.set(k, (byProject.get(k) || []).concat([e]));
  });
  let n = 0;
  const exp = Array.from(byProject.entries()).map(([project, evs]) => ({
    company: project,
    role: evs[0].roles[0] || "工程师",
    period: "时间待补充",
    bullets: evs.map((e): ResumeBullet => {
      n += 1;
      return {
        id: "fb" + n,
        text: e.title + "：" + (e.actions[0] || "") + (e.results[0] ? "，" + e.results[0] : ""),
        evId: e.id,
        ev: e.title,
        evStatus: e.status === "confirmed" ? "confirmed" : "pending",
        hook: false,
        probe: e.status !== "confirmed" ? "该段经历尚未确认，追问个人边界时有风险" : e.challenges[0] ? "难点细节：" + e.challenges[0] : undefined,
      };
    }),
  }));
  const skills = Array.from(new Set(usable.flatMap((e) => e.skills))).slice(0, 10);
  return { summary: resumeSummary(job, usable.length), exp, skills };
}

// 简历 + 岗位 → QA 的确定性生成（fallback）
export function fallbackQa(job: Job, resume: Resume): QaItem[] {
  const items: QaItem[] = [];
  let n = 0;
  const push = (p: Omit<QaItem, "id" | "origin">) => {
    n += 1;
    items.push({ ...p, id: "fq" + n, origin: "generated" });
  };
  push({ cat: "intro", q: "30 秒自我介绍", answer: "提炼你简历摘要的前两句 + 最强的一条量化成果 + 一句与「" + job.role + "」的关联。当前摘要：" + resume.summary.slice(0, 60) + "…", prep: "todo", highRisk: false, jdReq: "整体匹配" });
  push({ cat: "intro", q: "2 分钟自我介绍", answer: "结构：我是谁（10s）→ 两个代表项目各 40s（用简历前两条 bullet）→ 为什么匹配这个岗位（20s）。待你按真实经历填写。", prep: "todo", highRisk: false, jdReq: "整体匹配" });
  const hookB = resume.exp.flatMap((x) => x.bullets).find((b) => b.hook);
  const firstB = hookB || resume.exp[0]?.bullets[0];
  if (firstB) {
    push({ cat: "project", q: "项目讲述：" + (firstB.ev || "核心项目") + "（STAR）", fromBullet: firstB.id, jdReq: "核心能力验证", answer: "按 背景→职责→关键决策→难点→结果→佐证 组织。注意：只讲经历卡里已确认的内容。", prep: "todo", highRisk: false, followUps: ["个人 vs 团队边界？", "量化数字的来源？"] });
  }
  resume.exp.flatMap((x) => x.bullets).forEach((b) => {
    if (b.probe) {
      push({ cat: "resume", q: "针对「" + b.text.slice(0, 24) + "…」的追问：" + b.probe, fromBullet: b.id, jdReq: b.ev || "简历内容", answer: b.evStatus !== "confirmed" ? "（该条经历未确认，先去经历库确认，再写答案）" : "（待准备：围绕这个追问点写出可验证的细节）", prep: b.evStatus !== "confirmed" ? "risk" : "todo", highRisk: b.evStatus !== "confirmed", followUps: undefined });
    }
  });
  push({ cat: "tech", q: "岗位相关的技术深挖（按 JD：" + (job.jd.slice(0, 30) || "核心技术要求") + "…）", jdReq: "必要能力", answer: "从 JD 必要能力中挑你最强的一项，准备一个完整技术决策故事。", prep: "todo", highRisk: false });
  push({ cat: "biz", q: "你的工作对业务指标产生过什么影响？", jdReq: "业务理解", answer: "如果经历库中没有业务指标数据，如实说明，并准备「如果重来怎么设指标」的思考。不要编造数字。", prep: "todo", highRisk: true });
  push({ cat: "collab", q: "举一个跨团队协作/推动的例子", jdReq: "协作能力", answer: "从经历卡的「协作过程」字段中选素材，讲清楚：分歧是什么、你怎么降低对方的决策成本。", prep: "todo", highRisk: false });
  push({ cat: "risk", q: "简历中所有量化数字的来源，你都能答上来吗？", jdReq: "可信度", answer: "逐条核对简历 bullet 的数字来源。答不上来源的数字，要么补上依据，要么接受去夸大建议。", prep: "todo", highRisk: true });
  push({ cat: "reverse", q: "反问：这个岗位未来半年最重要的目标是什么？", answer: "了解考核预期与优先级。", prep: "todo", highRisk: false });
  push({ cat: "reverse", q: "反问：团队目前最大的技术挑战是什么？", answer: "判断岗位真实工作内容，展示技术兴趣。", prep: "todo", highRisk: false });
  return items;
}

export function fallbackMockReport(msgs: { role: string; content: string }[]): MockReport {
  const answers = msgs.filter((m) => m.role === "user");
  const short = answers.filter((m) => m.content.length < 40).length;
  return {
    overall: "本场共回答 " + answers.length + " 个问题" + (short ? "，其中 " + short + " 个回答偏短（不足 40 字）——面试官通常会追问被略过的细节" : "，回答长度基本合格") + "。以下按记录客观整理，未做能力评分。",
    good: answers.length ? ["能持续跟上追问节奏，没有回避问题"] : [],
    exposed: short ? ["偏短的回答通常意味着细节储备不足，建议对照 QA 逐条补强"] : [],
    incomplete: answers.length < 3 ? ["本场问答轮次较少，覆盖面有限，建议再来一轮"] : [],
    redo: ["把本场答得最含糊的一题写成书面答案，存入 QA"],
    resumeSuggestions: [],
    nextFocus: ["下一场优先检验：本场暴露的薄弱点是否已补齐"],
  };
}

// 转写文本 → 结构化记录的确定性解析（fallback）：
// 识别「面试官：/我：」说话人，抽取问答对，标记含糊表述。
export function parseTranscript(text: string): { transcript: TranscriptSeg[]; qas: RecordQa[] } {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const segs: TranscriptSeg[] = [];
  let sec = 0;
  for (const line of lines) {
    const isIv = /^(面试官|考官|Interviewer)[:：]/.test(line);
    const isMe = /^(我|候选人|Me)[:：]/.test(line);
    const body = line.replace(/^[^:：]*[:：]/, "").trim();
    if (!body) continue;
    const flags: SegFlag[] = [];
    if (isMe) {
      if (/记不|不太清|没细看|不确定|可能|大概|应该是/.test(body)) flags.push("vague");
      if (/我需要再想想|嗯…|呃|……$/.test(body)) flags.push("broken");
    }
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    segs.push({ t: mm + ":" + ss, speaker: isIv ? "interviewer" : isMe ? "me" : "me", text: body, flags: flags.length ? flags : undefined });
    sec += 45 + Math.min(90, Math.floor(body.length / 2));
  }
  const qas: RecordQa[] = [];
  for (let i = 0; i < segs.length; i++) {
    if (segs[i].speaker === "interviewer" && /[？?]|介绍|聊聊|说说/.test(segs[i].text)) {
      const ans: string[] = [];
      let j = i + 1;
      while (j < segs.length && segs[j].speaker === "me") {
        ans.push(segs[j].text);
        j++;
      }
      if (ans.length) {
        const joined = ans.join(" ");
        const vague = /记不|不太清|没细看|不确定/.test(joined);
        qas.push({ q: segs[i].text, a: joined, fromResume: null, hookHit: false, issue: vague ? "回答含糊：出现「记不清/没细看」类表述，缺少可验证细节" : undefined, better: vague ? "补上具体数字与数据来源；答不出时明确说「回去核实后补充」，不要含糊带过。" : "" });
      }
    }
  }
  return { transcript: segs, qas };
}

export function fallbackRecord(job: Job, source: string, text: string, recId: string): InterviewRecord {
  const { transcript, qas } = parseTranscript(text);
  const vagueCount = transcript.filter((s) => s.flags?.length).length;
  const sugs: InterviewRecord["suggestions"] = [];
  qas.forEach((qa, i) => {
    if (qa.issue) {
      sugs.push({
        id: recId + "-s" + i, target: "qa", state: "pending",
        title: "新问题加入 QA：" + qa.q.slice(0, 24) + "…",
        detail: "本场回答存在「" + qa.issue + "」，建议沉淀为正式准备答案。",
        qa: { cat: "resume", q: qa.q, answer: "（真实面试中回答含糊，重写：）" + (qa.better || ""), prep: "risk", highRisk: true, jdReq: "真实面试暴露" },
      });
    }
  });
  return {
    id: recId, jobId: job.id, date: "刚刚", source,
    transcript, qas,
    hooks: [],
    notes: [
      { section: "解析说明", content: "本记录由转写文本确定性解析生成：识别说话人、抽取问答对、标记含糊表述。接入真实 AI 后将补充追问链路与钩子命中分析。" },
      { section: "问答统计", content: "共识别 " + qas.length + " 个问答对，其中 " + qas.filter((q) => q.issue).length + " 个回答存在含糊/缺依据表述。" },
    ],
    score: 0,
    verdict: qas.length ? "共 " + qas.length + " 问，" + vagueCount + " 处含糊表述——先把标记的回答补成可验证的版本。" : "未能从文本中识别出问答对——请确认转写包含「面试官：/我：」说话人前缀。",
    highlights: [],
    issues: transcript.filter((s) => s.flags?.length).map((s) => "「" + s.text.slice(0, 30) + "…」（" + (s.flags || []).map((f) => (f === "vague" ? "含糊" : f === "broken" ? "中断" : f)).join("/") + "）"),
    gaps: [], nextPrep: ["处理下方建议，把含糊回答重写进 QA"],
    suggestions: sugs,
  };
}
