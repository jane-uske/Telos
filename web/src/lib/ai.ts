// AI interface.
//
// 模式由设置页的运行时配置决定（lib/aiConfig.ts，存用户本机 localStorage）：
// - 未填 API URL + Key：mock 模式，ask() 延迟后返回 null，调用方回落到
//   各自「不编造事实」的确定性兜底（与原型的失败路径一致）。
// - 填了 URL + Key：真实模式，POST /api/ai 纯透传路由（支持 Anthropic 原生 /
//   OpenAI 兼容双协议），Key 随请求经用户本机服务转发，不落盘、不记日志。
//   调用失败时提示用户并照常回落兜底，不会假装成功。

import type { InterviewMsg } from "./types";
import { useAiConfig, aiConfigured } from "./aiConfig";

export interface AskOpts {
  model?: string;
  max_tokens?: number;
  system?: string;
}

const MOCK_LATENCY = 750;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 失败提示回调由 store 注册（避免 ai.ts ↔ store.ts 循环依赖）
let onAiError: ((msg: string) => void) | null = null;
export function setAiErrorHandler(fn: (msg: string) => void) {
  onAiError = fn;
}

function fail(msg: string): null {
  useAiConfig.setState({ lastError: msg });
  onAiError?.("AI 调用失败：" + msg + " · 本次结果由本地兜底生成");
  return null;
}

export async function ask(
  prompt: string | InterviewMsg[],
  opts: AskOpts = {}
): Promise<string | null> {
  const cfg = useAiConfig.getState();
  if (!aiConfigured(cfg)) {
    // Mock: simulate latency, then signal "no AI result" so callers use fallbacks.
    await delay(MOCK_LATENCY);
    return null;
  }
  try {
    const messages = Array.isArray(prompt)
      ? prompt
      : [{ role: "user" as const, content: prompt }];
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        protocol: cfg.protocol,
        url: cfg.url,
        key: cfg.key,
        model: opts.model || cfg.model,
        max_tokens: opts.max_tokens || 1400,
        system:
          opts.system ||
          "你是资深职业教练与技术招聘专家，语气专业而有温度。只输出要求的内容。",
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

// ---- Agent 工具循环（仅 Anthropic 原生协议；OpenAI 兼容档回落普通生成）----

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

/** 真实模式 + Anthropic 原生协议才有 Agent 能力 */
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
    onAiError?.("AI 调用失败：" + msg + " · 本次结果由本地兜底生成");
    return null;
  }
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
