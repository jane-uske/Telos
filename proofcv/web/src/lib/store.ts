"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ask, askAgent, agentAvailable, aiMode, parseJSON, looksTruncated, setAiErrorHandler } from "./ai";
import { searchEvidenceTool, draftEvidenceTool } from "./agentTools";
import { idbStorage } from "./storage";
import { fetchMe, setSessionExpiredHandler, useAuth } from "./apiClient";
import { parseResumeText } from "./resumeParse";
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
  demoProfile,
  fallbackResume,
  fallbackQa,
  fallbackMockReport,
  fallbackRecord,
  resumeSummary,
  isBaseTemplateSummary,
} from "./seed";
import { computeSpec } from "./templates";
import { emptyProfile, BASE_RESUME_ID } from "./types";
import type {
  Screen,
  Tab,
  Evidence,
  Job,
  Analysis,
  Match,
  MatchItem,
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
  EvidenceKind,
  UserProfile,
  GenSource,
  PendingAiAction,
} from "./types";

const uid = (p: string) => p + Math.random().toString(36).slice(2, 8);

/** 登录/授权门控挂起的动作，存 sessionStorage：GitHub 整页跳转回来后继续执行 */
const PENDING_KEY = "rr-pending-ai";

interface JobDraft {
  company: string;
  role: string;
  jd: string;
}

/** AI 动作的执行方式：在线 AI or 基础模式（本地规则，不调用在线 AI） */
interface RunOpts {
  basic?: boolean;
}

interface State {
  screen: Screen;
  tab: Tab;
  toast: string | null;
  guideDismissed: boolean;
  /** 本机持久化数据是否已恢复完成 */
  hydrated: boolean;
  /** 演示模式：由用户显式加载示例数据，持续显示徽标，可退出并清空 */
  demoMode: boolean;
  /** 简历页眉个人信息（本机保存） */
  profile: UserProfile;
  /** 各生成物的来源标注：在线 AI / 基础模式 / 演示数据（key 如 "resume:j1"） */
  genSource: Record<string, GenSource>;
  /** 首次使用在线 AI 前的隐私授权（登录即视为同意，弹窗文案已说明） */
  aiConsented: boolean;
  /** 最近一次工作页（Dashboard「继续上次工作」入口） */
  lastWorkTab: Tab | null;

  /** AI 门控弹窗：未登录点在线 AI 功能时出现；consent=仅差首次授权 */
  aiGate: { pending: PendingAiAction; consent?: boolean } | null;
  loginOpen: boolean;

  // 简历导入（整理经历的入口步骤）
  importText: string;
  importParsed: ImportSegment[] | null;
  importing: boolean;
  importedIdx: number[];

  // AI 职业访谈（从零整理经历）
  ivProject: (Partial<Evidence> & { id: string; title: string }) | null;
  ivMsgs: InterviewMsg[];
  ivInput: string;
  ivLoading: boolean;
  ivSummary: InterviewSummary | null;
  /** 本场访谈是否为基础模式（本地预设问题，不调用在线 AI） */
  ivBasic: boolean;
  /** Agent 访谈中实时起草的证据卡草稿——仅草稿，结束访谈后经用户确认才入库 */
  ivDraft: Partial<Evidence> | null;

  // 经历（证据库）
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
  /** 岗位页视图：找目标岗位 / 我的申请 */
  jobsView: "find" | "track";
  /** 批量岗位分析进度；null = 未在跑 */
  batch: { running: boolean; total: number; done: number; current: string | null } | null;
  /** 一键备齐申请包编排；stage=confirm 时等用户逐条确认简历建议 */
  prep: { jobId: string; stage: "analyzing" | "resume" | "confirm" | "qa" | "done" } | null;

  // 简历（按岗位一岗一份，另有一份不绑定岗位的通用简历存在 BASE_RESUME_ID 槽位）
  resumes: Record<string, Resume>;
  resumeVersions: Record<string, ResumeVersion[]>;
  resumeLoading: boolean;
  resumeTpl: string;
  resumeSpec: TemplateSpec | null;
  resumeRail: "content" | "template" | "custom" | "profile";
  /** 简历编辑器当前编辑的是通用简历还是当前岗位的定制版 */
  resumeScope: "base" | "job";

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
  /** 本场模拟是否为基础模式 */
  mockBasic: boolean;

  // 面试记录与复盘
  records: InterviewRecord[];
  recJobId: string;
  recInput: string;
  recPhase: "idle" | "analyze";
  activeRecordId: string | null;

  // 基础动作
  patch: (p: Partial<State>) => void;
  showToast: (msg: string) => void;
  go: (tab: Tab) => void;
  setScreen: (screen: Screen) => void;
  activeJob: () => Job | null;
  openPackage: (jobId: string) => void;
  patchProfile: (p: Partial<UserProfile>) => void;

  // 演示模式 / 本机数据管理
  loadDemo: () => void;
  exitDemo: () => void;
  clearLocalData: () => void;
  applyBackup: (data: PersistedState) => void;

  // AI 门控
  requireAi: (pending: PendingAiAction, opts?: RunOpts) => "ai" | "basic" | null;
  gateContinueBasic: () => void;
  gateToLogin: () => void;
  closeGate: () => void;
  loginSucceeded: () => Promise<void>;
  dispatchPending: (p: PendingAiAction) => void;
  resumePendingFromSession: () => void;

  // 经历
  confirmEvidence: (id: string) => void;
  saveEvidence: (id: string, patch: Partial<Evidence>) => void;
  addEvidenceFromImport: (seg: ImportSegment, idx: number) => void;

  // 岗位
  createJob: () => void;
  createJobsFromImport: (list: { company: string; role: string; jd: string }[]) => void;
  updateJd: (id: string, val: string) => void;
  moveJobStatus: (id: string, dir: number) => void;
  analyzeJd: (opts?: RunOpts) => Promise<void>;
  analyzeJobById: (jobId: string, opts?: RunOpts) => Promise<boolean>;
  batchAnalyze: (opts?: RunOpts) => Promise<void>;
  prepPackage: (opts?: RunOpts) => Promise<void>;
  prepContinueQa: (opts?: RunOpts) => Promise<void>;

  // 简历
  generateResume: (opts?: RunOpts, target?: "base" | "job") => Promise<void>;
  openResume: (scope: "base" | "job") => void;
  importBaseToJob: () => void;
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
  generateQa: (opts?: RunOpts) => Promise<void>;
  setQaPrep: (jobId: string, qaId: string, prep: QaPrep) => void;
  editQaAnswer: (jobId: string, qaId: string, answer: string) => void;

  // 模拟面试
  mockSystem: (jobId: string) => string;
  startMock: (opts?: RunOpts) => Promise<void>;
  sendMock: () => Promise<void>;
  endMock: () => Promise<void>;
  exitMock: () => void;

  // 面试记录
  analyzeRecordingText: (opts?: RunOpts) => Promise<void>;
  applySuggestion: (recordId: string, sugId: string) => void;
  dismissSuggestion: (recordId: string, sugId: string) => void;

  // 访谈
  ivSystem: () => string;
  startInterview: (proj: State["ivProject"], opts?: RunOpts) => Promise<void>;
  sendInterview: () => Promise<void>;
  endInterview: () => Promise<void>;
  applyInterviewSummary: () => void;

