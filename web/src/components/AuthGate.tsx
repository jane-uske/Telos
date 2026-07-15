"use client";

// 登录与在线 AI 门控 UI：
// - AiGateDialog：匿名用户第一次点在线 AI 功能时弹出——可登录、可用基础模式继续、可取消。
// - LoginModal：GitHub / 邮箱验证码登录。登录成功后自动续跑刚才被拦下的 AI 操作。
// - GenBadge：生成结果旁的来源标注（在线 AI / 基础模式 / 演示数据），不把规则结果伪装成 AI。

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { requestEmailCode, verifyEmailCode, githubLoginUrl, useAuth } from "@/lib/apiClient";
import type { GenSource } from "@/lib/types";
import { Btn } from "./ui";

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(22,24,29,.45)",
  backdropFilter: "blur(3px)",
  WebkitBackdropFilter: "blur(3px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 60,
  padding: 20,
};

const sheet: React.CSSProperties = {
  background: "#fff",
  borderRadius: 18,
  padding: "26px 28px",
  width: "100%",
  maxWidth: 440,
  boxShadow: "0 24px 80px -24px rgba(22,24,29,.45)",
  animation: "pcvFade .25s ease both",
};

const privacyNote: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.7,
  background: "#fafafc",
  border: "1px solid #f0f0f5",
  borderRadius: 10,
  padding: "10px 12px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e6e8ee",
  borderRadius: 10,
  padding: "11px 13px",
  fontSize: 13.5,
  outline: "none",
  background: "#fbfbfd",
};

/** 未登录点在线 AI 功能时的门控弹窗 */
export function AiGateDialog() {
  const gate = useStore((s) => s.aiGate);
  const gateToLogin = useStore((s) => s.gateToLogin);
  const gateContinueBasic = useStore((s) => s.gateContinueBasic);
  const closeGate = useStore((s) => s.closeGate);
  const dispatchPending = useStore((s) => s.dispatchPending);
  if (!gate) return null;

  // 已登录但首次使用在线 AI：只差一次授权说明
  if (gate.consent) {
    return (
      <div style={overlay} onClick={closeGate}>
        <div style={sheet} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>首次使用在线 AI</div>
          <div style={{ fontSize: 13, color: "#4b5060", lineHeight: 1.7, marginBottom: 14 }}>
            使用在线 AI 时，完成这个任务所需的内容（如这份 JD、相关经历摘要）会被临时发送处理。
          </div>
          <div style={{ ...privacyNote, marginBottom: 16 }}>
            · 你的正文（简历、经历、JD、面试回答）<b>不会被保存</b>——AI 处理完即丢弃{"\n"}
            <br />· 服务端只记录身份与用量元数据（哪个功能、消耗多少 token）
            <br />· 所有资料仍然只保存在你这台设备的浏览器里
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn
              label="同意并继续 →"
              onClick={() => {
                const p = gate.pending;
                useStore.setState({ aiConsented: true, aiGate: null });
                dispatchPending(p);
              }}
            />
            <Btn label="取消" kind="ghost" onClick={closeGate} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay} onClick={closeGate}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>这个功能使用在线 AI</div>
        <div style={{ fontSize: 13, color: "#4b5060", lineHeight: 1.7, marginBottom: 14 }}>
          登录后即可使用在线 AI（GitHub 或邮箱验证码，不需要密码）。也可以不登录，用基础模式继续——本地规则生成、能力有限，但完全不联网。
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <Btn label="登录使用在线 AI →" onClick={gateToLogin} />
          <Btn label="用基础模式继续（本地规则，不调用在线 AI）" kind="ghost" onClick={gateContinueBasic} />
        </div>
        <div style={privacyNote}>
          在线 AI 只临时处理完成任务所需内容，不保存你的简历、JD 或回答正文；你的资料始终保存在本机浏览器里。
        </div>
        <div onClick={closeGate} style={{ cursor: "pointer", textAlign: "center", fontSize: 12.5, color: "#8a919e", marginTop: 14 }}>
          取消
        </div>
      </div>
    </div>
  );
}

