// AI interface — 三种模式，统一从 ask() 走：
//
// - "hosted"：已登录，走托管链路 浏览器 → api.remi.run → sub2api.remi.run → 模型。
//   服务端只记身份与用量元数据，请求正文临时处理、不落库。
// - "byok"（高级模式）：设置页填了自己的 API URL + Key，走本应用 /api/ai 纯透传
//   （Anthropic 原生 / OpenAI 兼容双协议），Key 不落盘、不记日志，无需登录。
// - "none"（基础模式）：未登录也没有 Key。ask() 立即返回 null；调用方只能在用户
//   明确选择「基础模式」后使用本地确定性规则生成，并如实标注「未调用在线 AI」。
//
// 调用失败一律提示用户，不伪装成功、不静默回落。

import type { InterviewMsg } from "./types";
import { useAiConfig, aiConfigured } from "./aiConfig";
import { hostedChat, loggedIn, type AiFeature } from "./apiClient";

export type { AiFeature } from "./apiClient";

export type AiMode = "byok" | "hosted" | "none";

/** 当前 AI 通路：BYOK 优先（用户显式配置过），其次托管，否则基础模式 */
export function aiMode(): AiMode {
  if (aiConfigured()) return "byok";
  if (loggedIn()) return "hosted";
  return "none";
}

export interface AskOpts {
  model?: string;
  max_tokens?: number;
  system?: string;
  /** 托管链路的用量归类（岗位分析/简历/QA/访谈/模拟/复盘） */
  feature?: AiFeature;
}

// 失败提示回调由 store 注册（避免 ai.ts ↔ store.ts 循环依赖）
let onAiError: ((msg: string) => void) | null = null;
export function setAiErrorHandler(fn: (msg: string) => void) {
  onAiError = fn;
}

function fail(msg: string): null {
  if (aiConfigured()) useAiConfig.setState({ lastError: msg });
  onAiError?.("AI 调用失败：" + msg);
  return null;
}

const DEFAULT_SYSTEM = "你是资深职业教练与技术招聘专家，语气专业而有温度。只输出要求的内容。";

export async function ask(
  prompt: string | InterviewMsg[],
  opts: AskOpts = {}
): Promise<string | null> {
  const mode = aiMode();
  if (mode === "none") return null;

  const messages = (Array.isArray(prompt) ? prompt : [{ role: "user" as const, content: prompt }]).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  if (mode === "hosted") {
    const r = await hostedChat({
      feature: opts.feature || "job_analysis",
      system: opts.system || DEFAULT_SYSTEM,
      messages,
      max_tokens: opts.max_tokens || 1400,
    });
    if (!r.ok) {
      if (r.status === 401) return fail("登录已过期，请重新登录");
      if (r.code === "quota_exceeded") return fail("本周期 AI 额度已用完（可在设置查看额度）");
      return fail(r.error);
    }
    return r.data.text;
  }

  // BYOK 透传
  const cfg = useAiConfig.getState();
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        protocol: cfg.protocol,
        url: cfg.url,
        key: cfg.key,
        model: opts.model || cfg.model,
        max_tokens: opts.max_tokens || 1400,
        system: opts.system || DEFAULT_SYSTEM,
        messages,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || typeof data?.text !== "string") {
      return fail(data?.error || "HTTP " + res.status);
    }
    useAiConfig.setState({ lastError: null });
    return data.text;
  } catch {
    return fail("无法连接本机服务 /api/ai");
  }
}

// ---- Agent 工具循环（仅 BYOK + Anthropic 原生协议；其余模式回落普通生成）----

export interface AgentTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  /** 本地执行器：result 回给模型，note 是给用户看的透明记录 */
  run: (input: Record<string, unknown>) => { result: string; note: string };
}

interface Block {
  type: string;
  id?: string;
  name?: string;
  text?: string;
  input?: Record<string, unknown>;
  [k: string]: unknown;
}

const MAX_TOOL_ROUNDS = 4;

/** BYOK + Anthropic 原生协议才有 Agent 工具能力（托管链路暂不透传 tools） */
export function agentAvailable(): boolean {
  const cfg = useAiConfig.getState();
  return aiConfigured(cfg) && cfg.protocol === "anthropic";
}

