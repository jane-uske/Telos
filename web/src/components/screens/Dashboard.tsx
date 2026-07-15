"use client";

import React from "react";
import { useStore } from "@/lib/store";

function Stat({ label, val, sub, color }: { label: string; val: string; sub: string; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 900, fontFamily: "'JetBrains Mono'", color: color || "#16181d" }}>{val}</span>
        <span style={{ fontSize: 12, color: "#8a919e" }}>{sub}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const evidence = useStore((s) => s.evidence);
  const jobs = useStore((s) => s.jobs);
  const go = useStore((s) => s.go);
  const confirmed = evidence.filter((e) => e.status === "confirmed").length;
  const pending = evidence.filter((e) => e.status === "pending").length;

  const steps: [string, string, string, string][] = [
    ["import", "导入 / 完善简历", "让 AI 拆解你的经历", "#5850ec"],
    ["interview", "开始 AI 职业访谈", "深挖 2 个待确认项目", "#e8896b"],
    ["jd", "分析新岗位 JD", "对照你的证据强弱", "#12805c"],
  ];

  return (
    <div style={{ animation: "pcvFade .3s ease both" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 26 }}>早上好，林深 👋</div>
        <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>你的证据库已覆盖 3 个方向，距离「字节 高级前端」定制简历还差 1 项待确认证据。</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        <Stat label="职业证据" val="8" sub="张卡" />
        <Stat label="已确认" val={String(confirmed)} sub="可直接引用" color="#12805c" />
        <Stat label="待确认" val={String(pending)} sub="需补充" color="#c2810c" />
        <Stat label="进行中岗位" val="3" sub="个" color="#5850ec" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>继续你的求职闭环</div>
          {steps.map((it, i) => (
            <div key={i} onClick={() => go(it[0] as never)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: i ? "1px solid #f2f2f6" : "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: it[3] + "18", color: it[3], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontFamily: "'JetBrains Mono'" }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{it[1]}</div>
                <div style={{ fontSize: 12.5, color: "#8a919e" }}>{it[2]}</div>
              </div>
              <div style={{ color: "#c9ccd6" }}>→</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#16181d", color: "#fff", borderRadius: 16, padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>今日求职进度</div>
          <div style={{ fontSize: 12.5, color: "#9aa0b0", marginBottom: 16 }}>3 家进行中 · 1 家待你跟进</div>
          {jobs.slice(0, 3).map((j, i) => (
            <div key={i} onClick={() => { useStore.setState({ activeJobId: j.id }); go("jobs"); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderTop: i ? "1px solid #2a2d38" : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{j.company}</div>
                <div style={{ fontSize: 11.5, color: "#9aa0b0" }}>{j.role}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "#2a2d38", color: "#c7cad5" }}>{j.statusLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
