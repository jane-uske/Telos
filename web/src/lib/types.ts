// ProofCV domain types — mirrors the prototype state model.

export type Screen = "home" | "auth" | "app" | "publicProfile" | "publicResume";

export type Tab =
  | "dashboard"
  | "import"
  | "interview"
  | "evidence"
  | "github"
  | "jobs"
  | "jd"
  | "resume"
  | "materials"
  | "pipeline"
  | "review"
  | "market"
  | "settings";

export type EvidenceStatus = "confirmed" | "pending" | "insufficient";

export interface Evidence {
  id: string;
  title: string;
  project: string;
  background: string;
  actions: string[];
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
  strong: MatchItem[];
  weak: MatchItem[];
  none: MatchItem[];
  risks: { text: string; fix: string }[];
}

export interface ResumeBullet {
  text: string;
  ev: string;
  status: "confirmed" | "pending";
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

export interface Mats {
  greeting: string;
  email: string;
  intro30: string;
  intro120: string;
  story: string;
  questions: string[];
  gaps: { g: string; s: string }[];
}

export interface Review {
  score: number;
  verdict: string;
  highlights: string[];
  issues: string[];
  qa: { q: string; quality: "good" | "ok" | "weak"; comment: string }[];
  gaps: string[];
  nextPrep: string[];
}

export interface MarketJob {
  title: string;
  company: string;
  salary: string;
  location: string;
  experience: string;
  degree: string;
  tags: string[];
}

export interface MarketData {
  keyword: string;
  city: string;
  total_jobs: number;
  total_details: number;
  salary_ranges: [string, number][];
  experience: [string, number][];
  degrees: [string, number][];
  districts: [string, number][];
  companies: [string, number][];
  skill_tags: [string, number][];
  jd_terms: [string, number][];
  jobs: MarketJob[];
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

export interface GithubResult {
  stack: string[];
  complexity: number;
  problems: string[];
  experiences: { title: string; desc: string }[];
}
