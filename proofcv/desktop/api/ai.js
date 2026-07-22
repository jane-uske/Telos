// AI 纯透传 —— proofcv/web/src/app/api/ai/route.ts 的主进程移植（逻辑同构，改动仅：
// fetch 换 net.fetch 走 Chromium 网络栈，跟随系统代理）。语义变更需两边同步改。
// Key 只在本次请求的内存里，不落盘、不记日志。

const { net } = require("electron");

const UPSTREAM_TIMEOUT = 90_000;

// 用户可能粘贴裸域名、带 /v1 的基地址或完整端点，统一补全
function endpointFor(protocol, raw) {
  const u = raw.trim().replace(/\/+$/, "");
  if (protocol === "anthropic") {
    return /\/v\d+\/messages$/.test(u) ? u : u + "/v1/messages";
  }
  if (/\/chat\/completions$/.test(u)) return u;
  return /\/v\d+$/.test(u) ? u + "/chat/completions" : u + "/v1/chat/completions";
}

// 部分中转站/推理模型不严格遵循标准响应结构，兼容常见变体，尽量取到正文
function extractText(protocol, data) {
  const d = data || {};
  if (protocol === "anthropic") {
    const content = d.content;
    if (typeof content === "string") return content || null;
    if (!Array.isArray(content)) return null;
    const text = content
      .filter((c) => c && c.type === "text")
      .map((c) => c.text || "")
      .join("");
    return text || null;
  }
  const choices = d.choices;
  if (!Array.isArray(choices)) return null;
  const msg = choices[0] && choices[0].message;
  if (typeof msg?.content === "string" && msg.content) return msg.content;
  if (Array.isArray(msg?.content)) {
    const text = msg.content
      .filter((c) => c && c.type === "text")
      .map((c) => c.text || "")
      .join("");
    if (text) return text;
  }
  return typeof msg?.reasoning_content === "string" && msg.reasoning_content ? msg.reasoning_content : null;
}

// 只有思考块没有正文块、且被 max_tokens 截断——提示调大 max_tokens 而不是报格式错
function truncatedWhileThinking(protocol, data) {
  const d = data || {};
  if (protocol !== "anthropic") return false;
  const content = d.content;
  if (!Array.isArray(content) || !content.length) return false;
  const hasThinking = content.some((c) => c && /thinking/.test(c.type || ""));
  const hasText = content.some((c) => c && c.type === "text");
  return hasThinking && !hasText && d.stop_reason === "max_tokens";
}

// 上游报错时尽量把服务商的原话带回给用户，方便排查（错 Key / 错模型名 / 欠费…）
function upstreamError(data, status) {
  const d = data || {};
  const m =
    (typeof d.error === "object" && d.error?.message) ||
    (typeof d.error === "string" && d.error) ||
    d.message ||
    "";
  return "AI 服务返回 " + status + (m ? "：" + String(m).slice(0, 300) : "");
}

async function handleAi(request) {
  let body;
  try {
    body = await request.json();
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
  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            (typeof m.content === "string" || Array.isArray(m.content))
        )
        .map((m) => ({ role: m.role, content: m.content }))
    : [];
  const tools = Array.isArray(body.tools) && body.tools.length ? body.tools : null;

  if (!/^https?:\/\//.test(url)) return Response.json({ error: "API URL 需以 http(s):// 开头" }, { status: 400 });
  if (!key) return Response.json({ error: "缺少 API Key" }, { status: 400 });
  if (!model) return Response.json({ error: "缺少模型名，请在设置中填写" }, { status: 400 });
  if (!messages.length) return Response.json({ error: "缺少对话内容" }, { status: 400 });
  if (tools && protocol !== "anthropic") {
    return Response.json({ error: "Agent 功能目前仅支持 Anthropic 原生协议" }, { status: 400 });
  }

  const endpoint = endpointFor(protocol, url);
  const headers =
    protocol === "anthropic"
      ? { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }
      : { "Content-Type": "application/json", Authorization: "Bearer " + key };
  const payload =
    protocol === "anthropic"
      ? { model, max_tokens: maxTokens, system: system || undefined, messages, ...(tools ? { tools } : {}) }
      : {
          model,
          max_tokens: maxTokens,
          messages: system ? [{ role: "system", content: system }, ...messages] : messages,
        };

  let res;
  try {
    res = await net.fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
    });
  } catch (e) {
    const msg = e instanceof Error && e.name === "TimeoutError" ? "请求超时" : "无法连接";
    return Response.json({ error: msg + " " + endpoint }, { status: 502 });
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) return Response.json({ error: upstreamError(data, res.status) }, { status: 502 });

  // Agent 工具循环：原样带回内容块和停止原因，循环在客户端本地执行工具
  if (tools) {
    if (!Array.isArray(data?.content)) {
      return Response.json({ error: "AI 返回格式不识别（Agent 模式需要 Anthropic 原生协议）" }, { status: 502 });
    }
    return Response.json({ blocks: data.content, stop: typeof data.stop_reason === "string" ? data.stop_reason : "" });
  }

  const text = extractText(protocol, data);
  if (!text) {
    const error = truncatedWhileThinking(protocol, data)
      ? "AI 还在思考阶段就被 max_tokens 截断，没来得及输出正文，请调大 max_tokens 后重试"
      : "AI 返回内容为空或格式不识别（检查协议类型是否选对）";
    return Response.json({ error }, { status: 502 });
  }
  return Response.json({ text });
}

module.exports = { handleAi };
