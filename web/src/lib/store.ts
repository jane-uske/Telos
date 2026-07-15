"use client";

import { create } from "zustand";
import { ask, parseJSON } from "./ai";
import {
  seedEvidence,
  seedJobs,
  seedAnalyses,
  seedMatches,
  seedResumes,
  seedMats,
  seedReviews,
  seedMarket,
} from "./seed";
import { computeSpec } from "./templates";
import type {
  Screen,
  Tab,
  Evidence,
  Job,
  Analysis,
  Match,
  Resume,
  Mats,
  Review,
  MarketData,
  TemplateSpec,
  TplPreset,
  InterviewMsg,
  InterviewSummary,
  ImportSegment,
  GithubResult,
} from "./types";

interface State {
  screen: Screen;
  tab: Tab;
  toast: string | null;

  importText: string;
  importParsed: ImportSegment[] | null;
  importing: boolean;

  ivProject: (Partial<Evidence> & { id: string; title: string }) | null;
  ivMsgs: InterviewMsg[];
  ivInput: string;
  ivLoading: boolean;
  ivSummary: InterviewSummary | null;

  ghUrl: string;
  ghResult: GithubResult | null;
  ghLoading: boolean;

  activeJobId: string;
  jdLoading: boolean;

  resumeLoading: boolean;
  diffDecisions: Record<number, "accept" | "reject">;
  resumeTpl: string;
  resumeSpec: TemplateSpec | null;
  resumeRail: "template" | "custom" | "diff";

  matLoading: boolean;
  matTab: string;

  publicProfileOn: boolean;
  publicResumeOn: boolean;

  reviewJobId: string;
  reviewInput: string;
  reviewLoading: boolean;
  reviews: Record<string, Review | undefined>;

  marketKeyword: string;
  marketCity: string;
  marketPages: number;
  marketLoading: boolean;
  marketData: MarketData;
  marketPrompt: string;
  marketPromptLoading: boolean;

  evidenceFilter: string;
  evidence: Evidence[];
  jobs: Job[];
  analyses: Record<string, Analysis>;
  matches: Record<string, Match>;
  resumes: Record<string, Resume>;
  mats: Record<string, Mats>;

  // actions
  patch: (p: Partial<State>) => void;
  showToast: (msg: string) => void;
  go: (tab: Tab) => void;
  setScreen: (screen: Screen) => void;
  activeJob: () => Job;
  curSpec: () => TemplateSpec;

  confirmEvidence: (id: string) => void;
  addJob: () => void;
  updateJd: (id: string, val: string) => void;
  decideDiff: (i: number, d: "accept" | "reject") => void;
  moveJob: (id: string, dir: number) => void;
  pickTpl: (p: TplPreset) => void;
  setSpecField: (path: string, val: unknown) => void;
  copyText: (t: string) => void;

  doImport: () => Promise<void>;
  analyzeGithub: () => Promise<void>;
  analyzeJd: () => Promise<void>;
  generateResume: () => Promise<void>;
  generateMaterials: () => Promise<void>;
  startInterview: (proj: State["ivProject"]) => Promise<void>;
  sendInterview: () => Promise<void>;
  endInterview: () => Promise<void>;
  ivSystem: () => string;
  analyzeReview: () => Promise<void>;
  runMarket: () => void;
  genMarketPrompt: () => Promise<void>;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useStore = create<State>((set, get) => ({
  screen: "home",
  tab: "dashboard",
  toast: null,

  importText: "",
  importParsed: null,
  importing: false,

  ivProject: null,
  ivMsgs: [],
  ivInput: "",
  ivLoading: false,
  ivSummary: null,

  ghUrl: "",
  ghResult: null,
  ghLoading: false,

  activeJobId: "j1",
  jdLoading: false,

  resumeLoading: false,
  diffDecisions: {},
  resumeTpl: "classic",
  resumeSpec: null,
  resumeRail: "template",

  matLoading: false,
  matTab: "greeting",

  publicProfileOn: true,
  publicResumeOn: true,

  reviewJobId: "j1",
  reviewInput: "",
  reviewLoading: false,
  reviews: seedReviews(),

  marketKeyword: "前端",
  marketCity: "上海",
  marketPages: 3,
  marketLoading: false,
  marketData: seedMarket(),
  marketPrompt: "",
  marketPromptLoading: false,

  evidenceFilter: "all",
  evidence: seedEvidence(),
  jobs: seedJobs(),
  analyses: seedAnalyses(),
  matches: seedMatches(),
  resumes: seedResumes(),
  mats: seedMats(),

  patch: (p) => set(p as Partial<State>),

  showToast: (msg) => {
    set({ toast: msg });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: null }), 2200);
  },

