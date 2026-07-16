// Boss 直聘数据导入解析器 —— 消费 boss-zhipin-scraper 的产物
// （boss_jobs_*.json 岗位列表 / boss_details_*.json 岗位详情），也兼容手工整理的 JSON。
// 爬取本身在用户本地完成（Python CDP 连本地已登录 Chrome），这里只做产物导入：
// 不发任何请求、不编造缺失字段，缺 JD 详情时如实标注「仅摘要」。

export interface BossJobDraft {
  key: string;
  company: string;
  role: string;
  salary?: string;
  city?: string;
  jd: string;
  /** true = 找到真实 JD 描述；false = 仅由列表字段拼出摘要（建议补 details 文件） */
  jdFull: boolean;
  source: string;
  selected: boolean;
}

export interface BossParseResult {
  drafts: BossJobDraft[];
  errors: string[];
}

type Dict = Record<string, unknown>;

const isDict = (v: unknown): v is Dict => typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(isDict(x) ? x.name ?? x.tag ?? x.label : x)).filter(Boolean) : [];

function pick(o: Dict, keys: string[]): string {
  for (const k of keys) {
    const v = str(o[k]);
    if (v) return v;
  }
  return "";
}

const ID_KEYS = ["encryptJobId", "encryptId", "jobId", "job_id", "securityId", "id", "jid", "detailUrl", "link", "url"];
const COMPANY_KEYS = ["brandName", "companyName", "company_name", "company", "brand", "comName", "公司", "公司名称"];
const ROLE_KEYS = ["jobName", "job_name", "positionName", "position", "title", "name", "岗位", "岗位名称", "职位"];
const SALARY_KEYS = ["salaryDesc", "salary_desc", "salary", "salaryText", "薪资"];
const CITY_KEYS = ["cityName", "city_name", "city", "locationName", "location", "areaDistrict", "城市"];
const DESC_KEYS = ["postDescription", "post_description", "jobDescription", "job_description", "jobDesc", "description", "desc", "detail", "content", "jobRequire", "岗位职责", "职位描述"];
const EXP_KEYS = ["jobExperience", "job_experience", "experienceName", "experience", "经验"];
const DEGREE_KEYS = ["jobDegree", "job_degree", "degreeName", "degree", "学历"];
const SKILL_KEYS = ["skills", "jobLabels", "job_labels", "labels", "tags", "keywords", "技能标签"];

function looksLikeJob(o: Dict): boolean {
  if (pick(o, ROLE_KEYS) && (pick(o, COMPANY_KEYS) || pick(o, ID_KEYS) || pick(o, SALARY_KEYS))) return true;
  // 详情文件可能只带 id + JD 描述（岗位名在列表文件里），也要收集以便按 id 合并
  return !!pick(o, ID_KEYS) && !!pick(o, DESC_KEYS);
}

/** Boss 详情接口把字段拆在 jobInfo / brandComInfo 里，摊平成一个候选对象 */
function flatten(o: Dict): Dict {
  let out: Dict = { ...o };
  for (const k of ["jobInfo", "brandComInfo", "jobBaseInfo", "job", "brand"]) {
    if (isDict(o[k])) out = { ...(o[k] as Dict), ...out };
  }
  return out;
}

/** 有限深度扫描：从任意包裹结构（zpData.jobList / data.list / 顶层数组…）里收集岗位对象 */
function collect(node: unknown, out: Dict[], depth: number): void {
  if (depth > 5 || node == null) return;
  if (Array.isArray(node)) {
    for (const item of node) collect(item, out, depth + 1);
    return;
  }
  if (!isDict(node)) return;
  const flat = flatten(node);
  if (looksLikeJob(flat)) {
    out.push(flat);
    return;
  }
  for (const v of Object.values(node)) collect(v, out, depth + 1);
}

interface Candidate {
  id: string;
  company: string;
  role: string;
  salary: string;
  city: string;
  desc: string;
  exp: string;
  degree: string;
  skills: string[];
  source: string;
}

