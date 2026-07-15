"use client";

import React from "react";
import { useStore } from "@/lib/store";

const authPoints = [
  "AI 深挖式访谈，追问背景、决策、难点与可验证证据",
  "JD 多维匹配：覆盖度 / 证据强度 / 表达清晰度 / 风险项",
  "所有简历描述都能追溯到具体证据，绝不自动编造数据",
];

export default function Auth() {
  const enterDemo = () => useStore.setState({ screen: "app", tab: "dashboard" });
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <div style={{ background: "#16181d", color: "#fff", padding: 56, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 20 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#5850ec", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono'" }}>P</div>
          ProofCV
        </div>
        <div>
          <h2 style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 34, lineHeight: 1.3, margin: "0 0 20px" }}>
            让每一句简历<br />都站得住脚。
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {authPoints.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 20, height: 20, borderRadius: 99, background: "#5850ec", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, marginTop: 2 }}>✓</span>
                <span style={{ fontSize: 14, color: "#c7cad5", lineHeight: 1.6 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>© 2026 ProofCV · 你的职业证据，只属于你</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 380, animation: "pcvFade .4s ease both" }}>
          <div style={{ fontSize: 13, color: "#8a919e", marginBottom: 6 }}>欢迎回来 / 新用户</div>
          <h3 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 24px" }}>登录 ProofCV</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input defaultValue="lin.shen@demo.dev" style={{ padding: "13px 14px", border: "1px solid #e0e2ea", borderRadius: 10, fontSize: 14, background: "#fbfbfd" }} />
            <input defaultValue="••••••••" style={{ padding: "13px 14px", border: "1px solid #e0e2ea", borderRadius: 10, fontSize: 14, background: "#fbfbfd" }} />
            <div onClick={enterDemo} style={{ cursor: "pointer", textAlign: "center", padding: 13, borderRadius: 10, background: "#5850ec", color: "#fff", fontWeight: 700, fontSize: 15 }}>登录</div>
            <div onClick={enterDemo} style={{ cursor: "pointer", textAlign: "center", padding: 13, borderRadius: 10, background: "#f1f0fb", color: "#5850ec", fontWeight: 700, fontSize: 14 }}>使用演示账号「林深」一键体验</div>
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: "#8a919e", marginTop: 18 }}>继续即代表同意《服务条款》与《隐私政策》</div>
        </div>
      </div>
    </div>
  );
}