  go: (tab) => set({ screen: "app", tab }),
  setScreen: (screen) => set({ screen }),

  activeJob: () => {
    const s = get();
    return s.jobs.find((j) => j.id === s.activeJobId) || s.jobs[0];
  },

  curSpec: () => {
    const s = get();
    return computeSpec(s.resumeSpec, s.resumeTpl);
  },

  confirmEvidence: (id) => {
    set((st) => ({
      evidence: st.evidence.map((e) =>
        e.id === id ? { ...e, status: "confirmed" as const, note: null } : e
      ),
    }));
    get().showToast("已确认，可在简历中放心引用");
  },

  addJob: () => {
    const jobs = get().jobs;
    const id = "j" + (jobs.length + 1);
    const job: Job = {
      id,
      company: "新岗位",
      role: "待填写",
      status: "preparing",
      statusLabel: "准备投递",
      match: 0,
      updated: "刚刚",
      logo: "新",
      jd: "",
    };
    set((st) => ({ jobs: st.jobs.concat([job]), activeJobId: id }));
    get().go("jd");
  },

  updateJd: (id, val) =>
    set((st) => ({
      jobs: st.jobs.map((j) => (j.id === id ? { ...j, jd: val } : j)),
    })),

  decideDiff: (i, d) =>
    set((st) => ({ diffDecisions: { ...st.diffDecisions, [i]: d } })),

  moveJob: (id, dir) => {
    const order: Job["status"][] = ["saved", "preparing", "applied", "replied", "interviewing", "offer", "rejected"];
    const labels: Record<Job["status"], string> = { saved: "收藏", preparing: "准备投递", applied: "已投递", replied: "已回复", interviewing: "面试中", offer: "Offer", rejected: "拒绝" };
    set((st) => ({
      jobs: st.jobs.map((j) => {
        if (j.id !== id) return j;
        const i = Math.max(0, Math.min(order.length - 1, order.indexOf(j.status) + dir));
        return { ...j, status: order[i], statusLabel: labels[order[i]] };
      }),
    }));
  },

  pickTpl: (p) =>
    set({
      resumeTpl: p.id,
      resumeSpec: { specVersion: 1, sidebarRatio: 34, ...JSON.parse(JSON.stringify(p.spec)) } as TemplateSpec,
    }),

  setSpecField: (path, val) => {
    const spec = JSON.parse(JSON.stringify(get().curSpec()));
    const ks = path.split(".");
    let o = spec;
    for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
    o[ks[ks.length - 1]] = val;
    set({ resumeSpec: spec });
  },

  copyText: (t) => {
    try {
      navigator.clipboard.writeText(t);
    } catch {}
    get().showToast("已复制到剪贴板");
  },