function toCandidate(o: Dict, source: string): Candidate {
  return {
    id: pick(o, ID_KEYS),
    company: pick(o, COMPANY_KEYS),
    role: pick(o, ROLE_KEYS),
    salary: pick(o, SALARY_KEYS),
    city: pick(o, CITY_KEYS),
    desc: pick(o, DESC_KEYS),
    exp: pick(o, EXP_KEYS),
    degree: pick(o, DEGREE_KEYS),
    skills: SKILL_KEYS.flatMap((k) => strList(o[k])),
    source,
  };
}

function mergeInto(base: Candidate, extra: Candidate): void {
  if (!base.company) base.company = extra.company;
  if (!base.role) base.role = extra.role;
  if (!base.salary) base.salary = extra.salary;
  if (!base.city) base.city = extra.city;
  if (extra.desc.length > base.desc.length) base.desc = extra.desc;
  if (!base.exp) base.exp = extra.exp;
  if (!base.degree) base.degree = extra.degree;
  for (const s of extra.skills) if (!base.skills.includes(s)) base.skills.push(s);
}

function composeJd(c: Candidate): { jd: string; jdFull: boolean } {
  const meta: string[] = [];
  if (c.city) meta.push("城市：" + c.city);
  if (c.salary) meta.push("薪资：" + c.salary);
  if (c.exp) meta.push("经验：" + c.exp);
  if (c.degree) meta.push("学历：" + c.degree);
  const head = meta.join(" · ");
  if (c.desc) {
    const skillLine = c.skills.length ? "技能标签：" + c.skills.join("、") : "";
    return { jd: [head, skillLine, c.desc].filter(Boolean).join("\n"), jdFull: true };
  }
  const summary = [
    head,
    c.skills.length ? "技能标签：" + c.skills.join("、") : "",
    "（导入数据中没有 JD 详情，以上仅为列表摘要——建议同时导入 boss_details_*.json，或打开申请包后手动补全 JD 再分析）",
  ]
    .filter(Boolean)
    .join("\n");
  return { jd: summary, jdFull: false };
}

/** 解析一批 JSON 文本（文件或粘贴），跨文件按岗位 id 合并 jobs/details */
export function parseBossJson(inputs: { name: string; text: string }[]): BossParseResult {
  const errors: string[] = [];
  const byId = new Map<string, Candidate>();
  const noId: Candidate[] = [];

  for (const input of inputs) {
    let root: unknown;
    try {
      root = JSON.parse(input.text);
    } catch {
      errors.push(input.name + "：不是有效的 JSON");
      continue;
    }
    const found: Dict[] = [];
    collect(root, found, 0);
    if (!found.length) {
      errors.push(input.name + "：没有找到岗位数据（需要包含岗位名称/公司字段）");
      continue;
    }
    for (const o of found) {
      const c = toCandidate(o, input.name);
      if (!c.company && !c.role && !c.desc) continue;
      if (c.id && byId.has(c.id)) {
        mergeInto(byId.get(c.id)!, c);
      } else if (c.id) {
        byId.set(c.id, c);
      } else {
        // 无 id：按公司+岗位归并
        const twin = noId.find((x) => x.company === c.company && x.role === c.role);
        if (twin) mergeInto(twin, c);
        else noId.push(c);
      }
    }
  }

  const all = [...byId.values(), ...noId];
  // 不同 id 但同公司同岗位的（列表页重复条目）也归并一次
  const seen = new Map<string, Candidate>();
  for (const c of all) {
    const k = (c.company + "|" + c.role).toLowerCase();
    if (seen.has(k)) mergeInto(seen.get(k)!, c);
    else seen.set(k, c);
  }

  const drafts: BossJobDraft[] = [...seen.values()].map((c, i) => {
    const { jd, jdFull } = composeJd(c);
    return {
      key: "boss-" + i + "-" + (c.id || c.company + c.role),
      company: c.company || "未知公司",
      role: c.role || "目标岗位",
      salary: c.salary || undefined,
      city: c.city || undefined,
      jd,
      jdFull,
      source: c.source,
      selected: true,
    };
  });
  return { drafts, errors };
}