/** 登录弹窗：GitHub / 邮箱验证码。没有传统登录页，价值先行、用到 AI 才登录。 */
export function LoginModal() {
  const open = useStore((s) => s.loginOpen);
  const loginSucceeded = useStore((s) => s.loginSucceeded);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;
  const close = () => {
    useStore.setState({ loginOpen: false });
    setErr(null);
    setPhase("email");
    setCode("");
  };

  const sendCode = async () => {
    const e = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setErr("请输入有效邮箱");
      return;
    }
    setBusy(true);
    setErr(null);
    const r = await requestEmailCode(e);
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    setPhase("code");
  };

  const verify = async () => {
    if (!code.trim()) {
      setErr("请输入邮件里的验证码");
      return;
    }
    setBusy(true);
    setErr(null);
    const r = await verifyEmailCode(email.trim(), code.trim());
    setBusy(false);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    await loginSucceeded();
  };

  return (
    <div style={overlay} onClick={close}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 4 }}>登录 RoleReady</div>
        <div style={{ fontSize: 12.5, color: "#8a919e", lineHeight: 1.65, marginBottom: 18 }}>
          登录只用于在线 AI 的身份与额度。登录后会自动继续你刚才的操作。
        </div>

        <div
          onClick={() => {
            window.location.href = githubLoginUrl();
          }}
          className="pcv-press"
          style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: "#16181d", color: "#fff", borderRadius: 11, padding: "12px 14px", fontWeight: 700, fontSize: 14 }}
        >
          <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
          用 GitHub 登录
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <span style={{ flex: 1, height: 1, background: "#eef0f4" }} />
          <span style={{ fontSize: 11.5, color: "#a3a8b5" }}>或用邮箱验证码</span>
          <span style={{ flex: 1, height: 1, background: "#eef0f4" }} />
        </div>

        {phase === "email" ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !busy && sendCode()}
            />
            <Btn label={busy ? "发送中…" : "发送验证码"} onClick={busy ? undefined : sendCode} />
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12.5, color: "#12805c", marginBottom: 8 }}>验证码已发送到 {email}（也可能在垃圾邮件里）</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1, fontFamily: "'JetBrains Mono'", letterSpacing: ".2em" }}
                placeholder="6 位验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !busy && verify()}
                autoFocus
              />
              <Btn label={busy ? "验证中…" : "登录"} onClick={busy ? undefined : verify} />
            </div>
            <div onClick={() => setPhase("email")} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec", marginTop: 8 }}>
              ← 换个邮箱 / 重新发送
            </div>
          </div>
        )}

        {err ? <div style={{ marginTop: 12, fontSize: 12.5, color: "#d64545", lineHeight: 1.6 }}>{err}</div> : null}

        <div style={{ ...privacyNote, marginTop: 16 }}>
          · 你的简历、经历、岗位等资料<b>始终只在本机浏览器</b>，登录不会上传或同步它们
          <br />· 登录、退出都不会清空本机数据
          <br />· 服务端只保存账号身份与 AI 用量元数据；继续即同意在线 AI 临时处理任务内容
        </div>
        <div onClick={close} style={{ cursor: "pointer", textAlign: "center", fontSize: 12.5, color: "#8a919e", marginTop: 14 }}>
          暂不登录
        </div>
      </div>
    </div>
  );
}

/** 生成结果旁的来源标注：不把规则结果伪装成 AI 分析 */
export function GenBadge({ source, style }: { source?: GenSource; style?: React.CSSProperties }) {
  if (!source) return null;
  const meta =
    source === "ai"
      ? { label: "在线 AI 生成", fg: "#5850ec", bg: "#f1f0fb", tip: "由在线 AI 生成。任务内容仅临时处理，服务端不保存正文。" }
      : source === "basic"
      ? { label: "基础模式 · 本地规则生成", fg: "#c2810c", bg: "#fdf3e0", tip: "由本机确定性规则生成，未调用在线 AI——能力有限，但完全不联网。" }
      : { label: "演示数据", fg: "#8a919e", bg: "#f2f3f5", tip: "示例内容，来自演示账号「林深」。退出演示后会被清空。" };
  return (
    <span
      title={meta.tip}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 700, color: meta.fg, background: meta.bg, padding: "2px 9px", borderRadius: 99, whiteSpace: "nowrap", cursor: "help", ...style }}
    >
      {source === "ai" ? "✦" : source === "basic" ? "⚙" : "◎"} {meta.label}
    </span>
  );
}

/** 侧边栏账号区（AppShell 用）：登录状态 + 模式徽标 */
export function AccountBox() {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const openLogin = () => useStore.setState({ loginOpen: true });
  if (!token) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 99, background: "#f2f3f6", color: "#8a919e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>?</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>未登录 · 基础模式</div>
          <div onClick={openLogin} className="pcv-link" style={{ fontSize: 11.5 }}>登录后可用在线 AI →</div>
        </div>
      </div>
    );
  }
  const name = user?.name || user?.email || "已登录";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 99, background: "#dcd9ff", color: "#5850ec", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, overflow: "hidden" }}>
        {user?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" width={34} height={34} style={{ objectFit: "cover" }} />
        ) : (
          String(name).slice(0, 1).toUpperCase()
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontSize: 11, color: "#8a919e" }}>在线 AI 已就绪</div>
      </div>
    </div>
  );
}
