// ProofCV domain types — v2 iteration: 8-page scope, application-package-centric.

export type Screen = "home" | "auth" | "app";

export type Tab =
  | "dashboard"
  | "import"
  | "interview"
  | "evidence"
  | "jobs"
  | "pkg"
  | "resume"
  | "qa"
  | "mock"
  | "records";

export type EvidenceStatus = "confirmed" | "pending" | "insufficient";

export interface Evidence {
  id: string;
  title: string;
  project: string;
  background: string;
  /** 用户实际负责内容（区分个人 vs 团队） */
  responsibilities: string[];
  actions: string[];
  /** 技术难点 / 业务难点 */
  challenges: string[];
  /** 协作过程 */
  collaboration?: string;
  results: string[];
  skills: string[];
  roles: string[];
  source: string;
  status: EvidenceStatus;
  note?: string | null;
}

export type JobStatus =
  | "saved"
  | "preparing"
  | "applied"
  | "replied"
  | "interviewing"
  | "offer"
  | "rejected";

export interface Job {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  statusLabel: string;
  match: number;
  updated: string;
  logo: string;
  jd: string;
}

export interface Analysis {
  responsibilities: string[];
  mustHave: string[];
  niceToHave: string[];
  hidden: string[];
  interviewFocus?: string[];
}

export interface MatchItem {
  req: string;
  ev: string | null;
  note: string;
}

export interface Match {
  metrics: { coverage: number; strength: number; clarity: number; risk: number };
  /** 应该重点写的经历 */
  strong: MatchItem[];
  /** 弱匹配：证据不够硬 */
  weak: MatchItem[];
  /** 缺少证据的能力 */
  none: MatchItem[];
  /** 建议弱化的内容 */
  downplay: { text: string; why: string }[];
  /** 不应夸大的表述 */
  risks: { text: string; fix: string }[];
}

export type BulletEvStatus = "confirmed" | "pending" | "none";

export interface ResumeBullet {
  id: string;
  /** 当前生效文本 */
  text: string;
  /** 有 AI 建议时的原始文本 */
  original?: string;
  /** 待决策的 AI 改写建议 */
  suggestion?: string;
  /** 建议理由 */
  reason?: string;
  /** 风险修正类建议（去夸大） */
  risk?: boolean;
  decision?: "accepted" | "rejected" | "edited";
  /** 关联的职业证据标题；null = 无证据支撑 */
  ev: string | null;
  evStatus: BulletEvStatus;
  /** 面试钩子：主动引导面试官追问 */
  hook: boolean;
  /** 容易被继续追问的点 */
  probe?: string;
}

export interface ResumeExp {
  company: string;
  role: string;
  period: string;
  bullets: ResumeBullet[];
}

export interface Resume {
  summary: string;
  exp: ResumeExp[];
  skills: string[];
}

export interface ResumeVersion {
  id: string;
  label: string;
  savedAt: string;
  data: Resume;
}

export type QaCategory =
  | "intro"
  | "project"
  | "resume"
  | "tech"
  | "biz"
  | "collab"
  | "risk"
  | "reverse";

/** 未准备 / 准备中 / 已掌握 / 高风险 */
export type QaPrep = "todo" | "doing" | "done" | "risk";

export interface QaItem {
  id: string;
  cat: QaCategory;
  q: string;
  answer: string;
  /** 来自哪条简历内容 */
  fromBullet?: string;
  /** 对应哪项岗位要求 */
  jdReq?: string;
  prep: QaPrep;
  highRisk: boolean;
  /** 面试官可能继续深挖 */
  followUps?: string[];
  /** generated=首次生成 mock=模拟面试补充 real=真实面试补充 */
  origin: "generated" | "mock" | "real";
}

export interface MockReport {
  overall: string;
  good: string[];
  exposed: string[];
  incomplete: string[];
  redo: string[];
  resumeSuggestions: string[];
  nextFocus: string[];
}

export interface MockSession {
  id: string;
  date: string;
  msgs: InterviewMsg[];
  report: MockReport | null;
}

export type SegFlag = "vague" | "broken" | "noEvidence" | "conflict";

export interface TranscriptSeg {
  t: string;
  speaker: "interviewer" | "me";
  text: string;
  flags?: SegFlag[];
}

export interface RecordQa {
  q: string;
  a: string;
  /** 属于连续追问链路时的链路编号 */
  chain?: number;
  /** 由哪条简历内容触发 */
  fromResume: string | null;
  /** 是否命中面试钩子 */
  hookHit: boolean;
  issue?: string;
  better?: string;
}

export interface RecordSuggestion {
  id: string;
  target: "qa" | "resume" | "evidence";
  title: string;
  detail: string;
  state: "pending" | "accepted" | "dismissed";
  /** target=qa 时：采纳后加入 QA 的条目 */
  qa?: Omit<QaItem, "id" | "origin">;
  /** target=resume 时：对某条简历内容的改写建议 */
  bulletId?: string;
  suggestion?: string;
  reason?: string;
  /** target=evidence 时：写入证据卡的备注 */
  evidenceId?: string;
  note?: string;
}

export interface InterviewRecord {
  id: string;
  jobId: string;
  date: string;
  source: string;
  duration?: string;
  transcript: TranscriptSeg[];
  qas: RecordQa[];
  hooks: { hook: string; hit: boolean; note: string }[];
  notes: { section: string; content: string }[];
  score: number;
  verdict: string;
  highlights: string[];
  issues: string[];
  gaps: string[];
  nextPrep: string[];
  suggestions: RecordSuggestion[];
}

// Telos TemplateSpec (ported)
export interface TemplateSpec {
  specVersion: number;
  skeleton: "single" | "sidebar-left" | "sidebar-right" | "banner";
  sidebarRatio: number;
  header: {
    align: "left" | "center";
    style: "plain" | "underline" | "band";
    nameScale: "md" | "lg" | "xl";
  };
  section: {
    titleStyle: "caps" | "underline" | "leftbar" | "band";
    titleLang: "zh" | "en";
    density: "compact" | "normal" | "loose";
  };
  typography: { font: "sans" | "serif" | "mono" };
  colors: { accent: string; headerBg: string; sidebarBg: string };
}

export interface TplPreset {
  id: string;
  name: string;
  en: string;
  desc: string;
  accent: string;
  spec: Partial<TemplateSpec> & Pick<TemplateSpec, "skeleton" | "header" | "section" | "typography" | "colors">;
}

export interface InterviewMsg {
  role: "user" | "assistant";
  content: string;
}

export interface InterviewSummary {
  summary: string;
  abilities: string[];
  missing: string[];
}

export interface ImportSegment {
  title: string;
  company: string;
  period: string;
  bullets: string[];
}
