// AI interface. In the prototype this called window.claude.complete (Anthropic).
//
// This build ships in MOCK mode: ask() resolves to null after a short delay, so
// every handler falls back to its seeded demo data (exactly like the prototype's
// failure path) while the loading spinner/progress animation still shows.
//
// To go live: set NEXT_PUBLIC_AI_LIVE=1 and implement /api/ai as a server route
// that calls the Anthropic API with ANTHROPIC_API_KEY, returning { text }.
// ask() already posts there when live — nothing else needs to change.

import type { InterviewMsg } from "./types";

export interface AskOpts {
  model?: string;
  max_tokens?: number;
  system?: string;
}

const LIVE = process.env.NEXT_PUBLIC_AI_LIVE === "1";
const MOCK_LATENCY = 750;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function ask(
  prompt: string | InterviewMsg[],
  opts: AskOpts = {}
): Promise<string | null> {
  if (!LIVE) {
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
        model: opts.model || "claude-sonnet-4-5",
        max_tokens: opts.max_tokens || 1400,
        system:
          opts.system ||
          "你是资深职业教练与技术招聘专家，语气专业而有温度。只输出要求的内容。",
        messages,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.text === "string" ? data.text : null;
  } catch {
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