  // 导入
  doImport: (opts?: RunOpts) => Promise<void>;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

// ---- 证据关联解析（v2：稳定 ID 为正式关联，标题只是展示缓存） ----

const normTitle = (t: string) => t.trim().toLowerCase();

/** 按 evId（优先）或标题快照解析证据；都找不到返回 null */
export function resolveEvidence(
  evidence: Evidence[],
  ref: { evId?: string | null; ev: string | null }
): Evidence | null {
  if (ref.evId) return evidence.find((e) => e.id === ref.evId) || null;
  if (ref.ev) return evidence.find((e) => normTitle(e.title) === normTitle(ref.ev!)) || null;
  return null;
}

/** AI 输出后处理：把（可能只有标题的）证据引用回填成稳定 ID + 现势状态 */
function linkBullet(evidence: Evidence[], b: ResumeBullet): ResumeBullet {
  const hit = resolveEvidence(evidence, b);
  return {
    ...b,
    evId: hit ? hit.id : null,
    ev: hit ? hit.title : b.ev,
    evStatus: hit ? (hit.status === "confirmed" ? "confirmed" : "pending") : "none",
  };
}

function linkMatchItem(evidence: Evidence[], x: MatchItem): MatchItem {
  const hit = resolveEvidence(evidence, x);
  return { ...x, evId: hit ? hit.id : null, ev: hit ? hit.title : x.ev };
}

// ---- 准备完成度（五步：分析/简历/QA/模拟/复盘），与投递进度（Job.status）是两回事 ----

export function prepDone(
  s: Pick<State, "analyses" | "resumes" | "qa" | "mocks" | "records">,
  jobId: string
): number {
  let n = 0;
  if (s.analyses[jobId]) n++;
  if (s.resumes[jobId]) n++;
  if ((s.qa[jobId] || []).length) n++;
  if ((s.mocks[jobId] || []).length) n++;
  if (s.records.some((r) => r.jobId === jobId)) n++;
  return n;
}

// 简历内容变化后，提示相关 QA / 模拟面试可能需要更新
const markStale = (st: State, jobId: string): Partial<State> => ({
  qaStale: st.qa[jobId]?.length ? { ...st.qaStale, [jobId]: true } : st.qaStale,
  mockStale: st.mocks[jobId]?.length ? { ...st.mockStale, [jobId]: true } : st.mockStale,
});

// JD → 岗位拆解的确定性拆分（基础模式：直接引用 JD 原文分句，不虚构）
const buildFallbackAnalysis = (job: Job): Analysis => {
  const parts = job.jd.split(/[；;。]/).map((s) => s.trim()).filter(Boolean);
  return {
    responsibilities: parts.slice(0, 3).length ? parts.slice(0, 3) : ["（JD 原文过短，请补充更完整的 JD）"],
    mustHave: parts.slice(3, 5).length ? parts.slice(3, 5) : parts.slice(0, 2),
    niceToHave: parts.filter((p) => /优先|加分|优势/.test(p)),
    hidden: ["以上由 JD 原文按标点拆分生成（基础模式）；使用在线 AI 可补充隐含要求与面试重点"],
    interviewFocus: [],
  };
};

// 证据库 ↔ JD 的确定性关键词匹配（基础模式）
const buildFallbackMatch = (job: Job, evidence: Evidence[]): Match => {
  const jd = job.jd.toLowerCase();
  const hit = (e: Evidence) => e.skills.filter((s) => s && jd.includes(s.toLowerCase()));
  const strongEv = evidence.filter((e) => e.status === "confirmed" && hit(e).length);
  const weakEv = evidence.filter((e) => e.status !== "confirmed" && hit(e).length);
  const coverage = Math.min(95, 25 + strongEv.length * 15 + weakEv.length * 5);
  return {
    metrics: { coverage, strength: Math.min(90, strongEv.length * 20), clarity: 70, risk: weakEv.length },
    strong: strongEv.map((e) => ({ req: hit(e).join("、"), evId: e.id, ev: e.title, note: "技能关键词命中（本地规则匹配），重点写" })),
    weak: weakEv.map((e) => ({ req: hit(e).join("、"), evId: e.id, ev: e.title, note: "相关但证据未确认——确认前不要写「主导」" })),
    none: strongEv.length + weakEv.length ? [] : [{ req: "JD 核心要求", evId: null, ev: null, note: "证据库中没有命中该 JD 的技能关键词，建议先补充经历" }],
    downplay: evidence.filter((e) => e.status === "confirmed" && !hit(e).length).slice(0, 2).map((e) => ({ text: e.title, why: "与该岗位关键词无交集，建议一句话带过" })),
    risks: evidence.filter((e) => e.note && hit(e).length).map((e) => ({ text: e.title + "：" + e.note, fix: "先在经历里澄清，再写进简历" })),
  };
};

/** Match 分析 → 生成简历/QA/模拟面试的结构化输入（强/弱/未匹配/风险的硬约束） */
function matchBrief(m: Match | undefined): string {
  if (!m) return "";
  const li = (x: MatchItem) => "- " + x.req + (x.ev ? "（证据：" + x.ev + "）" : "（无证据）") + "：" + x.note;
  return (
    "\n\n【证据匹配分析——生成时必须遵守】\n" +
    "强匹配（优先突出，放最显眼位置）：\n" + (m.strong.map(li).join("\n") || "（无）") +
    "\n弱匹配（谨慎表达：不写「主导/精通」等强断言，先如实描述参与程度）：\n" + (m.weak.map(li).join("\n") || "（无）") +
    "\n未匹配（禁止虚构任何相关经历或数据）：\n" + (m.none.map(li).join("\n") || "（无）") +
    (m.downplay?.length ? "\n建议弱化（一句话带过或不写）：\n" + m.downplay.map((d) => "- " + d.text + "：" + d.why).join("\n") : "") +
    (m.risks.length ? "\n风险表述（不得照抄夸大说法，按建议修正；面试 QA 要对每条生成对应追问）：\n" + m.risks.map((r) => "- " + r.text + " → " + r.fix).join("\n") : "")
  );
}

// ---- 空白初始状态（真实新用户从 0 开始；演示数据只在 loadDemo 时载入） ----

const blankData = () => ({
  demoMode: false,
  profile: emptyProfile(),
  genSource: {} as Record<string, GenSource>,
  evidence: [] as Evidence[],
  editingEvidenceId: null,
  evidenceFilter: "all",
  jobs: [] as Job[],
  activeJobId: "",
  jobDraft: null,
  jobsView: "find" as const,
  analyses: {} as Record<string, Analysis>,
  matches: {} as Record<string, Match>,
  batch: null,
  prep: null,
  resumes: {} as Record<string, Resume>,
  resumeVersions: {} as Record<string, ResumeVersion[]>,
  resumeTpl: "classic",
  resumeSpec: null,
  qa: {} as Record<string, QaItem[]>,
  qaStale: {} as Record<string, boolean>,
  qaFilter: "all",
  mocks: {} as Record<string, MockSession[]>,
  mockStale: {} as Record<string, boolean>,
  mockActive: false,
  mockMsgs: [] as InterviewMsg[],
  mockInput: "",
  mockReport: null,
  mockBasic: false,
  records: [] as InterviewRecord[],
  recJobId: "",
  recInput: "",
  recPhase: "idle" as const,
  activeRecordId: null,
  importText: "",
  importParsed: null,
  importedIdx: [] as number[],
  ivProject: null,
  ivMsgs: [] as InterviewMsg[],
  ivSummary: null,
  ivDraft: null,
  ivBasic: false,
  guideDismissed: false,
  lastWorkTab: null,
});

// ---- 本机持久化（IndexedDB，见 lib/storage.ts）----
// 只持久化领域数据和轻量导航/会话状态；加载中/弹层等瞬态不落盘。
export const PERSIST_KEYS = [
  "screen",
  "tab",
  "guideDismissed",
  "demoMode",
  "profile",
  "genSource",
  "aiConsented",
  "lastWorkTab",
  "evidence",
  "jobs",
  "activeJobId",
  "jobsView",
  "analyses",
  "matches",
  "resumes",
  "resumeVersions",
  "resumeTpl",
  "resumeSpec",
  "resumeScope",
  "qa",
  "qaStale",
  "mocks",
  "mockStale",
  "mockActive",
  "mockMsgs",
  "mockBasic",
  "ivProject",
  "ivMsgs",
  "ivDraft",
  "ivBasic",
  "records",
  "recJobId",
  "activeRecordId",
] as const;

export type PersistedState = Pick<State, (typeof PERSIST_KEYS)[number]>;

/** 取当前需要持久化的数据切片（persist partialize 与设置页导出共用同一份定义） */
export const snapshot = (s: State): PersistedState =>
  Object.fromEntries(PERSIST_KEYS.map((k) => [k, s[k]])) as unknown as PersistedState;

/** v1（标题字符串关联）→ v2（稳定 ID 关联）的一次性迁移：按标题尽力回填 evId */
export function migrateV1toV2(p: Record<string, unknown>): Record<string, unknown> {
  const evidence = (Array.isArray(p.evidence) ? p.evidence : []) as Evidence[];
  const byTitle = new Map(evidence.map((e) => [normTitle(e.title), e.id]));
  const fill = <T extends { evId?: string | null; ev: string | null }>(x: T): T =>
    x.evId !== undefined ? x : { ...x, evId: x.ev ? byTitle.get(normTitle(x.ev)) ?? null : null };

  const mapResume = (r: Resume): Resume => ({
    ...r,
    exp: (r.exp || []).map((e) => ({ ...e, bullets: (e.bullets || []).map((b) => fill(b)) })),
  });
  const resumes = (p.resumes && typeof p.resumes === "object" ? p.resumes : {}) as Record<string, Resume>;
  p.resumes = Object.fromEntries(Object.entries(resumes).map(([k, r]) => [k, mapResume(r)]));
  const versions = (p.resumeVersions && typeof p.resumeVersions === "object" ? p.resumeVersions : {}) as Record<string, ResumeVersion[]>;
  p.resumeVersions = Object.fromEntries(
    Object.entries(versions).map(([k, list]) => [k, (list || []).map((v) => ({ ...v, data: mapResume(v.data) }))])
  );
  const matches = (p.matches && typeof p.matches === "object" ? p.matches : {}) as Record<string, Match>;
  p.matches = Object.fromEntries(
    Object.entries(matches).map(([k, m]) => [
      k,
      { ...m, strong: (m.strong || []).map(fill), weak: (m.weak || []).map(fill), none: (m.none || []).map(fill) },
    ])
  );
  if (p.demoMode === undefined) p.demoMode = false;
  if (!p.profile) p.profile = emptyProfile();
  if (!p.genSource) p.genSource = {};
  if (p.aiConsented === undefined) p.aiConsented = false;
  if (p.lastWorkTab === undefined) p.lastWorkTab = null;
  if (p.jobsView === undefined) p.jobsView = "find";
  if (p.screen !== "home" && p.screen !== "app") p.screen = "app";
  return p;
}

export const useStore = create<State>()(persist((set, get) => ({
  screen: "home",
  tab: "dashboard",
  toast: null,
  hydrated: false,
  aiConsented: false,
  aiGate: null,
  loginOpen: false,

  ...blankData(),

  importing: false,
  ivInput: "",
  ivLoading: false,
  jdLoading: false,
  resumeLoading: false,
  resumeRail: "content",
  resumeScope: "job",
  qaLoading: false,
  mockLoading: false,

  patch: (p) => set(p as Partial<State>),

  showToast: (msg) => {
    set({ toast: msg });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },

  go: (tab) =>
    set((st) => ({
      screen: "app",
      tab,
      lastWorkTab: tab !== "dashboard" && tab !== "settings" ? tab : st.lastWorkTab,
    })),
  setScreen: (screen) => set({ screen }),

  activeJob: () => {
    const s = get();
    return s.jobs.find((j) => j.id === s.activeJobId) || s.jobs[0] || null;
  },

  openPackage: (jobId) => set({ activeJobId: jobId, recJobId: jobId, screen: "app", tab: "pkg" }),

  patchProfile: (p) => set((st) => ({ profile: { ...st.profile, ...p } })),

  // ---- 演示模式 ----
  // 演示与真实数据完全隔离：进入演示前把真实数据快照到独立的 IndexedDB key，
  // 退出演示时原样恢复——演示永远不会覆盖或混入用户自己的数据。

  loadDemo: () => {
    const cur = snapshot(get());
    if (!cur.demoMode && (cur.evidence.length || cur.jobs.length || cur.records.length)) {
      idbStorage.setItem("proofcv-predemo", JSON.stringify(cur));
    }
    const marks: Record<string, GenSource> = {
      "analysis:j1": "demo", "analysis:j2": "demo",
      "match:j1": "demo", "match:j2": "demo",
      "resume:j1": "demo", "qa:j1": "demo", "mock:j1": "demo", "record:r1": "demo",
    };
    set({
      ...blankData(),
      demoMode: true,
      profile: demoProfile(),
      genSource: marks,
      evidence: seedEvidence(),
      jobs: seedJobs(),
      activeJobId: "j1",
      analyses: seedAnalyses(),
      matches: seedMatches(),
      resumes: seedResumes(),
      resumeVersions: seedResumeVersions(),
      qa: seedQa(),
      mocks: seedMocks(),
      records: seedRecords(),
      recJobId: "j1",
      guideDismissed: true,
      screen: "app",
      tab: "dashboard",
    });
    get().showToast("演示数据已加载 · 这是示例账号「林深」，可随时在侧边栏退出演示");
  },

  exitDemo: async () => {
    try {
      const raw = await idbStorage.getItem("proofcv-predemo");
      if (raw) {
        const data = JSON.parse(raw) as PersistedState;
        await idbStorage.removeItem("proofcv-predemo");
        set({ ...blankData(), ...data, demoMode: false, screen: "app", tab: "dashboard", activeRecordId: null });
        get().showToast("已退出演示 · 示例数据已清空，你之前的数据已原样恢复");
        return;
      }
    } catch {}
    set({ ...blankData(), screen: "app", tab: "dashboard" });
    get().showToast("已退出演示 · 示例数据已清空，现在是你自己的空白空间");
  },

  clearLocalData: () => {
    set({ ...blankData(), screen: "app", tab: "settings" });
    get().showToast("本机数据已清空（账号与登录状态不受影响）");
  },

  applyBackup: (data) => {
    const jobs = data.jobs || [];
    const first = jobs[0]?.id || "";
    const active = jobs.some((j) => j.id === data.activeJobId) ? data.activeJobId : first;
    // 导入后停留在设置页，不跳到备份里记录的页面
    set({
      ...data,
      activeJobId: active,
      recJobId: jobs.some((j) => j.id === data.recJobId) ? data.recJobId : active,
      screen: "app",
      tab: "settings",
      activeRecordId: null,
      aiGate: null,
      loginOpen: false,
    });
    get().showToast("备份已导入 · 数据已恢复到导出时的状态");
  },

  // ---- AI 门控：未登录（且无自带 Key）点在线 AI 功能 → 弹登录；登录后自动续跑 ----

  requireAi: (pending, opts) => {
    if (opts?.basic) return "basic";
    const m = aiMode();
    if (m === "none") {
      set({ aiGate: { pending } });
      return null;
    }
    if (m === "hosted" && !get().aiConsented) {
      set({ aiGate: { pending, consent: true } });
      return null;
    }
    return "ai";
  },

  gateContinueBasic: () => {
    const g = get().aiGate;
    if (!g) return;
    set({ aiGate: null });
    runPending(get(), g.pending, { basic: true });
  },

  gateToLogin: () => {
    const g = get().aiGate;
    if (g) {
      try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(g.pending));
      } catch {}
    }
    set({ aiGate: null, loginOpen: true });
  },

  closeGate: () => set({ aiGate: null }),

  loginSucceeded: async () => {
    set({ loginOpen: false, aiConsented: true, aiGate: null });
    await fetchMe();
    const u = useAuth.getState().user;
    get().showToast("登录成功" + (u?.name || u?.email ? "：" + (u.name || u.email) : "") + " · 本机数据不受登录影响");
    get().resumePendingFromSession();
  },

  resumePendingFromSession: () => {
    let p: PendingAiAction | null = null;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw) p = JSON.parse(raw) as PendingAiAction;
      sessionStorage.removeItem(PENDING_KEY);
    } catch {}
    if (p) get().dispatchPending(p);
  },