  doImport: async () => {
    if (!get().importText.trim()) {
      get().showToast("请先粘贴简历内容");
      return;
    }
    set({ importing: true });
    const raw = get().importText;
    const out = await ask(
      '把下面这份简历拆解成结构化 JSON。只输出 JSON 数组，每个元素形如 {"title":"项目/岗位一句话","company":"公司或项目","period":"时间段","bullets":["动作+成果，保留原文事实，不要编造数字"]}。原文：\n' + raw,
      { max_tokens: 1200 }
    );
    const fb: ImportSegment[] = [
      { title: "协作编辑器核心开发", company: "某在线文档 SaaS", period: "2022.06-至今", bullets: ["重构协作编辑器冲突算法", "优化实时同步性能"] },
      { title: "电商商家中台前端", company: "某电商公司", period: "2020.07-2022.05", bullets: ["负责商家中台前端与性能优化", "参与埋点 SDK 建设"] },
    ];
    const parsed = parseJSON<ImportSegment[]>(out, fb);
    set({ importing: false, importParsed: Array.isArray(parsed) ? parsed : fb });
  },

  analyzeGithub: async () => {
    if (!get().ghUrl.trim()) {
      get().showToast("请输入 GitHub 地址");
      return;
    }
    set({ ghLoading: true });
    const out = await ask(
      "假设你在分析这个 GitHub 项目：" + get().ghUrl + '。基于常见的同类开源项目，给出合理的推断。只输出 JSON：{"stack":["技术栈"],"complexity":0-100 的整数,"problems":["项目解决的问题"],"experiences":[{"title":"可写进简历的一句话","desc":"需要用户确认的细节，注明是推断"}]}',
      { max_tokens: 900 }
    );
    const fb: GithubResult = {
      stack: ["TypeScript", "React", "Vite", "Vitest"],
      complexity: 68,
      problems: ["提供一套可复用的表单校验与状态管理方案", "降低业务接入表单的重复代码"],
      experiences: [
        { title: "设计并维护一套 React 表单组件库", desc: "推断：你负责了核心 API 设计与文档，请确认具体贡献范围" },
        { title: "建立组件库的单测与 CI 流程", desc: "推断：仓库包含测试与 workflow，请确认是否由你搭建" },
      ],
    };
    set({ ghLoading: false, ghResult: parseJSON<GithubResult>(out, fb) });
  },

  analyzeJd: async () => {
    const j = get().activeJob();
    if (!j.jd.trim()) {
      get().showToast("请先粘贴 JD");
      return;
    }
    set({ jdLoading: true });
    const evSummary = get()
      .evidence.map((e) => e.title + "（" + e.status + "）：" + e.results.join("、"))
      .join("\n");
    const out = await ask(
      "目标岗位 JD：\n" + j.jd + "\n\n候选人的职业证据：\n" + evSummary + '\n\n请：1) 拆解 JD；2) 把 JD 要求和候选人证据逐条对照。只输出 JSON：{"analysis":{"responsibilities":[],"mustHave":[],"niceToHave":[],"hidden":[],"interviewFocus":[]},"match":{"metrics":{"coverage":0-100,"strength":0-100,"clarity":0-100,"risk":整数},"strong":[{"req":"","ev":"匹配的证据标题","note":""}],"weak":[{"req":"","ev":"","note":""}],"none":[{"req":"","ev":null,"note":""}],"risks":[{"text":"可能夸大或缺依据的表述","fix":"更稳妥的改法"}]}}',
      { max_tokens: 1800 }
    );
    const parsed = parseJSON<{ analysis: Analysis; match: Match } | null>(out, null);
    if (parsed && parsed.analysis && parsed.match) {
      set((st) => ({
        jdLoading: false,
        analyses: { ...st.analyses, [j.id]: parsed.analysis },
        matches: { ...st.matches, [j.id]: parsed.match },
        jobs: st.jobs.map((x) => (x.id === j.id ? { ...x, match: parsed.match.metrics.coverage, updated: "刚刚" } : x)),
      }));
    } else {
      const a = seedAnalyses().j1;
      const m = seedMatches().j1;
      set((st) => ({
        jdLoading: false,
        analyses: { ...st.analyses, [j.id]: a },
        matches: { ...st.matches, [j.id]: m },
        jobs: st.jobs.map((x) => (x.id === j.id ? { ...x, match: m.metrics.coverage, updated: "刚刚" } : x)),
      }));
    }
  },

