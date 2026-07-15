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
