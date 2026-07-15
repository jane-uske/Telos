"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Spinner } from "../ui";
import type { Mats } from "@/lib/types";

const tabs: [string, string][] = [
  ["greeting", "招呼语"],
  ["email", "邮件/私信开场"],
  ["intro30", "30 秒自我介绍"],
  ["intro120", "2 分钟自我介绍"],
  ["story", "项目讲述稿"],
  ["questions", "面试追问"],
  ["gaps", "能力缺口与准备"],
];

export default function Materials() {
  const jobs = useStore((s) => s.jobs);
  const activeJobId = useStore((s) => s.activeJobId);
  const mats = useStore((s) => s.mats);
  const matLoading = useStore((s) => s.matLoading);
  const cur = useStore((s) => s.matTab);
  const generateMaterials = useStore((s) => s.generateMaterials);
  const copyText = useStore((s) => s.copyText);

  const j = jobs.find((x) => x.id === activeJobId) || jobs[0];
  const mat = mats[j.id];

  if (!mat) {
    return (
      <Page title="求职材料中心">
        <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: 40, maxWidth: 620, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{j.company} · {j.role}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 18, lineHeight: 1.7 }}>
            {matLoading ? "AI 正在基于你的证据与该岗位生成全套求职材料…" : "一键生成招呼语、自我介绍、项目讲述稿、面试追问和能力缺口清单——全部基于你的真实证据。"}
          </div>
          {matLoading ? <Spinner text="生成中…" /> : <div style={{ display: "inline-flex" }}><Btn label="生成全套求职材料 →" onClick={() => generateMaterials()} /></div>}
        </div>
      </Page>
    );
  }

  const isList = cur === "questions" || cur === "gaps";
  const curLabel = tabs.find((t) => t[0] === cur)![1];

  return (
    <Page title={"求职材料中心 · " + j.company}>
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 18, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 8 }}>
          {tabs.map((t) => (
            <div key={t[0]} onClick={() => useStore.setState({ matTab: t[0] })} style={{ cursor: "pointer", padding: "10px 12px", borderRadius: 9, fontSize: 13, fontWeight: cur === t[0] ? 700 : 400, background: cur === t[0] ? "#f1f0fb" : "transparent", color: cur === t[0] ? "#5850ec" : "#4b5060", marginBottom: 2 }}>{t[1]}</div>
          ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{curLabel}</div>
            {!isList ? <div onClick={() => copyText(mat[cur as keyof Mats] as string)} style={{ cursor: "pointer", fontSize: 12.5, color: "#5850ec", fontWeight: 600 }}>复制</div> : null}
          </div>
          {cur === "questions" ? (
            <div>
              {mat.questions.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: i ? "1px solid #f2f2f6" : "none" }}>
                  <span style={{ fontFamily: "'JetBrains Mono'", color: "#c9c4f5", fontWeight: 700, fontSize: 12 }}>Q{i + 1}</span>
                  <div style={{ fontSize: 13, color: "#2f333d", lineHeight: 1.6 }}>{q}</div>
                </div>
              ))}
            </div>
          ) : cur === "gaps" ? (
            <div>
              {mat.gaps.map((g, i) => (
                <div key={i} style={{ border: "1px solid #eef0f4", borderRadius: 11, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#c2810c", marginBottom: 5 }}>缺口：{g.g}</div>
                  <div style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.6 }}>准备：{g.s}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13.5, color: "#2f333d", lineHeight: 1.85, whiteSpace: "pre-wrap", background: "#fbfbfd", border: "1px solid #f0f0f5", borderRadius: 12, padding: "16px 18px" }}>{mat[cur as keyof Mats] as string}</div>
          )}
        </div>
      </div>
    </Page>
  );
}
