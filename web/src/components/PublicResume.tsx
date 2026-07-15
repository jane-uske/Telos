"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Tags } from "./ui";
import { seedResumes } from "@/lib/seed";

export default function PublicResume() {
  const copyText = useStore((s) => s.copyText);
  const showToast = useStore((s) => s.showToast);
  const setScreen = useStore((s) => s.setScreen);
  const r = seedResumes().j1;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f7" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #ececf2" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#8a919e" }}>proofcv.me/linshen/r/bytedance-fe · 公开简历</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={() => copyText("https://proofcv.me/linshen/r/bytedance-fe")} style={{ cursor: "pointer", fontSize: 12, background: "#f1f0fb", color: "#5850ec", padding: "6px 12px", borderRadius: 8, fontWeight: 600 }}>复制链接</div>
            <div onClick={() => showToast("已导出 PDF（演示）")} style={{ cursor: "pointer", fontSize: 12, background: "#16181d", color: "#fff", padding: "6px 12px", borderRadius: 8 }}>下载 PDF</div>
            <div onClick={() => setScreen("app")} style={{ cursor: "pointer", fontSize: 12, color: "#8a919e", padding: "6px 8px" }}>返回</div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 720, margin: "24px auto 60px", background: "#fff", borderRadius: 16, border: "1px solid #ececf2", padding: "40px 44px" }}>
        <div style={{ borderBottom: "2px solid #5850ec", paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 28 }}>林深</div>
          <div style={{ color: "#5850ec", fontSize: 15, fontWeight: 600, marginTop: 3 }}>全栈 / 高级前端工程师 · 应聘 字节跳动 高级前端</div>
          <div style={{ fontSize: 12.5, color: "#8a919e", marginTop: 7, fontFamily: "'JetBrains Mono'" }}>杭州 · 5 年 · lin.shen@demo.dev</div>
        </div>
        <div style={{ fontSize: 13, color: "#4b5060", lineHeight: 1.8, marginBottom: 22 }}>{r.summary}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#5850ec", marginBottom: 12, letterSpacing: ".04em" }}>工作经历</div>
        {r.exp.map((x, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{x.company} · {x.role}</div>
              <div style={{ fontSize: 12, color: "#8a919e", fontFamily: "'JetBrains Mono'" }}>{x.period}</div>
            </div>
            {x.bullets.map((b, k) => (
              <div key={k} style={{ display: "flex", gap: 9, marginTop: 8 }}>
                <span style={{ color: "#5850ec", marginTop: 6, fontSize: 8 }}>●</span>
                <div style={{ fontSize: 13, color: "#2f333d", lineHeight: 1.65 }}>{b.text}</div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#5850ec", margin: "8px 0 10px", letterSpacing: ".04em" }}>技能</div>
        <Tags arr={r.skills} />
        <div style={{ textAlign: "center", fontSize: 12, color: "#a3a8b5", marginTop: 28, borderTop: "1px solid #f2f2f6", paddingTop: 16 }}>由 ProofCV 生成 · 所有描述可追溯到职业证据</div>
      </div>
    </div>
  );
}
