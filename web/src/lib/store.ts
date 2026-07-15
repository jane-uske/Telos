"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ask, askAgent, agentAvailable, parseJSON, setAiErrorHandler } from "./ai";
import { searchEvidenceTool, draftEvidenceTool } from "./agentTools";
import { idbStorage } from "./storage";
import {
  seedEvidence,
  seedJobs,
  seedAnalyses,
  seedMatches,
  seedResumes,
  seedResumeVersions,
  seedQa,
  seedMocks,
  seedRecords,
  fallbackResume,
  fallbackQa,
  fallbackMockReport,
  fallbackRecord,
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
  ResumeBullet,
  ResumeVersion,
  QaItem,
  QaPrep,
  MockSession,
  MockReport,
  InterviewRecord,
  TemplateSpec,
  TplPreset,
  InterviewMsg,
  InterviewSummary,
  ImportSegment,
} from "./types";

const uid = (p: string) => p + Math.random().toString(36).slice(2, 8);

interface JobDraft {
  company: string;
  role: string;
  jd: string;
}

interface State {
  screen: Screen;
  tab: Tab;
  toast: string | null;
  guideDismissed: boolean;
  /** 本机持久化数据是否已恢复完成 */
  hydrated: boolean;

  // 简历导入（证据流程的入口步骤）
  importText: string;
  importParsed: ImportSegment[] | null;
  importing: boolean;
  importedIdx: number[];

  // AI 职业访谈（证据补全流程）
  ivProject: (Partial<Evidence> & { id: string; title: string }) | null;
  ivMsgs: InterviewMsg[];
  ivInput: string;
  ivLoading: boolean;
  ivSummary: InterviewSummary | null;
  /** Agent 访谈中实时起草的证据卡草稿——仅草稿，结束访谈后经用户确认才入库 */
  ivDraft: Partial<Evidence> | null;

  // 证据库
  evidenceFilter: string;
  evidence: Evidence[];
  editingEvidenceId: string | null;

  // 岗位
  jobs: Job[];
  activeJobId: string;
  jobDraft: JobDraft | null;
  jdLoading: boolean;
  analyses: Record<string, Analysis>;
  matches: Record<string, Match>;
  /** 批量岗位分析进度（Agent ①）；null = 未在跑 */
  batch: { running: boolean; total: number; done: number; current: string | null } | null;
  /** 一键备齐申请包编排（Agent ③）；stage=confirm 时等用户逐条确认简历建议 */
  prep: { jobId: string; stage: "analyzing" | "resume" | "confirm" | "qa" | "done" } | null;

  // 简历（一份简历绑定一个岗位）
  resumes: Record<string, Resume>;
  resumeVersions: Record<string, ResumeVersion[]>;
  resumeLoading: boolean;
  resumeTpl: string;
  resumeSpec: TemplateSpec | null;
  resumeRail: "content" | "template" | "custom";

  // 面试 QA
  qa: Record<string, QaItem[]>;
  qaLoading: boolean;
  qaStale: Record<string, boolean>;
  qaFilter: string;

  // 模拟面试
  mocks: Record<string, MockSession[]>;
  mockActive: boolean;
  mockMsgs: InterviewMsg[];
  mockInput: string;
  mockLoading: boolean;
  mockReport: MockReport | null;
  mockStale: Record<string, boolean>;

  // 面试记录与复盘
  records: InterviewRecord[];
  recJobId: string;
  recInput: string;
  recPhase: "idle" | "upload" | "transcribe" | "diarize" | "analyze";
  activeRecordId: string | null;

  // 基础动作
  patch: (p: Partial<State>) => void;
  showToast: (msg: string) => void;
  go: (tab: Tab) => void;
  setScreen: (screen: Screen) => void;
  activeJob: () => Job;
  openPackage: (jobId: string) => void;

  // 本机数据管理（设置页）
  resetToSeed: () => void;
  applyBackup: (data: PersistedState) => void;

  // 证据
  confirmEvidence: (id: string) => void;
  saveEvidence: (id: string, patch: Partial<Evidence>) => void;
  addEvidenceFromImport: (seg: ImportSegment, idx: number) => void;

  // 岗位
  createJob: () => void;
  createJobsFromImport: (list: { company: string; role: string; jd: string }[]) => void;
  updateJd: (id: string, val: string) => void;
  moveJobStatus: (id: string, dir: number) => void;
  analyzeJd: () => Promise<void>;
  analyzeJobById: (jobId: string) => Promise<void>;
  batchAnalyze: () => Promise<void>;
  prepPackage: () => Promise<void>;
  prepContinueQa: () => Promise<void>;

  // 简历
  generateResume: () => Promise<void>;
  updateBullet: (jobId: string, bulletId: string, fn: (b: ResumeBullet) => ResumeBullet) => void;
  decideBullet: (jobId: string, bulletId: string, d: "accepted" | "rejected") => void;
  editBulletText: (jobId: string, bulletId: string, text: string) => void;
  toggleHook: (jobId: string, bulletId: string) => void;
  saveResumeVersion: (jobId: string) => void;
  restoreResumeVersion: (jobId: string, versionId: string) => void;
  pickTpl: (p: TplPreset) => void;
  setSpecField: (path: string, val: unknown) => void;
  copyText: (t: string) => void;

  // QA
  generateQa: () => Promise<void>;
  setQaPrep: (jobId: string, qaId: string, prep: QaPrep) => void;
  editQaAnswer: (jobId: string, qaId: string, answer: string) => void;

  // 模拟面试
  mockSystem: (jobId: string) => string;
  startMock: () => Promise<void>;
  sendMock: () => Promise<void>;
  endMock: () => Promise<void>;
  exitMock: () => void;

