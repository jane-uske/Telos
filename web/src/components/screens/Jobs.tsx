"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn } from "../ui";

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e6e8ee",
  borderRadius: 9,
  padding: "9px 11px",
  fontSize: 13,
  outline: "none",
  background: "#fbfbfd",
};

function AddJobCard() {
  const draft = useStore((s) => s.jobDraft);
  const createJob = useStore((s) => s.createJob);
  if (!draft) {
    return (
      <div
        onClick={() => useStore.setState({ jobDraft: { company: "", role: "", jd: "" } })}
        style={{ cursor: "pointer", background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#5850ec", minHeight: 170 }}
      >
        <div style={{ fontSize: 26, fontWeight: 300, marginBottom: 6 }}>+</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>导入新岗位</div>
        <div style={{ fontSize: 12, color: "#8a919e", marginTop: 4 }}>粘贴 JD，创建岗位申请包</div>
      </div>
    );
  }
  return (
    <div style={{ background: "#fff", border: "1.5px solid #5850ec", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>导入新岗位</div>
      <input placeholder="公司名称 *" value={draft.company} onChange={(e) => useStore.setState({ jobDraft: { ...draft, company: e.target.value } })} style={inputStyle} />
      <input placeholder="岗位名称（如：高级前端工程师）" value={draft.role} onChange={(e) => useStore.setState({ jobDraft: { ...draft, role: e.target.value } })} style={inputStyle} />
      <textarea placeholder="粘贴完整 JD *" rows={4} value={draft.jd} onChange={(e) => useStore.setState({ jobDraft: { ...draft, jd: e.target.value } })} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <Btn label="创建申请包 →" onClick={() => createJob()} />
        <Btn label="取消" kind="ghost" onClick={() => useStore.setState({ jobDraft: null })} />
      </div>
    </div>
  );
}

export default function Jobs() {
  const s = useStore();
  const openPackage = useStore((x) => x.openPackage);
  const moveJobStatus = useStore((x) => x.moveJobStatus);

  return (
    <Page
      title="岗位列表"
      sub="每个岗位对应一个申请包：JD 分析、专属简历、面试 QA、模拟面试和真实复盘都在包里。新增岗位时直接复用你的证据库，不用重来。"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {s.jobs.map((j) => {
          const qaCount = (s.qa[j.id] || []).length;
          const mockCount = (s.mocks[j.id] || []).length;
          const recCount = s.records.filter((r) => r.jobId === j.id).length;
          const stage = !s.analyses[j.id] ? "① 待分析 JD" : !s.resumes[j.id] ? "② 待生成简历" : !qaCount ? "③ 待生成 QA" : null;
          return (
            <div key={j.id} style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <div onClick={() => openPackage(j.id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: "#16181d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>{j.logo}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{j.company}</div>
                  <div style={{ fontSize: 12, color: "#8a919e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.role}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div onClick={() => moveJobStatus(j.id, -1)} title="上一状态" style={{ cursor: "pointer", fontSize: 14, color: "#c9ccd6", lineHeight: 1, padding: "0 2px" }}>‹</div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#f1f0fb", color: "#5850ec" }}>{j.statusLabel}</span>
                  <div onClick={() => moveJobStatus(j.id, 1)} title="下一状态" style={{ cursor: "pointer", fontSize: 14, color: "#c9ccd6", lineHeight: 1, padding: "0 2px" }}>›</div>
                </div>
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
                <div style={{ fontSize: 12, color: "#c2810c" }}>尚未分析 JD</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f2f2f6", paddingTop: 10 }}>
                <div style={{ fontSize: 11.5, color: "#a3a8b5" }}>
                  {stage ? <span style={{ color: "#c2810c", fontWeight: 600 }}>{stage}</span> : "QA " + qaCount + " · 模拟 " + mockCount + " · 复盘 " + recCount}
                </div>
                <div onClick={() => openPackage(j.id)} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#5850ec" }}>打开申请包 →</div>
              </div>
            </div>
          );
        })}
        <AddJobCard />
      </div>
    </Page>
  );
}
