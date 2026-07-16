"use client";

// api.remi.run 客户端（Telos 托管后端，契约见 docs/BACKEND-API.md；网关路径历史原因沿用 /roleready/v1）。
// 调用链固定：浏览器 → api.remi.run → sub2api.remi.run → 模型服务。
// 前端永远不直接访问 sub2api.remi.run，也不接触任何服务端 Key。
// 服务端只保存身份与用量元数据；AI 请求内容临时处理、不落库。

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const API_BASE = (process.env.NEXT_PUBLIC_RR_API_BASE || "https://api.remi.run").replace(/\/+$/, "");
const PREFIX = "/roleready/v1";

export const apiUrl = (path: string) => API_BASE + PREFIX + path;

export interface RrUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  isAdmin?: boolean;
  provider?: "github" | "email";
}

export interface RrQuota {
  /** 本周期额度（估算 token 或调用次数，由后端定义单位） */
  limit: number;
  used: number;
  unit?: string;
  resetAt?: string;
}

interface AuthState {
  token: string | null;
  user: RrUser | null;
  quota: RrQuota | null;
  setSession: (token: string, user: RrUser | null) => void;
  clearSession: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      quota: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null, quota: null }),
    }),
    {
      name: "proofcv-auth",
      version: 1,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") throw new Error("ssr");
        return localStorage;
      }),
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);

export const loggedIn = () => !!useAuth.getState().token;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; code?: string };

/** 会话失效（401）时的回调，由 store 注册用于提示 + 重开登录框 */
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<ApiResult<T>> {
  const token = useAuth.getState().token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth !== false && token) headers.Authorization = "Bearer " + token;
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method: opts.method || (opts.body !== undefined ? "POST" : "GET"),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    return { ok: false, status: 0, error: "无法连接 " + API_BASE + "（网络或服务不可用）" };
  }
  const data = (await res.json().catch(() => null)) as
    | (Record<string, unknown> & { error?: { code?: string; message?: string } | string })
    | null;
  if (!res.ok) {
    if (res.status === 401 && opts.auth !== false && token) {
      useAuth.getState().clearSession();
      onSessionExpired?.();
    }
    const e = data?.error;
    const msg =
      (typeof e === "object" && e?.message) || (typeof e === "string" && e) || "服务返回 HTTP " + res.status;
    const code = typeof e === "object" && e?.code ? String(e.code) : undefined;
    return { ok: false, status: res.status, error: String(msg), code };
  }
  return { ok: true, data: data as T };
}

// ---- 登录 ----

export async function requestEmailCode(email: string): Promise<ApiResult<{ ok: boolean }>> {
  return api("/auth/email/code", { body: { email }, auth: false });
}

export async function verifyEmailCode(email: string, code: string): Promise<ApiResult<{ token: string; user: RrUser }>> {
  const r = await api<{ token: string; user: RrUser }>("/auth/email/verify", { body: { email, code }, auth: false });
  if (r.ok) useAuth.getState().setSession(r.data.token, r.data.user);
  return r;
}

/** GitHub OAuth：整页跳转，后端完成后带 #rr_token= 跳回 redirect */
export function githubLoginUrl(): string {
  const back = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  return apiUrl("/auth/github/start") + "?redirect=" + encodeURIComponent(back);
}

/** 页面加载时消费 URL hash 里的 #rr_token=（GitHub 登录回跳） */
export function consumeTokenFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const m = window.location.hash.match(/rr_token=([A-Za-z0-9._~-]+)/);
  if (!m) return false;
  useAuth.getState().setSession(m[1], null);
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return true;
}

export async function fetchMe(): Promise<ApiResult<{ user: RrUser; quota: RrQuota | null }>> {
  const r = await api<{ user: RrUser; quota: RrQuota | null }>("/me");
  if (r.ok) useAuth.setState({ user: r.data.user, quota: r.data.quota || null });
  return r;
}

export async function serverLogout(): Promise<void> {
  await api("/auth/logout", { method: "POST", body: {} }).catch(() => {});
  useAuth.getState().clearSession();
}

/** 删除账号：只删服务端身份与用量记录，绝不动本机 IndexedDB 数据 */
export async function deleteAccount(): Promise<ApiResult<{ ok: boolean }>> {
  const r = await api<{ ok: boolean }>("/me", { method: "DELETE" });
  if (r.ok) useAuth.getState().clearSession();
  return r;
}