  // 面试记录
  analyzeRecordingText: () => Promise<void>;
  uploadRecording: (fileName: string) => void;
  applySuggestion: (recordId: string, sugId: string) => void;
  dismissSuggestion: (recordId: string, sugId: string) => void;

  // 访谈
  ivSystem: () => string;
  startInterview: (proj: State["ivProject"]) => Promise<void>;
  sendInterview: () => Promise<void>;
  endInterview: () => Promise<void>;
  applyInterviewSummary: () => void;

  // 导入
  doImport: () => Promise<void>;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

// 简历内容变化后，提示相关 QA / 模拟面试可能需要更新
const markStale = (st: State, jobId: string): Partial<State> => ({
  qaStale: st.qa[jobId]?.length ? { ...st.qaStale, [jobId]: true } : st.qaStale,
  mockStale: st.mocks[jobId]?.length ? { ...st.mockStale, [jobId]: true } : st.mockStale,
});

// JD → 岗位拆解的确定性兜底（不虚构：直接引用 JD 原文分句）
const buildFallbackAnalysis = (job: Job): Analysis => {
  const parts = job.jd.split(/[；;。]/).map((s) => s.trim()).filter(Boolean);
  return {
    responsibilities: parts.slice(0, 3).length ? parts.slice(0, 3) : ["（JD 原文过短，请补充更完整的 JD）"],
    mustHave: parts.slice(3, 5).length ? parts.slice(3, 5) : parts.slice(0, 2),
    niceToHave: parts.filter((p) => /优先|加分|优势/.test(p)),
    hidden: ["以上由 JD 原文拆分生成；接入真实 AI 后将补充隐含要求与面试重点"],
    interviewFocus: [],
  };
};

// 证据库 ↔ JD 的确定性关键词匹配兜底
const buildFallbackMatch = (job: Job, evidence: Evidence[]): Match => {
  const jd = job.jd.toLowerCase();
  const hit = (e: Evidence) => e.skills.filter((s) => jd.includes(s.toLowerCase()));
  const strongEv = evidence.filter((e) => e.status === "confirmed" && hit(e).length);
  const weakEv = evidence.filter((e) => e.status !== "confirmed" && hit(e).length);
  const coverage = Math.min(95, 25 + strongEv.length * 15 + weakEv.length * 5);
  return {
    metrics: { coverage, strength: Math.min(90, strongEv.length * 20), clarity: 70, risk: weakEv.length },
    strong: strongEv.map((e) => ({ req: hit(e).join("、"), ev: e.title, note: "技能关键词命中（确定性匹配），重点写" })),
    weak: weakEv.map((e) => ({ req: hit(e).join("、"), ev: e.title, note: "相关但证据未确认——确认前不要写「主导」" })),
    none: strongEv.length + weakEv.length ? [] : [{ req: "JD 核心要求", ev: null, note: "证据库中没有命中该 JD 的技能关键词，建议先补充证据" }],
    downplay: evidence.filter((e) => e.status === "confirmed" && !hit(e).length).slice(0, 2).map((e) => ({ text: e.title, why: "与该岗位关键词无交集，建议一句话带过" })),
    risks: evidence.filter((e) => e.note && hit(e).length).map((e) => ({ text: e.title + "：" + e.note, fix: "先在证据库中澄清，再写进简历" })),
  };
};

// ---- 本机持久化（IndexedDB，见 lib/storage.ts）----
// 只持久化领域数据和轻量导航状态；加载中/弹层/草稿等瞬态不落盘。
export const PERSIST_KEYS = [
  "screen",
  "tab",
  "guideDismissed",
  "evidence",
  "jobs",
  "activeJobId",
  "analyses",
  "matches",
  "resumes",
  "resumeVersions",
  "resumeTpl",
  "resumeSpec",
  "qa",
  "qaStale",
  "mocks",
  "mockStale",
  "records",
  "recJobId",
  "activeRecordId",
] as const;

export type PersistedState = Pick<State, (typeof PERSIST_KEYS)[number]>;

/** 取当前需要持久化的数据切片（persist partialize 与设置页导出共用同一份定义） */
export const snapshot = (s: State): PersistedState =>
  Object.fromEntries(PERSIST_KEYS.map((k) => [k, s[k]])) as unknown as PersistedState;

export const useStore = create<State>()(persist((set, get) => ({
  screen: "home",
  tab: "dashboard",
  toast: null,
  guideDismissed: false,
  hydrated: false,

  importText: "",
  importParsed: null,
  importing: false,
  importedIdx: [],

  ivProject: null,
  ivMsgs: [],
  ivInput: "",
  ivLoading: false,
  ivSummary: null,
  ivDraft: null,

  evidenceFilter: "all",
  evidence: seedEvidence(),
  editingEvidenceId: null,

  jobs: seedJobs(),
  activeJobId: "j1",
  jobDraft: null,
  jdLoading: false,
  analyses: seedAnalyses(),
  matches: seedMatches(),
  batch: null,
  prep: null,

  resumes: seedResumes(),
  resumeVersions: seedResumeVersions(),
  resumeLoading: false,
  resumeTpl: "classic",
  resumeSpec: null,
  resumeRail: "content",

  qa: seedQa(),
  qaLoading: false,
  qaStale: {},
  qaFilter: "all",

  mocks: seedMocks(),
  mockActive: false,
  mockMsgs: [],
  mockInput: "",
  mockLoading: false,
  mockReport: null,
  mockStale: {},

  records: seedRecords(),
  recJobId: "j1",
  recInput: "",
  recPhase: "idle",
  activeRecordId: null,

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

  openPackage: (jobId) => set({ activeJobId: jobId, recJobId: jobId, screen: "app", tab: "pkg" }),

  resetToSeed: () => {
    set({
      evidence: seedEvidence(),
      editingEvidenceId: null,
      evidenceFilter: "all",
      jobs: seedJobs(),
      activeJobId: "j1",
      jobDraft: null,
      analyses: seedAnalyses(),
      matches: seedMatches(),
      resumes: seedResumes(),
      resumeVersions: seedResumeVersions(),
      resumeTpl: "classic",
      resumeSpec: null,
      qa: seedQa(),
      qaStale: {},
      qaFilter: "all",
      mocks: seedMocks(),
      mockStale: {},
      mockActive: false,
      mockMsgs: [],
      mockReport: null,
      records: seedRecords(),
      recJobId: "j1",
      recInput: "",
      recPhase: "idle",
      activeRecordId: null,
      importText: "",
      importParsed: null,
      importedIdx: [],
      ivProject: null,
      ivMsgs: [],
      ivSummary: null,
      guideDismissed: false,
    });
    get().showToast("已清空本机数据并恢复演示内容");
  },

  applyBackup: (data) => {
    const jobs = data.jobs;
    const active = jobs.some((j) => j.id === data.activeJobId) ? data.activeJobId : jobs[0].id;
    // 导入后停留在设置页，不跳到备份里记录的页面
    set({
      ...data,
      activeJobId: active,
      recJobId: jobs.some((j) => j.id === data.recJobId) ? data.recJobId : active,
      screen: "app",
      tab: "settings",
      activeRecordId: null,
    });
    get().showToast("备份已导入 · 数据已恢复到导出时的状态");
  },

  confirmEvidence: (id) => {
    set((st) => ({
      evidence: st.evidence.map((e) =>
        e.id === id ? { ...e, status: "confirmed" as const, note: null } : e
      ),
    }));
    get().showToast("已确认，可在简历中放心引用");
  },

  saveEvidence: (id, patch) => {
    set((st) => ({
      evidence: st.evidence.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      editingEvidenceId: null,
    }));
    get().showToast("证据卡已更新");
  },

  addEvidenceFromImport: (seg, idx) => {
    const ev: Evidence = {
      id: uid("ev"),
      title: seg.title,
      project: seg.company,
      background: "",
      responsibilities: [],
      actions: seg.bullets || [],
      challenges: [],
      results: [],
      skills: [],
      roles: [],
      source: "旧简历导入",
      status: "pending",
      note: "从旧简历导入，待访谈补充：背景、个人职责边界、难点与可量化结果",
    };
    set((st) => ({ evidence: st.evidence.concat([ev]), importedIdx: st.importedIdx.concat([idx]) }));
    get().showToast("已加入证据库 · 建议用 AI 访谈补全细节");
  },

  createJob: () => {
    const d = get().jobDraft;
    if (!d || !d.company.trim() || !d.jd.trim()) {
      get().showToast("请填写公司名称并粘贴 JD");
      return;
    }
    const job: Job = {
      id: uid("j"),
      company: d.company.trim(),
      role: d.role.trim() || "目标岗位",
      status: "preparing",
      statusLabel: "准备投递",
      match: 0,
      updated: "刚刚",
      logo: d.company.trim().slice(0, 1),
      jd: d.jd.trim(),
    };
    set((st) => ({ jobs: st.jobs.concat([job]), activeJobId: job.id, recJobId: job.id, jobDraft: null }));
    get().go("pkg");
    get().showToast("岗位申请包已创建 · 先分析 JD");
  },

  createJobsFromImport: (list) => {
    const existing = new Set(get().jobs.map((j) => (j.company + "|" + j.role).toLowerCase()));
    const fresh: Job[] = [];
    let skipped = 0;
    for (const item of list) {
      const company = item.company.trim();
      const jd = item.jd.trim();
      if (!company || !jd) continue;
      const k = (company + "|" + item.role.trim()).toLowerCase();
      if (existing.has(k)) {
        skipped++;
        continue;
      }
      existing.add(k);
      fresh.push({
        id: uid("j"),
        company,
        role: item.role.trim() || "目标岗位",
        status: "saved",
        statusLabel: "收藏",
        match: 0,
        updated: "刚刚",
        logo: company.slice(0, 1),
        jd,
      });
    }
    if (!fresh.length) {
      get().showToast(skipped ? "全部 " + skipped + " 个岗位已存在，未重复导入" : "没有可导入的岗位");
      return;
    }
    set((st) => ({ jobs: st.jobs.concat(fresh) }));
    get().showToast("已导入 " + fresh.length + " 个岗位申请包" + (skipped ? "，跳过 " + skipped + " 个重复岗位" : "") + " · 逐个分析 JD 开始准备");
  },

  updateJd: (id, val) =>
    set((st) => ({
      jobs: st.jobs.map((j) => (j.id === id ? { ...j, jd: val } : j)),
    })),

  moveJobStatus: (id, dir) => {
    const order: Job["status"][] = ["saved", "preparing", "applied", "replied", "interviewing", "offer", "rejected"];
    const labels: Record<Job["status"], string> = { saved: "收藏", preparing: "准备投递", applied: "已投递", replied: "已回复", interviewing: "面试中", offer: "Offer", rejected: "拒绝" };
    set((st) => ({
      jobs: st.jobs.map((j) => {
        if (j.id !== id) return j;
        const i = Math.max(0, Math.min(order.length - 1, order.indexOf(j.status) + dir));
        return { ...j, status: order[i], statusLabel: labels[order[i]], updated: "刚刚" };
      }),
    }));
  },

  analyzeJobById: async (jobId) => {
    const j = get().jobs.find((x) => x.id === jobId);
    if (!j || !j.jd.trim()) return;
    const evSummary = get()
      .evidence.map((e) => e.title + "（" + e.status + "）：" + e.results.join("、"))
      .join("\n");
    const out = await ask(
      "目标岗位 JD：\n" + j.jd + "\n\n候选人的职业证据：\n" + evSummary + '\n\n请：1) 拆解 JD；2) 把 JD 要求和候选人证据逐条对照，明确指出：哪些经历应重点写、哪些应弱化、哪些能力缺证据、哪些表述不应夸大。只输出 JSON：{"analysis":{"responsibilities":[],"mustHave":[],"niceToHave":[],"hidden":[],"interviewFocus":[]},"match":{"metrics":{"coverage":0-100,"strength":0-100,"clarity":0-100,"risk":整数},"strong":[{"req":"","ev":"匹配的证据标题","note":"为什么重点写"}],"weak":[{"req":"","ev":"","note":""}],"none":[{"req":"","ev":null,"note":""}],"downplay":[{"text":"建议弱化的内容","why":"原因"}],"risks":[{"text":"可能夸大或缺依据的表述","fix":"更稳妥的改法"}]}}',
      { max_tokens: 1800 }
    );
    const parsed = parseJSON<{ analysis: Analysis; match: Match } | null>(out, null);
    const a = parsed?.analysis || seedAnalyses()[j.id] || buildFallbackAnalysis(j);
    const m: Match = parsed?.match
      ? { ...parsed.match, downplay: parsed.match.downplay || [] }
      : seedMatches()[j.id] || buildFallbackMatch(j, get().evidence);
    set((st) => ({
      analyses: { ...st.analyses, [j.id]: a },
      matches: { ...st.matches, [j.id]: m },
      jobs: st.jobs.map((x) => (x.id === j.id ? { ...x, match: m.metrics.coverage, updated: "刚刚" } : x)),
    }));
  },

  analyzeJd: async () => {
    const j = get().activeJob();
    if (!j.jd.trim()) {
      get().showToast("请先粘贴 JD");
      return;
    }
    set({ jdLoading: true });
    await get().analyzeJobById(j.id);
    set({ jdLoading: false });
  },

  // Agent ①：批量岗位分析——排队跑完所有未分析岗位，结果按证据覆盖度排序（见岗位列表的优先级面板）
  batchAnalyze: async () => {
    if (get().batch?.running) return;
    const targets = get().jobs.filter((j) => j.jd.trim() && !get().analyses[j.id]);
    if (!targets.length) {
      get().showToast("所有岗位都已分析过 · 优先级排序见下方面板");
      return;
    }
    set({ batch: { running: true, total: targets.length, done: 0, current: null } });
    for (let i = 0; i < targets.length; i++) {
      set((st) => ({ batch: { ...st.batch!, done: i, current: targets[i].company + " · " + targets[i].role } }));
      await get().analyzeJobById(targets[i].id);
    }
    set((st) => ({ batch: { ...st.batch!, running: false, done: targets.length, current: null } }));
    get().showToast("批量分析完成 · " + targets.length + " 个岗位已按证据覆盖度排序，建议先准备排名靠前的");
  },

  // Agent ③：一键备齐申请包——分析→简历→（停：用户确认简历建议）→QA
  prepPackage: async () => {
    const j = get().activeJob();
    if (!j.jd.trim()) {
      get().showToast("请先粘贴 JD");
      return;
    }
    if (get().prep && get().prep!.jobId === j.id && get().prep!.stage !== "done") return;
    set({ prep: { jobId: j.id, stage: "analyzing" } });
    if (!get().analyses[j.id]) await get().analyzeJobById(j.id);
    set({ prep: { jobId: j.id, stage: "resume" } });
    if (!get().resumes[j.id]) await get().generateResume();
    // 有待决策的 AI 建议就停下来等用户逐条确认——不自动替用户做决定
    const pending = (get().resumes[j.id]?.exp || []).flatMap((x) => x.bullets).filter((b) => b.suggestion && !b.decision);
    if (pending.length) {
      set({ prep: { jobId: j.id, stage: "confirm" } });
      get().showToast("简历已生成 · " + pending.length + " 条 AI 建议待你逐条确认后再生成 QA");
      return;
    }
    await get().prepContinueQa();
  },

  prepContinueQa: async () => {
    const p = get().prep;
    if (!p) return;
    set({ prep: { ...p, stage: "qa" } });
    if (!(get().qa[p.jobId] || []).length || get().qaStale[p.jobId]) await get().generateQa();
    set({ prep: { ...p, stage: "done" } });
  },

  generateResume: async () => {
    const j = get().activeJob();
    set({ resumeLoading: true });
    const ev = get()
      .evidence.filter((e) => e.status === "confirmed")
      .map((e) => e.title + "：" + e.actions.join("；") + "（成果：" + e.results.join("、") + "；难点：" + e.challenges.join("、") + "）")
      .join("\n");
    const out = await ask(
      "为岗位「" + j.company + " " + j.role + "」定制一份简历。JD：" + j.jd + "\n候选人已确认的证据：\n" + ev + '\n\n严格要求：所有描述必须来自上述证据，不要编造任何数据。每条内容标注对应证据、容易被追问的点。只输出 JSON：{"summary":"个人简介","exp":[{"company":"","role":"","period":"","bullets":[{"id":"唯一id","text":"","ev":"对应证据标题","evStatus":"confirmed","hook":false,"probe":"面试官容易追问的点"}]}],"skills":[]}',
      { max_tokens: 1800 }
    );
    const parsed = parseJSON<Resume | null>(out, null);
    const r = parsed && parsed.exp ? parsed : j.id === "j1" ? seedResumes().j1 : fallbackResume(j, get().evidence);
    set((st) => ({
      resumeLoading: false,
      resumes: { ...st.resumes, [j.id]: r },
      ...markStale(st, j.id),
    }));
  },

  updateBullet: (jobId, bulletId, fn) => {
    set((st) => {
      const r = st.resumes[jobId];
      if (!r) return {};
      const next: Resume = {
        ...r,
        exp: r.exp.map((x) => ({ ...x, bullets: x.bullets.map((b) => (b.id === bulletId ? fn(b) : b)) })),
      };
      return { resumes: { ...st.resumes, [jobId]: next }, ...markStale(st, jobId) };
    });
  },

  decideBullet: (jobId, bulletId, d) => {
    get().updateBullet(jobId, bulletId, (b) => ({
      ...b,
      decision: d,
      text: d === "accepted" ? b.suggestion || b.text : b.original || b.text,
    }));
    get().showToast(d === "accepted" ? "已接受 AI 建议" : "已拒绝，保留原文");
  },

  editBulletText: (jobId, bulletId, text) => {
    get().updateBullet(jobId, bulletId, (b) => ({ ...b, text, decision: b.suggestion ? "edited" : b.decision }));
  },

  toggleHook: (jobId, bulletId) => {
    let on = false;
    get().updateBullet(jobId, bulletId, (b) => {
      on = !b.hook;
      return { ...b, hook: !b.hook };
    });
    get().showToast(on ? "已标记为面试钩子 · 模拟面试会优先追问它" : "已取消面试钩子");
  },

  saveResumeVersion: (jobId) => {
    const r = get().resumes[jobId];
    if (!r) return;
    set((st) => {
      const list = st.resumeVersions[jobId] || [];
      const v: ResumeVersion = {
        id: uid("v"),
        label: "版本 v" + (list.length + 1),
        savedAt: "刚刚",
        data: JSON.parse(JSON.stringify(r)),
      };
      return { resumeVersions: { ...st.resumeVersions, [jobId]: list.concat([v]) } };
    });
    get().showToast("当前简历已存为新版本");
  },

  restoreResumeVersion: (jobId, versionId) => {
    set((st) => {
      const v = (st.resumeVersions[jobId] || []).find((x) => x.id === versionId);
      if (!v) return {};
      return {
        resumes: { ...st.resumes, [jobId]: JSON.parse(JSON.stringify(v.data)) },
        ...markStale(st, jobId),
      };
    });
    get().showToast("已切换到该版本");
  },

  pickTpl: (p) =>
    set({
      resumeTpl: p.id,
      resumeSpec: { specVersion: 1, sidebarRatio: 34, ...JSON.parse(JSON.stringify(p.spec)) } as TemplateSpec,
    }),

  setSpecField: (path, val) => {
    const s = get();
    const spec = JSON.parse(JSON.stringify(computeSpec(s.resumeSpec, s.resumeTpl)));
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

  generateQa: async () => {
    const j = get().activeJob();
    const r = get().resumes[j.id];
    if (!r) {
      get().showToast("请先生成该岗位的专属简历");
      return;
    }
    set({ qaLoading: true });
    const bullets = r.exp
      .flatMap((x) => x.bullets)
      .map((b) => "[" + b.id + (b.hook ? "·钩子" : "") + "] " + b.text + (b.probe ? "（易被追问：" + b.probe + "）" : ""))
      .join("\n");
    const evSummary = get()
      .evidence.map((e) => e.title + "（" + e.status + "）")
      .join("；");
    const out = await ask(
      "岗位：" + j.company + " " + j.role + "\nJD：" + j.jd + "\n\n当前简历内容（含 bullet id）：\n" + bullets + "\n\n证据库：" + evSummary + '\n\n为这份简历生成面试 QA：30秒/2分钟自我介绍、项目讲述、每条简历内容的预测问题与深挖追问、技术/业务/协作/风险/反问类问题。证据未确认的内容对应问题标记高风险。答案只能基于证据，缺数据处写明「待补充」。只输出 JSON 数组：[{"cat":"intro|project|resume|tech|biz|collab|risk|reverse","q":"","answer":"","fromBullet":"关联的bullet id或省略","jdReq":"对应岗位要求","prep":"todo","highRisk":false,"followUps":["可能的继续深挖"]}]',
      { max_tokens: 2400 }
    );
    const parsed = parseJSON<Omit<QaItem, "id" | "origin">[] | null>(out, null);
    const items: QaItem[] = Array.isArray(parsed) && parsed.length
      ? parsed.map((p, i) => ({ ...p, id: uid("q") + i, origin: "generated" as const }))
      : j.id === "j1"
      ? seedQa().j1
      : fallbackQa(j, r);
    set((st) => ({
      qaLoading: false,
      qa: { ...st.qa, [j.id]: items },
      qaStale: { ...st.qaStale, [j.id]: false },
    }));
    get().showToast("已生成 " + items.length + " 条面试 QA");
  },

  setQaPrep: (jobId, qaId, prep) => {
    set((st) => ({
      qa: { ...st.qa, [jobId]: (st.qa[jobId] || []).map((q) => (q.id === qaId ? { ...q, prep } : q)) },
    }));
  },

  editQaAnswer: (jobId, qaId, answer) => {
    set((st) => ({
      qa: { ...st.qa, [jobId]: (st.qa[jobId] || []).map((q) => (q.id === qaId ? { ...q, answer } : q)) },
    }));
  },

  mockSystem: (jobId) => {
    const s = get();
    const j = s.jobs.find((x) => x.id === jobId)!;
    const r = s.resumes[jobId];
    const bullets = r ? r.exp.flatMap((x) => x.bullets) : [];
    const hooks = bullets.filter((b) => b.hook).map((b) => b.text);
    const weak = (s.qa[jobId] || []).filter((q) => q.highRisk || q.prep === "risk").map((q) => q.q);
    const lastMock = (s.mocks[jobId] || []).slice(-1)[0];
    const lastRec = s.records.filter((x) => x.jobId === jobId).slice(-1)[0];
    return (
      "你是「" + j.company + " · " + j.role + "」的模拟面试官。基于候选人当前简历提问：\n" +
      bullets.map((b) => "- " + b.text).join("\n") +
      (hooks.length ? "\n候选人标记的面试钩子（优先深挖）：" + hooks.join("；") : "") +
      (weak.length ? "\n历史薄弱点（重点检验是否已补齐）：" + weak.join("；") : "") +
      (lastMock?.report ? "\n上次模拟面试的重点：" + lastMock.report.nextFocus.join("；") : "") +
      (lastRec ? "\n真实面试暴露的缺口：" + lastRec.gaps.join("；") : "") +
      "\n规则：每次只问一个问题；顺着回答连续追问；检查回答是否具体、有证据、是否自相矛盾；回答含糊时礼貌但坚定地要细节和数字。语气专业，回复 2-3 句以内。"
    );
  },

  startMock: async () => {
    const s = get();
    const j = s.activeJob();
    const r = s.resumes[j.id];
    if (!r) {
      s.showToast("模拟面试基于岗位专属简历，请先生成简历");
      return;
    }
    set({ mockActive: true, mockMsgs: [], mockReport: null, mockLoading: true });
    const out = await ask(
      "面试开始。请说一句简短开场，然后基于简历提出第一个问题（优先从面试钩子或最亮眼的量化成果切入）。只输出你要说的话。",
      { system: get().mockSystem(j.id) }
    );
    const bullets = r.exp.flatMap((x) => x.bullets);
    const target = bullets.find((b) => b.hook) || bullets[0];
    const first =
      out ||
      "你好，我是今天的模拟面试官。看到你简历里写「" +
        (target ? target.text.slice(0, 40) : "你的核心项目") +
        "…」——先用两分钟讲讲这个项目，重点说你个人做了什么、最难的地方在哪。";
    set({ mockLoading: false, mockMsgs: [{ role: "assistant", content: first }] });
  },

  sendMock: async () => {
    const s = get();
    const txt = s.mockInput.trim();
    if (!txt) return;
    const j = s.activeJob();
    const msgs = s.mockMsgs.concat([{ role: "user" as const, content: txt }]);
    set({ mockMsgs: msgs, mockInput: "", mockLoading: true });
    // Agent 模式（Anthropic 协议）：面试官先查证据库核实说法，再决定怎么追问
    if (agentAvailable()) {
      const agentOut = await askAgent(msgs, {
        system:
          get().mockSystem(j.id) +
          "\n你可以调用 search_evidence 工具核实候选人的说法在证据库里有没有支撑——没有证据的说法要往死里追问细节。",
        max_tokens: 500,
        tools: [searchEvidenceTool(() => get().evidence)],
      });
      if (agentOut) {
        set({
          mockMsgs: msgs.concat([{ role: "assistant", content: agentOut.text, tools: agentOut.toolNotes.length ? agentOut.toolNotes : undefined }]),
          mockLoading: false,
        });
        return;
      }
    }
    const out = await ask(msgs, { system: get().mockSystem(j.id), max_tokens: 400 });
    const turn = Math.floor(msgs.length / 2);
    const fallbacks = [
      "这里面哪些是你个人独立完成的，哪些是团队一起做的？边界说清楚一点。",
      "你刚才提到的结果，数据是从哪里来的？测量环境和口径是什么？",
      "如果当时换一种方案，代价是什么？为什么最终没有选它？",
      "这个说法和你前面讲的有出入——再确认一下，到底是哪种情况？",
      "最难的那个点，你当时卡了多久，具体怎么破的？",
      "假设数据量再放大十倍，你现在的方案哪里先崩？",
    ];
    const reply = out || fallbacks[turn % fallbacks.length];
    set({ mockMsgs: msgs.concat([{ role: "assistant", content: reply }]), mockLoading: false });
  },

  endMock: async () => {
    const s = get();
    const j = s.activeJob();
    if (s.mockMsgs.length < 2) {
      s.showToast("至少回答一个问题后再结束");
      return;
    }
    set({ mockLoading: true });
    const transcript = s.mockMsgs.map((m) => (m.role === "user" ? "候选人：" : "面试官：") + m.content).join("\n");
    const out = await ask(
      '基于以下模拟面试记录生成复盘报告。客观、不吹捧，指出被问穿和不完整的回答。只输出 JSON：{"overall":"整体表现一段话","good":["回答较好的部分"],"exposed":["被问穿的内容"],"incomplete":["回答不完整的问题"],"redo":["建议重新准备的答案"],"resumeSuggestions":["建议修改或删除的简历内容"],"nextFocus":["下一次模拟重点"]}\n\n' + transcript,
      { max_tokens: 1200 }
    );
    const report = parseJSON<MockReport | null>(out, null) || fallbackMockReport(s.mockMsgs);
    const session: MockSession = { id: uid("m"), date: "刚刚", msgs: s.mockMsgs, report };
    set((st) => ({
      mockLoading: false,
      mockReport: report,
      mocks: { ...st.mocks, [j.id]: (st.mocks[j.id] || []).concat([session]) },
      mockStale: { ...st.mockStale, [j.id]: false },
    }));
  },

  exitMock: () => set({ mockActive: false, mockMsgs: [], mockReport: null, mockInput: "" }),

  analyzeRecordingText: async () => {
    const s = get();
    const j = s.jobs.find((x) => x.id === s.recJobId) || s.jobs[0];
    if (!s.recInput.trim()) {
      s.showToast("请先粘贴或上传面试录音转写");
      return;
    }
    set({ recPhase: "analyze" });
    const bullets = (s.resumes[j.id]?.exp || []).flatMap((x) => x.bullets);
    const hooks = bullets.filter((b) => b.hook).map((b) => "[" + b.id + "] " + b.text);
    const out = await ask(
      "这是「" + j.company + " " + j.role + "」的真实面试转写。候选人简历要点：\n" + bullets.map((b) => "[" + b.id + "] " + b.text).join("\n") + (hooks.length ? "\n面试钩子：" + hooks.join("；") : "") + '\n\n请：区分说话人、按时间轴整理、抽取问答对与追问链、判断问题是否由简历触发、钩子是否命中、标记含糊/中断/缺证据/矛盾的回答并给出更好的回答、生成结构化笔记，并提出对 QA/简历/证据的修改建议（建议须用户确认，不得直接改写）。只输出 JSON：{"transcript":[{"t":"mm:ss","speaker":"interviewer|me","text":"","flags":["vague|broken|noEvidence|conflict"]}],"qas":[{"q":"","a":"","chain":0,"fromResume":"bullet id或null","hookHit":false,"issue":"","better":""}],"hooks":[{"hook":"","hit":false,"note":""}],"notes":[{"section":"","content":""}],"score":0,"verdict":"","highlights":[],"issues":[],"gaps":[],"nextPrep":[],"suggestions":[{"target":"qa|resume|evidence","title":"","detail":""}]}\n\n转写：\n' + s.recInput,
      { max_tokens: 3000 }
    );
    const recId = uid("r");
    type ParsedRec = Omit<InterviewRecord, "id" | "jobId" | "date" | "source" | "suggestions"> & {
      suggestions: { target: "qa" | "resume" | "evidence"; title: string; detail: string }[];
    };
    const parsed = parseJSON<ParsedRec | null>(out, null);
    const rec: InterviewRecord = parsed?.transcript
      ? {
          ...parsed,
          id: recId,
          jobId: j.id,
          date: "刚刚",
          source: "粘贴转写文本",
          suggestions: (parsed.suggestions || []).map((x, i) => ({ ...x, id: recId + "-s" + i, state: "pending" as const })),
        }
      : fallbackRecord(j, "粘贴转写文本", s.recInput, recId);
    set((st) => ({
      recPhase: "idle",
      recInput: "",
      records: st.records.concat([rec]),
      activeRecordId: rec.id,
    }));
    get().showToast("复盘完成 · 有 " + rec.suggestions.filter((x) => x.state === "pending").length + " 条建议待你确认");
  },

  uploadRecording: (fileName) => {
    const s = get();
    const demo =
      "面试官：先自我介绍一下吧。\n我：我是林深，5 年前端/全栈，主导过实时协作编辑器的冲突算法重构，同编延迟从 800ms 降到 120ms。\n面试官：这个项目里最难的技术决策是什么？\n我：应该是放弃 OT 改用 CRDT，不过当时的对比数据我记不太清了。\n面试官：上线之后出过什么线上问题吗？\n我：有一次灰度期间出现内存告警，我们加了增量 GC 之后解决了。\n面试官：内存降到多少？\n我：大概……这个具体数字我需要回去看一下监控。";
    set({ recPhase: "upload" });
    setTimeout(() => set({ recPhase: "transcribe" }), 700);
    setTimeout(() => set({ recPhase: "diarize" }), 1500);
    setTimeout(() => {
      set({ recPhase: "analyze", recInput: demo });
      const j = get().jobs.find((x) => x.id === get().recJobId) || get().jobs[0];
      const recId = uid("r");
      const rec = fallbackRecord(j, fileName + "（演示转写）", demo, recId);
      setTimeout(() => {
        set((st) => ({ recPhase: "idle", recInput: "", records: st.records.concat([rec]), activeRecordId: rec.id }));
        s.showToast("转录与复盘完成（演示模式：接入转写服务后为真实内容）");
      }, 900);
    }, 2300);
  },

  applySuggestion: (recordId, sugId) => {
    const s = get();
    const rec = s.records.find((r) => r.id === recordId);
    const sug = rec?.suggestions.find((x) => x.id === sugId);
    if (!rec || !sug) return;
    if (sug.target === "qa" && sug.qa) {
      const item: QaItem = { ...sug.qa, id: uid("q"), origin: "real" };
      set((st) => ({ qa: { ...st.qa, [rec.jobId]: (st.qa[rec.jobId] || []).concat([item]) } }));
      s.showToast("已加入面试 QA（来源：真实面试）");
    } else if (sug.target === "resume" && sug.bulletId) {
      get().updateBullet(rec.jobId, sug.bulletId, (b) => ({
        ...b,
        original: b.text,
        suggestion: sug.suggestion || b.text,
        reason: sug.reason || sug.detail,
        decision: undefined,
      }));
      s.showToast("已作为待决策建议放入简历编辑器");
    } else if (sug.target === "evidence" && sug.evidenceId) {
      set((st) => ({
        evidence: st.evidence.map((e) =>
          e.id === sug.evidenceId ? { ...e, note: (e.note ? e.note + "；" : "") + (sug.note || sug.detail) } : e
        ),
      }));
      s.showToast("已写入证据卡备注 · 可发起访谈补齐");
    } else {
      s.showToast("该建议已记录");
    }
    set((st) => ({
      records: st.records.map((r) =>
        r.id === recordId
          ? { ...r, suggestions: r.suggestions.map((x) => (x.id === sugId ? { ...x, state: "accepted" as const } : x)) }
          : r
      ),
    }));
  },

  dismissSuggestion: (recordId, sugId) => {
    set((st) => ({
      records: st.records.map((r) =>
        r.id === recordId
          ? { ...r, suggestions: r.suggestions.map((x) => (x.id === sugId ? { ...x, state: "dismissed" as const } : x)) }
          : r
      ),
    }));
    get().showToast("已忽略该建议");
  },

  ivSystem: () =>
    "你是一位资深技术面试官兼职业教练，正在对候选人的某个项目做深度访谈。规则：每次只问一个最关键的追问问题；基于候选人上一条回答顺藤摸瓜，不要机械问卷；依次覆盖项目背景与目标、候选人的具体职责与个人贡献边界、关键行动、技术难点与业务难点、协作与推动方式、可量化的最终结果、可验证的证据来源。当候选人说得笼统或夸大时要礼貌追问细节与证据。语气专业而有温度，回复 2-3 句以内。",

  startInterview: async (proj) => {
    set({ ivProject: proj, ivMsgs: [], ivSummary: null, ivDraft: null, ivLoading: true, screen: "app", tab: "interview" });
    const out = await ask(
      "你正在开始对候选人「" + proj!.title + "」这个项目做深度职业访谈。项目已知信息：" + (proj!.background || "很少，需要从头问起") + (proj!.note ? "。已知缺口：" + proj!.note : "") + "。请用 2-3 句话开场，并提出第一个最关键的追问问题（先了解项目背景与目标）。只输出你要说的话。",
      { system: get().ivSystem() }
    );
    const first = out || "我们来把「" + proj!.title + "」聊透。先说说这个项目最初是要解决什么问题？当时的背景和目标是什么，谁在推动它？";
    set({ ivLoading: false, ivMsgs: [{ role: "assistant", content: first }] });
  },

  sendInterview: async () => {
    const txt = get().ivInput.trim();
    if (!txt) return;
    const msgs = get().ivMsgs.concat([{ role: "user" as const, content: txt }]);
    set({ ivMsgs: msgs, ivInput: "", ivLoading: true });
    // Agent 模式：访谈官可查证据库避免重复问，并把问清楚的事实实时沉淀为草稿（用户最终确认才入库）
    if (agentAvailable()) {
      const agentOut = await askAgent(msgs, {
        system:
          get().ivSystem() +
          "\n你可以调用 search_evidence 检查证据库里已有什么（避免重复追问），并在候选人把某块事实说清楚后调用 draft_evidence_card 实时沉淀草稿——只记录原话事实，严禁推断补全。",
        max_tokens: 600,
        tools: [
          searchEvidenceTool(() => get().evidence),
          draftEvidenceTool((d) => set((st) => ({ ivDraft: { ...st.ivDraft, ...d } }))),
        ],
      });
      if (agentOut) {
        set({
          ivMsgs: msgs.concat([{ role: "assistant", content: agentOut.text, tools: agentOut.toolNotes.length ? agentOut.toolNotes : undefined }]),
          ivLoading: false,
        });
        return;
      }
    }
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
      summary: "候选人补充了该项目的背景与个人职责细节。以上总结基于访谈原话整理，未添加推断内容。",
      abilities: ["（演示模式：接入真实 AI 后从访谈原话中提炼）"],
      missing: ["量化数据的具体来源仍待确认"],
    };
    set({ ivLoading: false, ivSummary: parseJSON<InterviewSummary>(out, fb) });
  },

  applyInterviewSummary: () => {
    const s = get();
    const proj = s.ivProject;
    const sum = s.ivSummary;
    if (!proj || !sum) return;
    const draft = s.ivDraft || {};
    if (proj.id === "new") {
      const ev: Evidence = {
        id: uid("ev"),
        title: "访谈沉淀 · " + new Date().toLocaleDateString("zh-CN"),
        project: "访谈补充",
        background: draft.background || sum.summary,
        responsibilities: draft.responsibilities || [],
        actions: draft.actions || [],
        challenges: draft.challenges || [],
        results: draft.results || [],
        skills: (draft.skills || []).concat(sum.abilities.filter((a) => !a.startsWith("（") && !(draft.skills || []).includes(a))),
        roles: [],
        source: "AI 访谈",
        status: "pending",
        note: sum.missing.length ? "仍缺少：" + sum.missing.join("；") : null,
      };
      set((st) => ({ evidence: st.evidence.concat([ev]) }));
    } else {
      // 草稿只填补空字段，不覆盖用户已有内容
      set((st) => ({
        evidence: st.evidence.map((e) =>
          e.id === proj.id
            ? {
                ...e,
                background: e.background || draft.background || sum.summary,
                responsibilities: e.responsibilities.length ? e.responsibilities : draft.responsibilities || e.responsibilities,
                actions: e.actions.length ? e.actions : draft.actions || e.actions,
                challenges: e.challenges.length ? e.challenges : draft.challenges || e.challenges,
                results: e.results.length ? e.results : draft.results || e.results,
                skills: e.skills.length ? e.skills : draft.skills || e.skills,
                note: sum.missing.length ? "访谈后仍缺少：" + sum.missing.join("；") : null,
                source: e.source.includes("访谈") ? e.source : e.source + " + 访谈确认",
              }
            : e
        ),
      }));
    }
    set({ ivProject: null, ivSummary: null, ivMsgs: [], ivDraft: null });
    get().go("evidence");
    get().showToast("访谈成果已并入证据卡 · 请核对后确认");
  },

  doImport: async () => {
    if (!get().importText.trim()) {
      get().showToast("请先粘贴简历内容");
      return;
    }
    set({ importing: true, importedIdx: [] });
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
}),
{
  name: "proofcv-data",
  version: 1,
  storage: createJSONStorage(() => idbStorage),
  partialize: snapshot,
  // SSR 安全：由页面挂载后手动 rehydrate（见 app/page.tsx），避免和 React 注水竞争
  skipHydration: true,
  migrate: (persisted) => persisted as PersistedState,
  onRehydrateStorage: () => () => {
    useStore.setState({ hydrated: true });
  },
}
));

// AI 调用失败时的全局提示（结果照常回落到本地兜底，但明确告知用户，不假装成功）
setAiErrorHandler((msg) => useStore.getState().showToast(msg));
