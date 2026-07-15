"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Spinner } from "../ui";
import type { Analysis, Match } from "@/lib/types";

function AnalysisView({ a }: { a: Analysis }) {
  const block = (title: string, items: string[], color: string) => (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 9 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {items.map((x, i) => (
          <div key={i} style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.5, display: "flex", gap: 7 }}>
            <span style={{ color }}>·</span>
            {x}
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>岗位拆解</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {block("核心职责", a.responsibilities, "#5850ec")}
        {block("必要能力", a.mustHave, "#12805c")}
        {block("加分能力", a.niceToHave, "#c2810c")}
        {block("隐含要求 / 面试重点", a.hidden.concat(a.interviewFocus || []), "#d64545")}
      </div>
    </div>
  );
}

function MatchView({ m }: { m: Match }) {
  const met = (label: string, val: number, unit: string, color: string) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11.5, color: "#8a919e", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 900, fontSize: 22, color }}>{val}</span>
        <span style={{ fontSize: 11, color: "#a3a8b5" }}>{unit}</span>
      </div>
      <div style={{ height: 5, background: "#eee", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
        <div style={{ width: (unit === "处" ? val * 20 : val) + "%", height: "100%", background: color }} />
      </div>
    </div>
  );
  const col = (title: string, arr: Match["strong"], tone: string) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: tone }}>{title} · {arr.length}</div>
      {arr.length ? (
        arr.map((x, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #eef0f4", borderRadius: 11, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{x.req}</div>
            {x.ev ? <div style={{ fontSize: 11.5, color: "#5850ec", margin: "4px 0 2px" }}>← {x.ev}</div> : null}
            <div style={{ fontSize: 11.5, color: "#8a919e", lineHeight: 1.5 }}>{x.note}</div>
          </div>
        ))
      ) : (
        <div style={{ fontSize: 12, color: "#c9ccd6", padding: "8px 0" }}>—</div>
      )}
    </div>
  );
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, margin: "4px 0 12px" }}>证据匹配工作台</div>
      <div style={{ display: "flex", gap: 20, background: "#16181d", borderRadius: 14, padding: "16px 20px", marginBottom: 14 }}>
        {met("要求覆盖度", m.metrics.coverage, "/100", "#ffffff")}
        {met("证据强度", m.metrics.strength, "/100", "#a5f3d0")}
        {met("表达清晰度", m.metrics.clarity, "/100", "#c9c4f5")}
        {met("风险项", m.metrics.risk, "处", "#f0a0a0")}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        {col("强匹配", m.strong, "#12805c")}
        {col("弱匹配", m.weak, "#c2810c")}
        {col("未匹配", m.none, "#8a919e")}
      </div>
      <div style={{ background: "#fff5f5", border: "1px solid #f7d9d9", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#d64545", marginBottom: 8 }}>禁止夸大 · 风险表述</div>
        {m.risks.map((r, i) => (
          <div key={i} style={{ fontSize: 12.5, marginBottom: 6, lineHeight: 1.5 }}>
            <span style={{ color: "#d64545" }}>⚠ </span>
            {r.text}
            <span style={{ color: "#12805c" }}> → {r.fix}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Jd() {
  const jobs = useStore((s) => s.jobs);
  const activeJobId = useStore((s) => s.activeJobId);
  const jdLoading = useStore((s) => s.jdLoading);
  const analyses = useStore((s) => s.analyses);
  const matches = useStore((s) => s.matches);
  const updateJd = useStore((s) => s.updateJd);
  const analyzeJd = useStore((s) => s.analyzeJd);
  const go = useStore((s) => s.go);

  const j = jobs.find((x) => x.id === activeJobId) || jobs[0];
  const a = analyses[j.id];
  const m = matches[j.id];

  return (
    <Page title="JD 分析与证据匹配">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {jobs.map((x) => (
          <div key={x.id} onClick={() => useStore.setState({ activeJobId: x.id })} style={{ cursor: "pointer", padding: "7px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, background: x.id === j.id ? "#16181d" : "#fff", color: x.id === j.id ? "#fff" : "#4b5060", border: "1px solid " + (x.id === j.id ? "#16181d" : "#e3e5ec") }}>
            {x.company} · {x.role.split("·")[0].trim()}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 18, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>{j.company} · {j.role}</div>
          <textarea
            value={j.jd}
            onChange={(e) => updateJd(j.id, e.target.value)}
            placeholder="粘贴目标岗位 JD…"
            style={{ width: "100%", height: 200, border: "1px solid #e6e8ee", borderRadius: 10, padding: 12, fontSize: 12.5, lineHeight: 1.7, resize: "vertical", outline: "none", background: "#fbfbfd" }}
          />
          <div style={{ marginTop: 12 }}>
            <Btn label={jdLoading ? "分析中…" : a ? "重新分析 JD" : "分析 JD →"} onClick={() => analyzeJd()} />
          </div>
        </div>
        {jdLoading ? (
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
            <Spinner text="识别核心职责、必要/加分能力与隐含要求，并对照你的证据…" />
          </div>
        ) : !a ? (
          <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: "40px 24px", textAlign: "center", color: "#6b7280", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line" }}>
            左侧粘贴 JD 并点击「分析 JD」。{"\n"}AI 会拆出岗位要求，并和你的证据库逐条对照——{"\n"}不是给一个虚假分数，而是告诉你为什么匹配、还缺什么。
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AnalysisView a={a} />
            {m ? <MatchView m={m} /> : null}
            <div style={{ display: "flex", gap: 10 }}>
              <Btn label="生成定制简历 →" kind="dark" onClick={() => go("resume")} />
              <Btn label="生成求职材料" kind="ghost" onClick={() => go("materials")} />
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