  generateResume: async () => {
    const j = get().activeJob();
    set({ resumeLoading: true });
    const ev = get()
      .evidence.filter((e) => e.status === "confirmed")
      .map((e) => e.title + "：" + e.actions.join("；") + "（成果：" + e.results.join("、") + "）")
      .join("\n");
    const out = await ask(
      "为岗位「" + j.company + " " + j.role + "」定制一份简历。JD：" + j.jd + "\n候选人已确认的证据：\n" + ev + '\n\n严格要求：所有描述必须来自上述证据，不要编造任何数据。只输出 JSON：{"summary":"个人简介","exp":[{"company":"","role":"","period":"","bullets":[{"text":"","ev":"对应证据标题","status":"confirmed"}]}],"skills":[]}',
      { max_tokens: 1600 }
    );
    const parsed = parseJSON<Resume>(out, seedResumes().j1);
    set((st) => ({ resumeLoading: false, resumes: { ...st.resumes, [j.id]: parsed } }));
  },

  generateMaterials: async () => {
    const j = get().activeJob();
    set({ matLoading: true });
    const ev = get()
      .evidence.filter((e) => e.status === "confirmed")
      .map((e) => e.title + "：" + e.results.join("、"))
      .join("；");
    const out = await ask(
      "为岗位「" + j.company + " " + j.role + "」（JD：" + j.jd + "）生成一套求职材料，均基于候选人林深的真实证据：" + ev + '。不要编造数据。只输出 JSON：{"greeting":"BOSS 招呼语","email":"邮件开场","intro30":"30秒自我介绍","intro120":"2分钟自我介绍","story":"一个项目讲述稿(STAR)","questions":["面试官可能追问"],"gaps":[{"g":"能力缺口","s":"准备建议"}]}',
      { max_tokens: 2000 }
    );
    const parsed = parseJSON<Mats>(out, seedMats().j1);
    set((st) => ({ matLoading: false, mats: { ...st.mats, [j.id]: parsed } }));
  },

  ivSystem: () =>
    "你是一位资深技术面试官兼职业教练，正在对候选人的某个项目做深度访谈。规则：每次只问一个最关键的追问问题；基于候选人上一条回答顺藤摸瓜，不要机械问卷；依次覆盖项目背景与目标、候选人的具体职责与个人贡献边界、关键技术决策与权衡、最难的技术难点及解决过程、协作与推动方式、可量化的最终结果、可验证的证据来源。当候选人说得笼统或夸大时要礼貌追问细节与证据。语气专业而有温度，回复 2-3 句以内。",

  startInterview: async (proj) => {
    set({ ivProject: proj, ivMsgs: [], ivSummary: null, ivLoading: true });
    const out = await ask(
      "你正在开始对候选人「" + proj!.title + "」这个项目做深度职业访谈。项目已知信息：" + (proj!.background || "很少，需要从头问起") + "。请用 2-3 句话开场，并提出第一个最关键的追问问题（先了解项目背景与目标）。只输出你要说的话。",
      { system: get().ivSystem() }
    );
    const first = out || "我们来把「" + proj!.title + "」聊透。先说说这个项目最初是要解决什么问题？当时的背景和目标是什么，谁在推动它？";
    set({ ivLoading: false, ivMsgs: [{ role: "assistant", content: first }] });
  },

  sendInterview: async () => {
    const txt = get().ivInput.trim();
    if (!txt) return;
    const msgs = get().ivMsgs.concat([{ role: "user", content: txt }]);
    set({ ivMsgs: msgs, ivInput: "", ivLoading: true });
    const out = await ask(msgs, { system: get().ivSystem(), max_tokens: 400 });
    const reply = out || "明白。能再具体说说这里你个人做的关键决策是什么吗？为什么这样选，有没有对比过其他方案？";
    set({ ivMsgs: msgs.concat([{ role: "assistant", content: reply }]), ivLoading: false });
  },

