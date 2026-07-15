"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Btn, Tags } from "./ui";

export default function PublicProfile() {
  const evidence = useStore((s) => s.evidence);
  const copyText = useStore((s) => s.copyText);
  const showToast = useStore((s) => s.showToast);
  const setScreen = useStore((s) => s.setScreen);
  const featured = evidence.filter((e) => e.status === "confirmed").slice(0, 4);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f7" }}>
      <div style={{ background: "#16181d", color: "#fff" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#9aa0b0" }}>proofcv.me/linshen · 公开职业主页</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={() => copyText("https://proofcv.me/linshen")} style={{ cursor: "pointer", fontSize: 12, background: "#2a2d38", padding: "6px 12px", borderRadius: 8 }}>复制链接</div>
            <div onClick={() => showToast("已生成二维码（演示）")} style={{ cursor: "pointer", fontSize: 12, background: "#2a2d38", padding: "6px 12px", borderRadius: 8 }}>二维码</div>
            <div onClick={() => setScreen("app")} style={{ cursor: "pointer", fontSize: 12, background: "#5850ec", padding: "6px 12px", borderRadius: 8 }}>返回编辑</div>
          </div>
        </div>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "36px 24px 44px" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "#5850ec", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700 }}>林</div>
            <div>
              <div style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 30 }}>林深</div>
              <div style={{ color: "#c7cad5", fontSize: 15, marginTop: 4 }}>全栈 / 高级前端工程师 · 杭州 · 5 年</div>
              <div style={{ marginTop: 10 }}>
                <Tags arr={["React", "TypeScript", "Node.js", "Go", "性能优化"]} />
              </div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: "#c7cad5", lineHeight: 1.8, marginTop: 22, maxWidth: 640 }}>专注大型协同系统与前端性能优化。相信简历里的每一句都应该站得住脚——下面是我可以为其提供证据的核心能力。</div>
        </div>
      </div>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px 60px" }}>
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, fontFamily: "'Noto Serif SC'" }}>精选职业证据</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {featured.map((e) => (
            <div key={e.id} style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #ececf2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.4 }}>{e.title}</div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#12805c", background: "#e6f5ee", padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>✓ 可验证</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.6, marginBottom: 10 }}>{e.background}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                {e.results.map((r, i) => (
                  <span key={i} style={{ fontSize: 12, fontWeight: 600, color: "#12805c", background: "#eef8f2", padding: "3px 9px", borderRadius: 7 }}>↑ {r}</span>
                ))}
              </div>
              <Tags arr={e.skills} />
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 28px", border: "1px solid #ececf2", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>想看针对某个岗位的定制简历？</div>
            <div style={{ fontSize: 13, color: "#8a919e", marginTop: 3 }}>我可以生成一份聚焦相关经历的版本</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn label="查看精选简历" kind="soft" onClick={() => setScreen("publicResume")} />
            <Btn label="联系我" kind="dark" onClick={() => copyText("lin.shen@demo.dev")} />
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "#a3a8b5", marginTop: 32 }}>由 ProofCV 生成 · 所有内容经本人确认</div>
      </div>
    </div>
  );
}