  dispatchPending: (p) => {
    const s = get();
    if (p.jobId && s.jobs.some((j) => j.id === p.jobId)) {
      set({ activeJobId: p.jobId, recJobId: p.jobId });
    }
    switch (p.type) {
      case "analyzeJd": s.analyzeJd(); break;
      case "batchAnalyze": s.batchAnalyze(); break;
      case "prepPackage": s.prepPackage(); break;
      case "generateResume": s.generateResume(undefined, p.base ? "base" : "job"); break;
      case "generateQa": s.generateQa(); break;
      case "startMock": s.startMock(); break;
      case "sendMock": s.sendMock(); break;
      case "endMock": s.endMock(); break;
      case "analyzeRecord": s.analyzeRecordingText(); break;
      case "doImport": s.doImport(); break;
      case "startInterview": {
        const proj = p.projId && p.projId !== "new"
          ? s.evidence.find((e) => e.id === p.projId) || null
          : { id: "new", title: p.projTitle || "新项目深挖", project: "待确认", background: "", status: "insufficient" as const };
        if (proj) s.startInterview(proj);
        break;
      }
      case "sendInterview": s.sendInterview(); break;
      case "endInterview": s.endInterview(); break;
    }
  },

  // ---- 经历 ----

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
    get().showToast("经历已更新（简历与问题按 ID 关联，改标题不会断联）");
  },

  addEvidenceFromImport: (seg, idx) => {
    const kinds: EvidenceKind[] = ["work", "intern", "project", "personal", "opensource"];
    const ev: Evidence = {
      id: uid("ev"),
      title: seg.title,
      // AI 拆解带 project/kind；基础模式没有，project 退回公司名（历史行为）
      kind: seg.kind && kinds.includes(seg.kind) ? seg.kind : undefined,
      project: seg.project?.trim() || seg.company,
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
    get().showToast("已加入我的经历 · 建议用 AI 访谈补全细节");
  },

  // ---- 岗位 ----

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
    get().showToast("岗位已创建 · 下一步：分析岗位");
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
    set((st) => ({ jobs: st.jobs.concat(fresh), activeJobId: st.activeJobId || fresh[0].id, recJobId: st.recJobId || fresh[0].id }));
    get().showToast("已导入 " + fresh.length + " 个岗位" + (skipped ? "，跳过 " + skipped + " 个重复岗位" : "") + " · 逐个分析 JD 开始准备");
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

  analyzeJobById: async (jobId, opts) => {
    const j = get().jobs.find((x) => x.id === jobId);
    if (!j || !j.jd.trim()) return false;
    const markGen = (src: GenSource) =>
      set((st) => ({ genSource: { ...st.genSource, ["analysis:" + jobId]: src, ["match:" + jobId]: src } }));

    if (!opts?.basic) {
      const evSummary = get()
        .evidence.map((e) => "[" + e.id + "] " + e.title + "（" + e.status + "）：" + e.results.join("、"))
        .join("\n");
      const out = await ask(
        "目标岗位 JD：\n" + j.jd + "\n\n候选人的职业经历（含稳定 id）：\n" + evSummary + '\n\n请：1) 拆解 JD；2) 把 JD 要求和候选人经历逐条对照，明确指出：哪些经历应重点写、哪些应弱化、哪些能力缺证据、哪些表述不应夸大。只输出 JSON：{"analysis":{"responsibilities":[],"mustHave":[],"niceToHave":[],"hidden":[],"interviewFocus":[]},"match":{"metrics":{"coverage":0-100,"strength":0-100,"clarity":0-100,"risk":整数},"strong":[{"req":"","evId":"匹配经历的id","ev":"经历标题","note":"为什么重点写"}],"weak":[{"req":"","evId":"","ev":"","note":""}],"none":[{"req":"","evId":null,"ev":null,"note":""}],"downplay":[{"text":"建议弱化的内容","why":"原因"}],"risks":[{"text":"可能夸大或缺依据的表述","fix":"更稳妥的改法"}]}}',
        { max_tokens: 4000, feature: "job_analysis" }
      );
      if (out === null) return false; // 失败已提示，不写入任何结果
      const parsed = parseJSON<{ analysis: Analysis; match: Match } | null>(out, null);
      if (!parsed?.analysis || !parsed?.match) {
        get().showToast("AI 返回无法解析，本次未生成分析结果，请重试");
        return false;
      }
      const ev = get().evidence;
      const m: Match = {
        ...parsed.match,
        strong: (parsed.match.strong || []).map((x) => linkMatchItem(ev, x)),
        weak: (parsed.match.weak || []).map((x) => linkMatchItem(ev, x)),
        none: (parsed.match.none || []).map((x) => linkMatchItem(ev, x)),
        downplay: parsed.match.downplay || [],
        risks: parsed.match.risks || [],
      };
      set((st) => ({
        analyses: { ...st.analyses, [jobId]: parsed.analysis },
        matches: { ...st.matches, [jobId]: m },
        jobs: st.jobs.map((x) => (x.id === jobId ? { ...x, match: m.metrics.coverage, updated: "刚刚" } : x)),
      }));
      markGen("ai");
      return true;
    }

    // 基础模式：本地确定性规则，不调用在线 AI，如实标注
    const a = buildFallbackAnalysis(j);
    const m = buildFallbackMatch(j, get().evidence);
    set((st) => ({
      analyses: { ...st.analyses, [jobId]: a },
      matches: { ...st.matches, [jobId]: m },
      jobs: st.jobs.map((x) => (x.id === jobId ? { ...x, match: m.metrics.coverage, updated: "刚刚" } : x)),
    }));
    markGen("basic");
    return true;
  },

  analyzeJd: async (opts) => {
    const j = get().activeJob();
    if (!j) return;
    if (!j.jd.trim()) {
      get().showToast("请先粘贴 JD");
      return;
    }
    const mode = get().requireAi({ type: "analyzeJd", jobId: j.id }, opts);
    if (!mode) return;
    set({ jdLoading: true });
    await get().analyzeJobById(j.id, { basic: mode === "basic" });
    set({ jdLoading: false });
  },

  // 批量岗位分析——排队跑完所有未分析岗位，结果按证据覆盖度排序
  batchAnalyze: async (opts) => {
    if (get().batch?.running) return;
    const targets = get().jobs.filter((j) => j.jd.trim() && !get().analyses[j.id]);
    if (!targets.length) {
      get().showToast("所有岗位都已分析过 · 优先级排序见下方面板");
      return;
    }
    const mode = get().requireAi({ type: "batchAnalyze" }, opts);
    if (!mode) return;
    set({ batch: { running: true, total: targets.length, done: 0, current: null } });
    for (let i = 0; i < targets.length; i++) {
      set((st) => ({ batch: { ...st.batch!, done: i, current: targets[i].company + " · " + targets[i].role } }));
      await get().analyzeJobById(targets[i].id, { basic: mode === "basic" });
    }
    set((st) => ({ batch: { ...st.batch!, running: false, done: targets.length, current: null } }));
    get().showToast("批量分析完成 · " + targets.length + " 个岗位已按证据覆盖度排序");
  },

  // 一键备齐申请包——分析→简历→（停：用户确认简历建议）→QA
  prepPackage: async (opts) => {
    const j = get().activeJob();
    if (!j) return;
    if (!j.jd.trim()) {
      get().showToast("请先粘贴 JD");
      return;
    }
    if (get().prep && get().prep!.jobId === j.id && get().prep!.stage !== "done") return;
    const mode = get().requireAi({ type: "prepPackage", jobId: j.id }, opts);
    if (!mode) return;
    const basic = mode === "basic";
    set({ prep: { jobId: j.id, stage: "analyzing" } });
    if (!get().analyses[j.id]) {
      const ok = await get().analyzeJobById(j.id, { basic });
      if (!ok) {
        set({ prep: null });
        return;
      }
    }
    set({ prep: { jobId: j.id, stage: "resume" } });
    if (!get().resumes[j.id]) await get().generateResume({ basic }, "job");
    if (!get().resumes[j.id]) {
      set({ prep: null });
      return;
    }
    // 有待决策的 AI 建议就停下来等用户逐条确认——不自动替用户做决定
    const pending = (get().resumes[j.id]?.exp || []).flatMap((x) => x.bullets).filter((b) => b.suggestion && !b.decision);
    if (pending.length) {
      set({ prep: { jobId: j.id, stage: "confirm" } });
      get().showToast("简历已生成 · " + pending.length + " 条建议待你逐条确认后再生成 QA");
      return;
    }
    await get().prepContinueQa({ basic });
  },

  prepContinueQa: async (opts) => {
    const p = get().prep;
    if (!p) return;
    set({ prep: { ...p, stage: "qa" } });
    if (!(get().qa[p.jobId] || []).length || get().qaStale[p.jobId]) await get().generateQa(opts);
    set({ prep: { ...p, stage: (get().qa[p.jobId] || []).length ? "done" : "confirm" } });
  },

  // ---- 简历 ----

  // target 省略时按编辑器当前 scope 决定：通用简历不绑定岗位，只吃已确认经历；
  // 岗位定制版额外吃 JD 与匹配分析。prepPackage 等岗位流程必须显式传 "job"。
  generateResume: async (opts, target) => {
    const scope = target || get().resumeScope;
    const j = get().activeJob();
    const base = scope === "base" || !j;
    if (!base && !j) return;
    const key = base ? BASE_RESUME_ID : j!.id;
    const mode = get().requireAi({ type: "generateResume", jobId: base ? undefined : j!.id, base }, opts);
    if (!mode) return;
    set({ resumeLoading: true });
    const markGen = (src: GenSource) => set((st) => ({ genSource: { ...st.genSource, ["resume:" + key]: src } }));

    if (mode === "ai") {
      const ev = get()
        .evidence.filter((e) => e.status === "confirmed")
        .map((e) => "[" + e.id + "] " + e.title + "：" + e.actions.join("；") + "（成果：" + e.results.join("、") + "；难点：" + e.challenges.join("、") + "）")
        .join("\n");
      const prompt = base
        ? "为候选人整理一份通用简历——不针对任何具体岗位，突出这些经历本身最有说服力的地方。\n候选人已确认的经历（含稳定 id）：\n" +
          ev +
          '\n\n严格要求：所有描述必须来自上述经历，不要编造任何数据；无证据支撑的能力一律不写。每条内容标注：对应经历 id、容易被追问的点；若与原经历表述不同，说明修改原因。没有目标岗位，所以不要写 jdReq。只输出 JSON：{"summary":"个人简介","exp":[{"company":"","role":"","period":"","bullets":[{"id":"唯一id","text":"","evId":"对应经历id","ev":"经历标题","reason":"这样写的原因（可省略）","hook":false,"probe":"面试官容易追问的点"}]}],"skills":[]}'
        : "为岗位「" + j!.company + " " + j!.role + "」定制一份简历。JD：" + j!.jd + "\n候选人已确认的经历（含稳定 id）：\n" + ev + matchBrief(get().matches[j!.id]) + '\n\n严格要求：所有描述必须来自上述经历，不要编造任何数据；无证据支撑的能力一律不写。每条内容标注：对应经历 id、对应的岗位要求、容易被追问的点；若与原经历表述不同，说明修改原因。只输出 JSON：{"summary":"个人简介","exp":[{"company":"","role":"","period":"","bullets":[{"id":"唯一id","text":"","evId":"对应经历id","ev":"经历标题","jdReq":"对应岗位要求","reason":"这样写的原因（可省略）","hook":false,"probe":"面试官容易追问的点"}]}],"skills":[]}';
      // 与 import_parse 同一量级：吐一整份简历的 JSON，输出量随证据条数线性涨。
      const out = await ask(prompt, { max_tokens: 8000, feature: "resume_generate" });
      if (out === null) {
        set({ resumeLoading: false });
        return;
      }
      const parsed = parseJSON<Resume | null>(out, null);
      if (!parsed || !Array.isArray(parsed.exp)) {
        set({ resumeLoading: false });
        get().showToast("AI 返回无法解析，本次未生成简历，请重试");
        return;
      }
      const evidence = get().evidence;
      const r: Resume = {
        ...parsed,
        exp: parsed.exp.map((x) => ({ ...x, bullets: (x.bullets || []).map((b) => linkBullet(evidence, { ...b, id: b.id || uid("b") })) })),
        skills: parsed.skills || [],
      };
      set((st) => ({
        resumeLoading: false,
        resumes: { ...st.resumes, [key]: r },
        ...markStale(st, key),
      }));
      markGen("ai");
      return;
    }

    // 基础模式：从已确认经历确定性编译，如实标注
    const r = fallbackResume(base ? null : j, get().evidence);
    set((st) => ({
      resumeLoading: false,
      resumes: { ...st.resumes, [key]: r },
      ...markStale(st, key),
    }));
    markGen("basic");
  },

  // 打开简历编辑器并指明编辑哪一份——岗位流程进来的都要显式带 "job"
  openResume: (scope) => {
    set({ resumeScope: scope });
    get().go("resume");
  },

  // 用通用简历给当前岗位打底：整份复制过去当初版，之后照常按岗位逐条改。不调 AI。
  // 覆盖已有简历前先自动存一版，用户随时能回滚（覆盖确认在 UI 层）。
  importBaseToJob: () => {
    const j = get().activeJob();
    const base = get().resumes[BASE_RESUME_ID];
    if (!j || !base) return;
    const had = !!get().resumes[j.id];
    if (had) get().saveResumeVersion(j.id);

    const r = JSON.parse(JSON.stringify(base)) as Resume;
    // 只改写我们自己生成的通用简历模板简介——AI 写的或用户改过的一律原样保留
    if (isBaseTemplateSummary(r.summary)) {
      r.summary = resumeSummary(j, get().evidence.filter((e) => e.status !== "insufficient").length);
    }
    set((st) => ({
      resumes: { ...st.resumes, [j.id]: r },
      genSource: { ...st.genSource, ["resume:" + j.id]: st.genSource["resume:" + BASE_RESUME_ID] || "basic" },
      ...markStale(st, j.id),
    }));
    get().showToast(
      had ? "已用通用简历覆盖——原内容存为一个版本，可在「内容」里恢复" : "已用通用简历打底——接下来按这个岗位调整叙事重点"
    );
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
    get().showToast(d === "accepted" ? "已接受建议" : "已拒绝，保留原文");
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

  // ---- 面试 QA ----

  generateQa: async (opts) => {
    const j = get().activeJob();
    if (!j) return;
    const r = get().resumes[j.id];
    if (!r) {
      get().showToast("请先生成该岗位的专属简历");
      return;
    }
    const mode = get().requireAi({ type: "generateQa", jobId: j.id }, opts);
    if (!mode) return;
    set({ qaLoading: true });
    const markGen = (src: GenSource) => set((st) => ({ genSource: { ...st.genSource, ["qa:" + j.id]: src } }));

    if (mode === "ai") {
      const bullets = r.exp
        .flatMap((x) => x.bullets)
        .map((b) => "[" + b.id + (b.hook ? "·钩子" : "") + "] " + b.text + (b.probe ? "（易被追问：" + b.probe + "）" : ""))
        .join("\n");
      const evSummary = get()
        .evidence.map((e) => e.title + "（" + e.status + "）")
        .join("；");
      const out = await ask(
        "岗位：" + j.company + " " + j.role + "\nJD：" + j.jd + "\n\n当前简历内容（含 bullet id）：\n" + bullets + "\n\n经历库：" + evSummary + matchBrief(get().matches[j.id]) + '\n\n为这份简历生成面试 QA：30秒/2分钟自我介绍、项目讲述、每条简历内容的预测问题与深挖追问、技术/业务/协作/风险/反问类问题。上面「风险表述」中每一条都要生成对应的追问题并标记高风险；证据未确认的内容对应问题标记高风险。答案只能基于经历，缺数据处写明「待补充」，不得编造。只输出 JSON 数组：[{"cat":"intro|project|resume|tech|biz|collab|risk|reverse","q":"","answer":"","fromBullet":"关联的bullet id或省略","jdReq":"对应岗位要求","prep":"todo","highRisk":false,"followUps":["可能的继续深挖"]}]',
        { max_tokens: 6000, feature: "qa_generate" }
      );
      if (out === null) {
        set({ qaLoading: false });
        return;
      }
      const parsed = parseJSON<Omit<QaItem, "id" | "origin">[] | null>(out, null);
      if (!Array.isArray(parsed) || !parsed.length) {
        set({ qaLoading: false });
        get().showToast("AI 返回无法解析，本次未生成 QA，请重试");
        return;
      }
      const items: QaItem[] = parsed.map((p, i) => ({ ...p, id: uid("q") + i, origin: "generated" as const }));
      set((st) => ({
        qaLoading: false,
        qa: { ...st.qa, [j.id]: items },
        qaStale: { ...st.qaStale, [j.id]: false },
      }));
      markGen("ai");
      get().showToast("已生成 " + items.length + " 条面试 QA");
      return;
    }

    const items = fallbackQa(j, r);
    set((st) => ({
      qaLoading: false,
      qa: { ...st.qa, [j.id]: items },
      qaStale: { ...st.qaStale, [j.id]: false },
    }));
    markGen("basic");
    get().showToast("已用基础模式生成 " + items.length + " 条准备框架（未调用在线 AI）");
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

  // ---- 模拟面试 ----

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
      "你是「" + j.company + " · " + j.role + "」的模拟面试官。岗位 JD：" + j.jd + "\n基于候选人当前简历提问：\n" +
      bullets.map((b) => "- " + b.text).join("\n") +
      matchBrief(s.matches[jobId]) +
      (hooks.length ? "\n候选人标记的面试钩子（优先深挖）：" + hooks.join("；") : "") +
      (weak.length ? "\n历史薄弱点（重点检验是否已补齐）：" + weak.join("；") : "") +
      (lastMock?.report ? "\n上次模拟面试的重点：" + lastMock.report.nextFocus.join("；") : "") +
      (lastRec ? "\n真实面试暴露的缺口：" + lastRec.gaps.join("；") : "") +
      "\n规则：每次只问一个问题；顺着回答连续追问；上面匹配分析里的「风险表述」和「未匹配」是重点考察对象——检查回答是否具体、有证据、是否自相矛盾；回答含糊时礼貌但坚定地要细节和数字。语气专业，回复 2-3 句以内。"
    );
  },

  startMock: async (opts) => {
    const s = get();
    const j = s.activeJob();
    if (!j) return;
    const r = s.resumes[j.id];
    if (!r) {
      s.showToast("模拟面试基于岗位专属简历，请先生成简历");
      return;
    }
    const mode = get().requireAi({ type: "startMock", jobId: j.id }, opts);
    if (!mode) return;
    const bullets = r.exp.flatMap((x) => x.bullets);
    const target = bullets.find((b) => b.hook) || bullets[0];

    if (mode === "basic") {
      const first =
        "你好，我是本场的本地预设面试官（基础模式，不调用在线 AI，只按你的简历内容提固定套路问题）。先从简历第一条开始：「" +
        (target ? target.text.slice(0, 40) : "你的核心项目") +
        "…」——用两分钟讲讲这个项目，重点说你个人做了什么、最难的地方在哪。";
      set({ mockActive: true, mockBasic: true, mockMsgs: [{ role: "assistant", content: first }], mockReport: null, mockLoading: false });
      return;
    }

    set({ mockActive: true, mockBasic: false, mockMsgs: [], mockReport: null, mockLoading: true });
    const out = await ask(
      "面试开始。请说一句简短开场，然后基于简历提出第一个问题（优先从面试钩子或最亮眼的量化成果切入）。只输出你要说的话。",
      { system: get().mockSystem(j.id), feature: "mock_interview" }
    );
    if (out === null) {
      set({ mockActive: false, mockLoading: false });
      return;
    }
    set({ mockLoading: false, mockMsgs: [{ role: "assistant", content: out }] });
  },

  sendMock: async () => {
    const s = get();
    const txt = s.mockInput.trim();
    if (!txt) return;
    const j = s.activeJob();
    if (!j) return;
    const msgs = s.mockMsgs.concat([{ role: "user" as const, content: txt }]);

    // 基础模式：本地预设追问，不调用在线 AI
    if (s.mockBasic) {
      const turn = Math.floor(msgs.length / 2);
      const fallbacks = [
        "这里面哪些是你个人独立完成的，哪些是团队一起做的？边界说清楚一点。",
        "你刚才提到的结果，数据是从哪里来的？测量环境和口径是什么？",
        "如果当时换一种方案，代价是什么？为什么最终没有选它？",
        "最难的那个点，你当时卡了多久，具体怎么破的？",
        "假设数据量再放大十倍，你现在的方案哪里先崩？",
        "这个项目如果重来一次，你会改哪三件事？",
      ];
      set({ mockMsgs: msgs.concat([{ role: "assistant", content: fallbacks[turn % fallbacks.length] }]), mockInput: "" });
      return;
    }

    if (aiMode() === "none") {
      set({ aiGate: { pending: { type: "sendMock", jobId: j.id } } });
      return;
    }
    set({ mockMsgs: msgs, mockInput: "", mockLoading: true });
    // Agent 模式（BYOK Anthropic）：面试官先查证据库核实说法，再决定怎么追问
    if (agentAvailable()) {
      const agentOut = await askAgent(msgs, {
        system:
          get().mockSystem(j.id) +
          "\n你可以调用 search_evidence 工具核实候选人的说法在经历库里有没有支撑——没有证据的说法要往死里追问细节。",
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
    const out = await ask(msgs, { system: get().mockSystem(j.id), max_tokens: 400, feature: "mock_interview" });
    if (out === null) {
      // 失败不伪装：不加面试官回复，把你的回答退回输入框，稍后可重发
      set({ mockMsgs: s.mockMsgs, mockInput: txt, mockLoading: false });
      return;
    }
    set({ mockMsgs: msgs.concat([{ role: "assistant", content: out }]), mockLoading: false });
  },

  endMock: async () => {
    const s = get();
    const j = s.activeJob();
    if (!j) return;
    if (s.mockMsgs.length < 2) {
      s.showToast("至少回答一个问题后再结束");
      return;
    }
    set({ mockLoading: true });
    const finish = (report: MockReport, src: GenSource) => {
      const session: MockSession = { id: uid("m"), date: "刚刚", msgs: get().mockMsgs, report };
      set((st) => ({
        mockLoading: false,
        mockReport: report,
        mocks: { ...st.mocks, [j.id]: (st.mocks[j.id] || []).concat([session]) },
        mockStale: { ...st.mockStale, [j.id]: false },
        genSource: { ...st.genSource, ["mock:" + j.id]: src },
      }));
    };

    if (s.mockBasic) {
      finish(fallbackMockReport(s.mockMsgs), "basic");
      return;
    }
    const transcript = s.mockMsgs.map((m) => (m.role === "user" ? "候选人：" : "面试官：") + m.content).join("\n");
    const out = await ask(
      '基于以下模拟面试记录生成复盘报告。客观、不吹捧，指出被问穿和不完整的回答。只输出 JSON：{"overall":"整体表现一段话","good":["回答较好的部分"],"exposed":["被问穿的内容"],"incomplete":["回答不完整的问题"],"redo":["建议重新准备的答案"],"resumeSuggestions":["建议修改或删除的简历内容"],"nextFocus":["下一次模拟重点"]}\n\n' + transcript,
      { max_tokens: 3000, feature: "mock_interview" }
    );
    if (out === null) {
      set({ mockLoading: false });
      return;
    }
    const report = parseJSON<MockReport | null>(out, null);
    if (!report) {
      set({ mockLoading: false });
      get().showToast("AI 返回无法解析，报告未生成，可再点一次「结束并生成报告」");
      return;
    }
    finish(report, "ai");
  },

  exitMock: () => set({ mockActive: false, mockMsgs: [], mockReport: null, mockInput: "", mockBasic: false }),

  // ---- 面试记录与复盘 ----

  analyzeRecordingText: async (opts) => {
    const s = get();
    const j = s.jobs.find((x) => x.id === s.recJobId) || s.jobs[0];
    if (!j) {
      s.showToast("请先添加目标岗位");
      return;
    }
    if (!s.recInput.trim()) {
      s.showToast("请先粘贴面试转写文本");
      return;
    }
    const mode = get().requireAi({ type: "analyzeRecord", jobId: j.id }, opts);
    if (!mode) return;
    set({ recPhase: "analyze" });
    const recId = uid("r");
    const finish = (rec: InterviewRecord, src: GenSource) => {
      set((st) => ({
        recPhase: "idle",
        recInput: "",
        records: st.records.concat([rec]),
        activeRecordId: rec.id,
        genSource: { ...st.genSource, ["record:" + rec.id]: src },
      }));
      get().showToast("复盘完成 · 有 " + rec.suggestions.filter((x) => x.state === "pending").length + " 条建议待你确认");
    };

    if (mode === "basic") {
      finish(fallbackRecord(j, "粘贴转写文本（基础模式解析）", s.recInput, recId), "basic");
      return;
    }

    const bullets = (s.resumes[j.id]?.exp || []).flatMap((x) => x.bullets);
    const hooks = bullets.filter((b) => b.hook).map((b) => "[" + b.id + "] " + b.text);
    const out = await ask(
      "这是「" + j.company + " " + j.role + "」的真实面试转写。候选人简历要点：\n" + bullets.map((b) => "[" + b.id + "] " + b.text).join("\n") + (hooks.length ? "\n面试钩子：" + hooks.join("；") : "") + '\n\n请：区分说话人、按时间轴整理、抽取问答对与追问链、判断问题是否由简历触发、钩子是否命中、标记含糊/中断/缺证据/矛盾的回答并给出更好的回答、生成结构化笔记，并提出对 QA/简历/经历的修改建议（建议须用户确认，不得直接改写）。只输出 JSON：{"transcript":[{"t":"mm:ss","speaker":"interviewer|me","text":"","flags":["vague|broken|noEvidence|conflict"]}],"qas":[{"q":"","a":"","chain":0,"fromResume":"bullet id或null","hookHit":false,"issue":"","better":""}],"hooks":[{"hook":"","hit":false,"note":""}],"notes":[{"section":"","content":""}],"score":0,"verdict":"","highlights":[],"issues":[],"gaps":[],"nextPrep":[],"suggestions":[{"target":"qa|resume|evidence","title":"","detail":""}]}\n\n转写：\n' + s.recInput,
      { max_tokens: 6000, feature: "record_review" }
    );
    if (out === null) {
      set({ recPhase: "idle" }); // 转写文本保留，稍后可重试
      return;
    }
    type ParsedRec = Omit<InterviewRecord, "id" | "jobId" | "date" | "source" | "suggestions"> & {
      suggestions: { target: "qa" | "resume" | "evidence"; title: string; detail: string }[];
    };
    const parsed = parseJSON<ParsedRec | null>(out, null);
    if (!parsed?.transcript) {
      set({ recPhase: "idle" });
      get().showToast("AI 返回无法解析，本次未生成复盘，请重试");
      return;
    }
    finish(
      {
        ...parsed,
        id: recId,
        jobId: j.id,
        date: "刚刚",
        source: "粘贴转写文本",
        suggestions: (parsed.suggestions || []).map((x, i) => ({ ...x, id: recId + "-s" + i, state: "pending" as const })),
      },
      "ai"
    );
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
      s.showToast("已写入经历备注 · 可发起访谈补齐");
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

  // ---- AI 访谈（从零整理经历） ----

  ivSystem: () =>
    "你是一位资深技术面试官兼职业教练，正在对候选人的某段经历（工作/实习/项目/个人项目/开源均可）做深度访谈。规则：每次只问一个最关键的追问问题；基于候选人上一条回答顺藤摸瓜，不要机械问卷；依次覆盖背景与目标、候选人的具体职责与个人贡献边界、关键行动、技术难点与业务难点、协作与推动方式、可量化的最终结果、可验证的证据来源。当候选人说得笼统或夸大时要礼貌追问细节与证据。语气专业而有温度，回复 2-3 句以内。",

  startInterview: async (proj, opts) => {
    if (!proj) return;
    const mode = get().requireAi({ type: "startInterview", projId: proj.id, projTitle: proj.title }, opts);
    if (!mode) return;

    if (mode === "basic") {
      const first =
        "（基础模式：本地预设访谈问题，不调用在线 AI）我们来把「" + proj.title + "」聊透。先说说这段经历最初是要解决什么问题？当时的背景和目标是什么，谁在推动它？";
      set({ ivProject: proj, ivBasic: true, ivMsgs: [{ role: "assistant", content: first }], ivSummary: null, ivDraft: null, ivLoading: false, screen: "app", tab: "interview" });
      return;
    }

    set({ ivProject: proj, ivBasic: false, ivMsgs: [], ivSummary: null, ivDraft: null, ivLoading: true, screen: "app", tab: "interview" });
    const out = await ask(
      "你正在开始对候选人「" + proj.title + "」这段经历做深度职业访谈。已知信息：" + (proj.background || "很少，需要从头问起") + (proj.note ? "。已知缺口：" + proj.note : "") + "。请用 2-3 句话开场，并提出第一个最关键的追问问题（先了解背景与目标）。只输出你要说的话。",
      { system: get().ivSystem(), feature: "interview" }
    );
    if (out === null) {
      set({ ivLoading: false, ivProject: null });
      return;
    }
    set({ ivLoading: false, ivMsgs: [{ role: "assistant", content: out }] });
  },

  sendInterview: async () => {
    const txt = get().ivInput.trim();
    if (!txt) return;
    const msgs = get().ivMsgs.concat([{ role: "user" as const, content: txt }]);

    if (get().ivBasic) {
      const turn = Math.floor(msgs.length / 2);
      const fallbacks = [
        "明白。这段经历里你个人实际负责的部分是什么？哪些是团队其他人做的，边界说清楚。",
        "你做的关键决策是什么？为什么这样选，有没有对比过其他方案？",
        "最难的一个点是什么？技术上或业务上都行，当时怎么破的？",
        "有没有可量化的结果？数字从哪里来，能被验证吗？",
        "这段经历有什么可以拿出来的证据？比如代码、文档、监控截图、他人评价。",
      ];
      set({ ivMsgs: msgs.concat([{ role: "assistant", content: fallbacks[turn % fallbacks.length] }]), ivInput: "" });
      return;
    }

    if (aiMode() === "none") {
      set({ aiGate: { pending: { type: "sendInterview" } } });
      return;
    }
    set({ ivMsgs: msgs, ivInput: "", ivLoading: true });
    // Agent 模式：访谈官可查证据库避免重复问，并把问清楚的事实实时沉淀为草稿（用户最终确认才入库）
    if (agentAvailable()) {
      const agentOut = await askAgent(msgs, {
        system:
          get().ivSystem() +
          "\n你可以调用 search_evidence 检查经历库里已有什么（避免重复追问），并在候选人把某块事实说清楚后调用 draft_evidence_card 实时沉淀草稿——只记录原话事实，严禁推断补全。",
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
    const out = await ask(msgs, { system: get().ivSystem(), max_tokens: 400, feature: "interview" });
    if (out === null) {
      set({ ivMsgs: get().ivMsgs.slice(0, msgs.length - 1), ivInput: txt, ivLoading: false });
      return;
    }
    set({ ivMsgs: msgs.concat([{ role: "assistant", content: out }]), ivLoading: false });
  },

  endInterview: async () => {
    const s = get();
    if (s.ivBasic) {
      set({
        ivSummary: {
          summary: "（基础模式）以上问答已如实记录。下面的字段由你自己核对后写入经历卡——基础模式不做自动提炼，避免机器错误概括你的经历。",
          abilities: [],
          missing: ["建议登录后用在线 AI 重新访谈一次，自动提炼职责边界与可验证证据"],
        },
        ivLoading: false,
      });
      return;
    }
    if (aiMode() === "none") {
      set({ aiGate: { pending: { type: "endInterview" } } });
      return;
    }
    set({ ivLoading: true });
    const transcript = s.ivMsgs.map((m) => (m.role === "user" ? "候选人：" : "访谈者：") + m.content).join("\n");
    const out = await ask(
      '基于以下访谈记录，总结候选人在这段经历中真正承担的工作和可证明的能力，并指出还缺少数据/证据的点。只输出 JSON：{"summary":"一段话客观总结真正做的事，不夸大","abilities":["可证明的能力"],"missing":["还缺少数据或证据的点"]}。\n\n' + transcript,
      { max_tokens: 2500, feature: "interview" }
    );
    if (out === null) {
      set({ ivLoading: false });
      return;
    }
    const parsed = parseJSON<InterviewSummary | null>(out, null);
    if (!parsed) {
      set({ ivLoading: false });
      get().showToast("AI 返回无法解析，总结未生成，可再点一次「结束访谈」");
      return;
    }
    set({ ivLoading: false, ivSummary: parsed });
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
        title: proj.title !== "新项目深挖" ? proj.title : "访谈沉淀 · " + new Date().toLocaleDateString("zh-CN"),
        kind: proj.kind,
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
    set({ ivProject: null, ivSummary: null, ivMsgs: [], ivDraft: null, ivBasic: false });
    get().go("evidence");
    get().showToast("访谈成果已并入经历 · 请核对后确认");
  },

  // ---- 导入旧简历 ----

  doImport: async (opts) => {
    if (!get().importText.trim()) {
      get().showToast("请先粘贴简历内容或上传文件");
      return;
    }
    const mode = get().requireAi({ type: "doImport" }, opts);
    if (!mode) return;
    set({ importing: true, importedIdx: [] });
    const raw = get().importText;

    if (mode === "basic") {
      const segs = parseResumeText(raw);
      set({ importing: false, importParsed: segs });
      get().showToast(
        segs.length
          ? "基础模式已切分出 " + segs.length + " 段（本地规则，未调用在线 AI），请核对后逐条确认"
          : "没能从文本里切出经历段——检查是否包含「公司｜职位｜时间」类行，或改用在线 AI 拆解"
      );
      return;
    }

    const out = await ask(
      // 粒度标准是核心：不给标准时模型只能按排版切，会把项目内的模块错拆成独立经历
      "把下面这份简历拆解成经历段。拆分单位：一段 = 一个能在面试里独立讲述的完整项目或经历。" +
        "简历常见层级是 公司 → 项目 → 模块/职责方向：模块不是独立经历，必须归入所属项目段的 bullets（可在条目前加「模块名：」前缀），不要拆成多段；" +
        "只介绍职位与任期、没有具体项目内容的总览段可单独成一段并把 kind 记为 work。" +
        "一份简历通常拆出 2~8 段——如果超过了 10 段，几乎可以肯定是把模块错当成了经历，请合并后再输出。" +
        '只输出 JSON 数组，每个元素形如 {"title":"经历标题（项目名或岗位一句话）","kind":"work|intern|project|personal|opensource","company":"公司或组织","project":"项目名（没有则留空字符串）","period":"时间段","bullets":["动作+成果，保留原文事实，不要编造数字"]}。原文：\n' +
        raw,
      // 整份简历拆成 JSON 是全场输出最长的任务，且输出量随简历长度线性涨：
      // 实测输入 4.8k token 的简历要吐 4067 输出（4096 只剩 1% 余量）。低了会被
      // max_tokens 截断成半截 JSON，parseJSON 直接失败。须与后端
      // ROLEREADY_MAX_TOKENS_CAP（8192）配套，改小会重新触发截断。
      { max_tokens: 8000, feature: "import_parse" }
    );
    if (out === null) {
      set({ importing: false });
      return;
    }
    const parsed = parseJSON<ImportSegment[] | null>(out, null);
    if (!Array.isArray(parsed) || !parsed.length) {
      set({ importing: false });
      get().showToast(
        looksTruncated(out)
          ? "简历太长，AI 没输出完就被截断了——请删掉与目标岗位无关的段落后重试，或改用基础模式"
          : "AI 返回无法解析，本次未拆解，请重试或改用基础模式"
      );
      return;
    }
    set({ importing: false, importParsed: parsed });
  },
}),
{
  name: "proofcv-data",
  version: 2,
  storage: createJSONStorage(() => idbStorage),
  partialize: snapshot,
  // SSR 安全：由页面挂载后手动 rehydrate（见 app/page.tsx），避免和 React 注水竞争
  skipHydration: true,
  migrate: (persisted, version) => {
    let p = persisted as Record<string, unknown>;
    if (version < 2) p = migrateV1toV2(p);
    return p as unknown as PersistedState;
  },
  onRehydrateStorage: () => () => {
    useStore.setState({ hydrated: true });
  },
}
));

/** 门控确认「基础模式继续」/ 登录成功后的续跑分发（放 store 外避免 self 引用问题） */
function runPending(s: State, p: PendingAiAction, opts: RunOpts) {
  if (p.jobId && s.jobs.some((j) => j.id === p.jobId)) {
    useStore.setState({ activeJobId: p.jobId, recJobId: p.jobId });
  }
  const st = useStore.getState();
  switch (p.type) {
    case "analyzeJd": st.analyzeJd(opts); break;
    case "batchAnalyze": st.batchAnalyze(opts); break;
    case "prepPackage": st.prepPackage(opts); break;
    case "generateResume": st.generateResume(opts, p.base ? "base" : "job"); break;
    case "generateQa": st.generateQa(opts); break;
    case "startMock": st.startMock(opts); break;
    case "sendMock": useStore.setState({ mockBasic: true }); st.sendMock(); break;
    case "endMock": useStore.setState({ mockBasic: true }); st.endMock(); break;
    case "analyzeRecord": st.analyzeRecordingText(opts); break;
    case "doImport": st.doImport(opts); break;
    case "startInterview": {
      const proj = p.projId && p.projId !== "new"
        ? st.evidence.find((e) => e.id === p.projId) || null
        : { id: "new", title: p.projTitle || "新项目深挖", project: "待确认", background: "", status: "insufficient" as const };
      if (proj) st.startInterview(proj, opts);
      break;
    }
    case "sendInterview": useStore.setState({ ivBasic: true }); st.sendInterview(); break;
    case "endInterview": useStore.setState({ ivBasic: true }); st.endInterview(); break;
  }
}

// AI 调用失败时的全局提示（不伪装成功：结果不写入，明确告知用户）
setAiErrorHandler((msg) => useStore.getState().showToast(msg));

// 托管会话过期（401）：清会话并引导重新登录，本机数据不受影响
setSessionExpiredHandler(() => {
  useStore.getState().showToast("登录已过期，请重新登录（本机数据不受影响）");
  useStore.setState({ loginOpen: true });
});
