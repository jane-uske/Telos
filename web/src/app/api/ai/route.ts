// AI 纯透传路由：把页面带来的用户自有 API Key + URL 原样转发给 AI 服务商。
// 平台不托管任何东西——Key 只在本次请求的内存里，不落盘、不记日志。
// 支持两种协议：Anthropic 原生（/v1/messages）和 OpenAI 兼容（/chat/completions，
// 各类中转站基本都是它）。

import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM_TIMEOUT = 90_000;

interface Msg {
  role: "user" | "assistant";
  content: string;
}

// 用户可能粘贴裸域名、带 /v1 的基地址或完整端点，统一补全
function endpointFor(protocol: string, raw: string): string {
  const u = raw.trim().replace(/\/+$/, "");
  if (protocol === "anthropic") {
    return /\/v\d+\/messages$/.test(u) ? u : u + "/v1/messages";
  }
  if (/\/chat\/completions$/.test(u)) return u;
  return /\/v\d+$/.test(u) ? u + "/chat/completions" : u + "/v1/chat/completions";
}

function extractText(protocol: string, data: unknown): string | null {
  const d = data as Record<string, unknown>;
  if (protocol === "anthropic") {
    const content = d?.content;
    if (!Array.isArray(content)) return null;
    const text = content
      .filter((c) => c && (c as { type?: string }).type === "text")
      .map((c) => (c as { text?: string }).text || "")
      .join("");
    return text || null;
  }
  const choices = d?.choices;
  if (!Array.isArray(choices)) return null;
  const msg = (choices[0] as { message?: { content?: unknown } })?.message;
  return typeof msg?.content === "string" && msg.content ? msg.content : null;
}

// 上游报错时尽量把服务商的原话带回给用户，方便排查（错 Key / 错模型名 / 欠费…）
function upstreamError(data: unknown, status: number): string {
  const d = data as { error?: { message?: string } | string; message?: string };
  const m =
    (typeof d?.error === "object" && d.error?.message) ||
    (typeof d?.error === "string" && d.error) ||
    d?.message ||
    "";
  return "AI 服务返回 " + status + (m ? "：" + String(m).slice(0, 300) : "");
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "请求体不是有效 JSON" }, { status: 400 });
  }

  const protocol = body.protocol === "openai" ? "openai" : "anthropic";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const key = typeof body.key === "string" ? body.key.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const system = typeof body.system === "string" ? body.system : "";
  const maxTokens =
    typeof body.max_tokens === "number" && body.max_tokens > 0 ? Math.min(body.max_tokens, 8192) : 1400;
  const messages: Msg[] = Array.isArray(body.messages)
    ? (body.messages as Msg[])
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map((m) => ({ role: m.role, content: m.content }))
    : [];

  if (!/^https?:\/\//.test(url)) return Response.json({ error: "API URL 需以 http(s):// 开头" }, { status: 400 });
  if (!key) return Response.json({ error: "缺少 API Key" }, { status: 400 });
  if (!model) return Response.json({ error: "缺少模型名，请在设置中填写" }, { status: 400 });
  if (!messages.length) return Response.json({ error: "缺少对话内容" }, { status: 400 });

  const endpoint = endpointFor(protocol, url);
  const headers: Record<string, string> =
    protocol === "anthropic"
      ? { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }
      : { "Content-Type": "application/json", Authorization: "Bearer " + key };
  const payload =
    protocol === "anthropic"
      ? { model, max_tokens: maxTokens, system: system || undefined, messages }
      : {
          model,
          max_tokens: maxTokens,
          messages: system ? [{ role: "system", content: system }, ...messages] : messages,
        };

  let res: globalThis.Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
    });
  } catch (e) {
    const msg = e instanceof Error && e.name === "TimeoutError" ? "请求超时" : "无法连接";
    return Response.json({ error: msg + " " + endpoint }, { status: 502 });
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) return Response.json({ error: upstreamError(data, res.status) }, { status: 502 });

  const text = extractText(protocol, data);
  if (!text) return Response.json({ error: "AI 返回内容为空或格式不识别（检查协议类型是否选对）" }, { status: 502 });
  return Response.json({ text });
}