/**
 * 带工具的对话：模型可调用本地工具（查证据库/起草证据卡），循环直到给出文字回复。
 * 返回 null 表示不可用或失败——调用方回落到普通 ask() / 本地兜底。
 */
export async function askAgent(
  prompt: string | InterviewMsg[],
  opts: AskOpts & { tools: AgentTool[] }
): Promise<{ text: string; toolNotes: string[] } | null> {
  if (!agentAvailable()) return null;
  const cfg = useAiConfig.getState();
  const toolDefs = opts.tools.map(({ name, description, input_schema }) => ({ name, description, input_schema }));
  let messages: { role: "user" | "assistant"; content: string | Block[] }[] = (
    Array.isArray(prompt) ? prompt : [{ role: "user" as const, content: prompt }]
  ).map((m) => ({ role: m.role, content: m.content }));
  const notes: string[] = [];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol: cfg.protocol,
          url: cfg.url,
          key: cfg.key,
          model: opts.model || cfg.model,
          max_tokens: opts.max_tokens || 600,
          system: opts.system,
          messages,
          tools: toolDefs,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data?.blocks)) return fail(data?.error || "HTTP " + res.status);
      const blocks: Block[] = data.blocks;
      const toolUses = blocks.filter((b) => b.type === "tool_use");
      if (data.stop !== "tool_use" || !toolUses.length) {
        const text = blocks.filter((b) => b.type === "text").map((b) => b.text || "").join("").trim();
        if (!text) return fail("AI 返回内容为空");
        useAiConfig.setState({ lastError: null });
        return { text, toolNotes: notes };
      }
      // 执行工具，把结果回给模型继续
      messages = messages.concat([{ role: "assistant", content: blocks }]);
      const results: Block[] = toolUses.map((tu) => {
        const tool = opts.tools.find((t) => t.name === tu.name);
        let out = { result: "未知工具：" + tu.name, note: "调用了未知工具 " + tu.name };
        if (tool) {
          try {
            out = tool.run(tu.input || {});
          } catch {
            out = { result: "工具执行失败", note: tu.name + " 执行失败" };
          }
        }
        notes.push(out.note);
        return { type: "tool_result", tool_use_id: tu.id, content: out.result };
      });
      messages = messages.concat([{ role: "user", content: results }]);
    }
    return fail("工具调用超过 " + MAX_TOOL_ROUNDS + " 轮上限");
  } catch {
    return fail("无法连接本机服务 /api/ai");
  }

  function fail(msg: string): null {
    useAiConfig.setState({ lastError: msg });
    onAiError?.("AI 调用失败：" + msg);
    return null;
  }
}

/**
 * 输出是否像被 max_tokens 截断的半截 JSON：有起始括号，却没有与之对应的闭合括号。
 * 托管链路只回传 text，不透传 stop_reason，只能从文本形状反推，用于把
 * 「AI 返回无法解析」这种误导性提示（用户会一直重试）换成「简历太长被截断」。
 */
export function looksTruncated(t: string | null): boolean {
  if (!t) return false;
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const s = (m ? m[1] : t).trim();
  const open = s.search(/[[{]/);
  if (open < 0) return false;
  // 括号平衡计数：不能只看「最后一个闭合括号」——截断常发生在 bullets 内层数组里，
  // 而外层前几项的 ] 早已闭合，只看末尾会把半截 JSON 误判成完整。字符串内的
  // 括号与转义必须跳过，否则 bullets 正文里的 "]" 会把深度算歪。
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (esc) esc = false;
    else if (inStr) {
      if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") depth--;
  }
  return depth > 0 || inStr; // 有没闭合的括号，或结尾还停在字符串中间
}

// Lenient JSON extraction (ported from the prototype's parseJSON).
export function parseJSON<T>(t: string | null, fb: T): T {
  if (!t) return fb;
  try {
    const m = t.match(/```(?:json)?\s*([\s\S]*?)```/);
    const s = m ? m[1] : t;
    const a = s.indexOf("{"),
      b = s.lastIndexOf("}"),
      c = s.indexOf("["),
      d = s.lastIndexOf("]");
    let js = s;
    if (c >= 0 && (c < a || a < 0)) js = s.slice(c, d + 1);
    else if (a >= 0) js = s.slice(a, b + 1);
    return JSON.parse(js) as T;
  } catch {
    return fb;
  }
}
