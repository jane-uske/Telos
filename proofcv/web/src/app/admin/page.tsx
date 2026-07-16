"use client";

// 最小用量查看页（管理员）：总调用量 / 功能消耗 / 模型消耗 / 失败率 / 异常用户。
// 权限由 api.remi.run 校验（isAdmin），本页只是展示——没有复杂后台。
// 这里看到的都是用量元数据；服务端不保存任何 Prompt / 简历 / JD / 面试正文。

import React, { useEffect, useState } from "react";
import { fetchAdminUsage, useAuth, API_BASE, type UsageSummary, type ApiResult } from "@/lib/apiClient";
import { LoginModal } from "@/components/AuthGate";
import { useStore } from "@/lib/store";

const card: React.CSSProperties = { background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 18 };
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const th: React.CSSProperties = { textAlign: "left", fontSize: 11, color: "#a3a8b5", fontWeight: 700, padding: "6px 10px", borderBottom: "1px solid #f0f0f5" };
const td: React.CSSProperties = { fontSize: 12.5, padding: "7px 10px", borderBottom: "1px solid #f7f7fa" };

export default function AdminPage() {
  const token = useAuth((s) => s.token);
  const [r, setR] = useState<ApiResult<UsageSummary> | null>(null);

  useEffect(() => {
    let alive = true;
    if (token) {
      fetchAdminUsage().then((x) => {
        if (alive) setR(x);
      });
    }
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f4", padding: "40px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>RoleReady · 用量总览</h1>
          <span style={{ fontSize: 12, color: "#8a919e" }}>{API_BASE}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "#8a919e", marginBottom: 20 }}>
          仅管理员可见（服务端校验）。展示的全部是用量元数据——不含任何用户求职正文。
        </div>

        {!token ? (
          <div style={card}>
            <div style={{ fontSize: 13.5, marginBottom: 12 }}>需要先登录管理员账号。</div>
            <span
              onClick={() => useStore.setState({ loginOpen: true })}
              style={{ cursor: "pointer", background: "#5850ec", color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 16px", borderRadius: 9, display: "inline-block" }}
            >
              登录
            </span>
          </div>
        ) : !r ? (
          <div style={card}>加载中…</div>
        ) : !r.ok ? (
          <div style={{ ...card, color: "#d64545", fontSize: 13.5 }}>
            {r.status === 403 ? "没有管理员权限（isAdmin=false）。" : "获取失败：" + r.error}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {(
                [
                  ["总调用", String(r.data.total.requests)],
                  ["输入 tokens", r.data.total.inputTokens.toLocaleString()],
                  ["输出 tokens", r.data.total.outputTokens.toLocaleString()],
                  ["估算成本", "$" + r.data.total.estimatedCost.toFixed(2)],
                  ["失败率", (r.data.total.failRate * 100).toFixed(1) + "%"],
                ] as [string, string][]
              ).map(([label, val]) => (
                <div key={label} style={card}>
                  <div style={{ fontSize: 11, color: "#a3a8b5", fontWeight: 700, marginBottom: 6 }}>{label}</div>
                  <div style={{ ...mono, fontSize: 20, fontWeight: 900 }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>按功能</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>feature</th><th style={th}>调用</th><th style={th}>输出 tokens</th><th style={th}>估算成本</th></tr></thead>
                <tbody>
                  {r.data.byFeature.map((f) => (
                    <tr key={f.feature}>
                      <td style={{ ...td, ...mono }}>{f.feature}</td>
                      <td style={{ ...td, ...mono }}>{f.requests}</td>
                      <td style={{ ...td, ...mono }}>{f.outputTokens.toLocaleString()}</td>
                      <td style={{ ...td, ...mono }}>${f.estimatedCost.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={card}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>按模型</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>model</th><th style={th}>调用</th><th style={th}>输入</th><th style={th}>输出</th><th style={th}>估算成本</th></tr></thead>
                <tbody>
                  {r.data.byModel.map((m) => (
                    <tr key={m.model}>
                      <td style={{ ...td, ...mono }}>{m.model}</td>
                      <td style={{ ...td, ...mono }}>{m.requests}</td>
                      <td style={{ ...td, ...mono }}>{m.inputTokens.toLocaleString()}</td>
                      <td style={{ ...td, ...mono }}>{m.outputTokens.toLocaleString()}</td>
                      <td style={{ ...td, ...mono }}>${m.estimatedCost.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={card}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>Top 用户</div>
                {r.data.topUsers.length ? r.data.topUsers.map((u) => (
                  <div key={u.userId} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "5px 0", borderBottom: "1px solid #f7f7fa" }}>
                    <span style={mono}>{u.userId}</span>
                    <span style={mono}>{u.requests} 次 · ${u.estimatedCost.toFixed(2)}</span>
                  </div>
                )) : <div style={{ fontSize: 12.5, color: "#a3a8b5" }}>—</div>}
              </div>
              <div style={card}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>异常用户</div>
                {r.data.anomalies.length ? r.data.anomalies.map((a, i) => (
                  <div key={i} style={{ fontSize: 12.5, padding: "5px 0", borderBottom: "1px solid #f7f7fa" }}>
                    <span style={{ ...mono, color: "#d64545" }}>{a.userId}</span>
                    <span style={{ color: "#8a919e", marginLeft: 8 }}>{a.reason}</span>
                  </div>
                )) : <div style={{ fontSize: 12.5, color: "#12805c" }}>暂无异常</div>}
              </div>
            </div>
          </div>
        )}
      </div>
      <LoginModal />
    </div>
  );
}