  endInterview: async () => {
    set({ ivLoading: true });
    const transcript = get()
      .ivMsgs.map((m) => (m.role === "user" ? "候选人：" : "访谈者：") + m.content)
      .join("\n");
    const out = await ask(
      '基于以下访谈记录，总结候选人在这个项目中真正承担的工作和可证明的能力，并指出还缺少数据/证据的点。只输出 JSON：{"summary":"一段话客观总结真正做的事，不夸大","abilities":["可证明的能力"],"missing":["还缺少数据或证据的点"]}。\n\n' + transcript,
      { max_tokens: 700 }
    );
    const fb: InterviewSummary = {
      summary: "候选人主导了该项目的核心技术实现，独立完成关键模块设计并推动落地，具备较强的问题定位与工程化能力。",
      abilities: ["独立系统设计", "性能优化", "跨团队协作"],
      missing: ["部分成果缺少可验证的数据来源"],
    };
    set({ ivLoading: false, ivSummary: parseJSON<InterviewSummary>(out, fb) });
  },

  analyzeReview: async () => {
    const s = get();
    const j = s.jobs.find((x) => x.id === s.reviewJobId)!;
    if (!s.reviewInput.trim()) {
      s.showToast("请先粘贴或转写面试文本");
      return;
    }
    set({ reviewLoading: true });
    const out = await ask(
      "这是一场「" + j.company + " " + j.role + '」的面试录音转写。请做结构化复盘，客观指出表现，不吹捧。只输出 JSON：{"score":0-100整数,"verdict":"一句话诊断","highlights":["高光"],"issues":["失误/可改进"],"qa":[{"q":"被问到的问题","quality":"good|ok|weak","comment":"回答评估与更好的答法"}],"gaps":["新暴露的能力缺口"],"nextPrep":["下一轮准备清单"]}\n\n转写：\n' + s.reviewInput,
      { max_tokens: 1800 }
    );
    const parsed = parseJSON<Review>(out, seedReviews().j1!);
    set((st) => ({ reviewLoading: false, reviews: { ...st.reviews, [j.id]: parsed } }));
  },

  runMarket: () => {
    set({ marketLoading: true });
    setTimeout(() => {
      set((st) => ({
        marketLoading: false,
        marketData: { ...st.marketData, keyword: st.marketKeyword, city: st.marketCity },
        marketPrompt: "",
      }));
      const s = get();
      s.showToast("抓取完成：" + s.marketKeyword + " @ " + s.marketCity + "（演示数据）");
    }, 1100);
  },

  genMarketPrompt: async () => {
    set({ marketPromptLoading: true });
    const m = get().marketData;
    const fmt = (a: [string, number][]) => a.map((x) => x[0] + "(" + x[1] + ")").join("、");
    const fb =
      "请基于下面的 BOSS 直聘岗位市场摘要，帮我优化求职材料和面试准备。\n\n岗位：" + m.keyword + " @ " + m.city + "（列表 " + m.total_jobs + " 条，详情 " + m.total_details + " 条）\n高频技能：" + fmt(m.skill_tags.slice(0, 8)) + "\n常见薪资：" + fmt(m.salary_ranges.slice(0, 4)) + "\n主流经验：" + fmt(m.experience.slice(0, 3)) + "\nJD 高频词：" + fmt(m.jd_terms.slice(0, 8)) + "\n\n请输出：1) 简历技能关键词补齐建议；2) 项目/工作经历改写方向；3) 面试准备清单；4) 需避开的岗位特征。要求：不要虚构经历，只把我的真实证据改写得更贴近这些岗位，结论要引用上面的统计依据。";
    const out = await ask(
      "把下面这段市场统计整理成一段给 AI 用的求职优化提示词（保留统计数字，强调不得虚构经历、只贴近真实证据）：\n" + fb,
      { max_tokens: 700 }
    );
    set({ marketPromptLoading: false, marketPrompt: (out || fb).trim() });
  },
}));