// ---- 托管 AI ----

export type AiFeature =
  | "job_analysis"
  | "resume_generate"
  | "qa_generate"
  | "interview"
  | "mock_interview"
  | "record_review"
  | "import_parse";

export interface HostedChatReq {
  feature: AiFeature;
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  max_tokens?: number;
}

const newRequestId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

/** 托管 AI 调用：服务端记 userId/requestId/feature/token 用量，不保存请求正文 */
export async function hostedChat(req: HostedChatReq): Promise<ApiResult<{ text: string }>> {
  const r = await api<{ text: string; quota?: RrQuota }>("/ai/chat", { body: { ...req, requestId: newRequestId() } });
  if (r.ok && r.data.quota) useAuth.setState({ quota: r.data.quota });
  return r;
}

/** 托管 AI 流式调用：网关以 SSE 逐段返回（data: {type:"delta"|"done"|"error"}），
 *  onDelta 每段回调。中途出错但已收到部分文本时返回 ok + partial:true，
 *  调用方自行决定半截内容怎么用（例如导入拆解保留已闭合的段）。 */
export async function hostedChatStream(
  req: HostedChatReq,
  onDelta: (chunk: string) => void
): Promise<ApiResult<{ text: string; partial?: boolean }>> {
  const token = useAuth.getState().token;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  let res: Response;
  try {
    res = await fetch(apiUrl("/ai/chat"), {
      method: "POST",
      headers,
      body: JSON.stringify({ ...req, requestId: newRequestId(), stream: true }),
    });
  } catch {
    return { ok: false, status: 0, error: "无法连接 " + API_BASE + "（网络或服务不可用）" };
  }
  // 前置检查失败（鉴权/额度/限流）时网关按契约返回 JSON 错误，不进流
  if (!res.ok || !res.body || !(res.headers.get("Content-Type") || "").includes("text/event-stream")) {
    const data = (await res.json().catch(() => null)) as
      | { error?: { code?: string; message?: string } | string }
      | null;
    if (res.status === 401 && token) {
      useAuth.getState().clearSession();
      onSessionExpired?.();
    }
    const e = data?.error;
    const msg =
      (typeof e === "object" && e?.message) || (typeof e === "string" && e) || "服务返回 HTTP " + res.status;
    const code = typeof e === "object" && e?.code ? String(e.code) : undefined;
    return { ok: false, status: res.status, error: String(msg), code };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  let errMsg: string | null = null;
  let errCode: string | undefined;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        let ev: { type?: string; text?: string; quota?: RrQuota; code?: string; message?: string };
        try {
          ev = JSON.parse(line.slice(5).trim());
        } catch {
          continue;
        }
        if (ev.type === "delta" && typeof ev.text === "string") {
          full += ev.text;
          onDelta(ev.text);
        } else if (ev.type === "done") {
          if (ev.quota) useAuth.setState({ quota: ev.quota });
        } else if (ev.type === "error") {
          errMsg = ev.message || "上游模型服务出错";
          errCode = ev.code;
        }
      }
    }
  } catch {
    errMsg = errMsg || "连接中断";
  }
  if (!full) return { ok: false, status: 502, error: errMsg || "AI 返回内容为空", code: errCode || "upstream_error" };
  return { ok: true, data: { text: full, ...(errMsg ? { partial: true } : {}) } };
}

export interface UsageSummary {
  total: { requests: number; inputTokens: number; outputTokens: number; estimatedCost: number; failRate: number };
  byFeature: { feature: string; requests: number; outputTokens: number; estimatedCost: number }[];
  byModel: { model: string; requests: number; inputTokens: number; outputTokens: number; estimatedCost: number }[];
  topUsers: { userId: string; requests: number; estimatedCost: number }[];
  anomalies: { userId: string; reason: string }[];
}

export async function fetchMyUsage(): Promise<
  ApiResult<{ quota: RrQuota | null; recent: { feature: string; model: string; inputTokens: number; outputTokens: number; status: string; createdAt: string }[] }>
> {
  return api("/me/usage");
}

export async function fetchAdminUsage(): Promise<ApiResult<UsageSummary>> {
  return api("/admin/usage/summary");
}
