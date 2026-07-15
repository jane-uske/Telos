"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page } from "../ui";

export default function Jobs() {
  const jobs = useStore((s) => s.jobs);
  const go = useStore((s) => s.go);
  const addJob = useStore((s) => s.addJob);

  return (
    <Page
      title="岗位管理"
      sub="每个岗位都汇集 JD、匹配分析、使用的简历、生成的沟通材料和进度。新增岗位时直接复用你的证据库，不用重来。"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {jobs.map((j) => (
          <div key={j.id} onClick={() => { useStore.setState({ activeJobId: j.id }); go("jd"); }} style={{ cursor: "pointer", background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "#16181d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>{j.logo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{j.company}</div>
                <div style={{ fontSize: 12, color: "#8a919e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.role}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#f1f0fb", color: "#5850ec" }}>{j.statusLabel}</span>
              <span style={{ fontSize: 11.5, color: "#a3a8b5" }}>更新 {j.updated}</span>
            </div>
            {j.match ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#8a919e", marginBottom: 4 }}>
                  <span>匹配覆盖度</span>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: "#16181d" }}>{j.match}</span>
                </div>
                <div style={{ height: 6, background: "#eee", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: j.match + "%", height: "100%", background: "#5850ec" }} />
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#c2810c" }}>尚未分析 JD →</div>
            )}
          </div>
        ))}
        <div onClick={() => addJob()} style={{ cursor: "pointer", background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#5850ec", minHeight: 150 }}>
          <div style={{ fontSize: 26, fontWeight: 300, marginBottom: 6 }}>+</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>新增岗位</div>
          <div style={{ fontSize: 12, color: "#8a919e", marginTop: 4 }}>粘贴一段 JD 开始</div>
        </div>
      </div>
    </Page>
  );
}
