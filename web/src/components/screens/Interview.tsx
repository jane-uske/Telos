"use client";

import React, { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Pill } from "../ui";
import type { InterviewMsg } from "@/lib/types";

const checklist = [
  "项目背景与目标",
  "你的职责与贡献边界",
  "关键技术决策",
  "最难的技术难点",
  "协作与推动方式",
  "可量化的结果",
  "可验证的证据",
];

function Bubble({ m }: { m: InterviewMsg }) {
  const me = m.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "78%", background: me ? "#5850ec" : "#f4f4f8", color: me ? "#fff" : "#16181d", padding: "11px 14px", borderRadius: me ? "14px 14px 4px 14px" : "14px 14px 14px 4px", fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
        {m.content}
      </div>
    </div>
  );
}

export default function Interview() {
  const evidence = useStore((s) => s.evidence);
  const ivProject = useStore((s) => s.ivProject);
  const ivMsgs = useStore((s) => s.ivMsgs);
  const ivInput = useStore((s) => s.ivInput);
  const ivLoading = useStore((s) => s.ivLoading);
  const ivSummary = useStore((s) => s.ivSummary);
  const startInterview = useStore((s) => s.startInterview);
  const sendInterview = useStore((s) => s.sendInterview);
  const endInterview = useStore((s) => s.endInterview);
  const applyInterviewSummary = useStore((s) => s.applyInterviewSummary);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ivMsgs, ivLoading]);

  if (!ivProject) {
    const cands = evidence.filter((e) => e.status !== "confirmed");
    return (
      <Page
        title="AI 职业访谈"
        sub="选一个项目开始深挖。AI 会像资深面试官一样连续追问：背景、你的职责边界、关键决策、技术难点、协作方式、可量化结果与可验证证据——而不是帮你润色文字。"
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {cands.map((e) => (
            <div key={e.id} style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{e.title}</div>
                <Pill status={e.status} />
              </div>
              <div style={{ fontSize: 12.5, color: "#6b7280", margin: "8px 0 14px", lineHeight: 1.6 }}>{e.note || e.background}</div>
              <Btn label="开始深挖这个项目 →" kind="soft" onClick={() => startInterview(e)} />
            </div>
          ))}
          <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>深挖一个全新项目</div>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14, lineHeight: 1.6 }}>简历里没写、但你做过的项目，直接从访谈开始沉淀成证据。</div>
            <Btn label="自由访谈 →" onClick={() => startInterview({ id: "new", title: "新项目深挖", project: "待确认", background: "", status: "insufficient" })} />
          </div>
        </div>
      </Page>
    );
  }

  const doneCount = Math.floor(ivMsgs.length / 2);
  return (
    <div style={{ animation: "pcvFade .3s ease both", display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, maxWidth: 1080, height: "calc(100vh - 130px)" }}>
      <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>深挖：{ivProject.title}</div>
            <div style={{ fontSize: 11.5, color: "#8a919e" }}>AI 职业教练 · 连续追问中</div>
          </div>
          <div onClick={() => useStore.setState({ ivProject: null, ivMsgs: [], ivSummary: null })} style={{ cursor: "pointer", fontSize: 12, color: "#8a919e" }}>退出</div>
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {ivMsgs.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
          {ivLoading ? (
            <div style={{ display: "flex", gap: 6, padding: "4px 2px" }}>
              {[0, 1, 2].map((k) => (
                <span key={k} style={{ width: 7, height: 7, borderRadius: 99, background: "#c9c4f5", animation: "pcvPulse 1s ease-in-out infinite", animationDelay: k * 0.2 + "s" }} />
              ))}
            </div>
          ) : null}
        </div>
        <div style={{ padding: 14, borderTop: "1px solid #f0f0f5", display: "flex", gap: 10 }}>
          <input
            value={ivInput}
            onChange={(e) => useStore.setState({ ivInput: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") sendInterview(); }}
            placeholder="如实回答，越具体越能挖出可信证据…"
            style={{ flex: 1, border: "1px solid #e6e8ee", borderRadius: 10, padding: "11px 13px", fontSize: 13.5, outline: "none" }}
          />
          <Btn label="发送" onClick={() => sendInterview()} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>本次要挖到的</div>
          {checklist.map((x, i) => {
            const done = i < doneCount;
            return (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "center", padding: "6px 0", fontSize: 12.5, color: "#4b5060" }}>
                <span style={{ width: 16, height: 16, borderRadius: 99, border: "1.5px solid " + (done ? "#12805c" : "#d8dae2"), background: done ? "#12805c" : "#fff", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0 }}>{done ? "✓" : ""}</span>
                {x}
              </div>
            );
          })}
        </div>
        <Btn label={ivLoading ? "请稍候…" : "结束访谈并生成总结"} kind="dark" onClick={() => endInterview()} />
        {ivSummary ? (
          <div style={{ background: "#16181d", color: "#fff", borderRadius: 16, padding: 16, fontSize: 12.5, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#c9c4f5" }}>访谈总结</div>
            <div style={{ marginBottom: 10 }}>{ivSummary.summary}</div>
            {ivSummary.missing && ivSummary.missing.length ? (
              <div style={{ background: "#2a2438", borderRadius: 9, padding: "8px 10px", color: "#f0b866" }}>仍缺少：{ivSummary.missing.join("；")}</div>
            ) : null}
            <div style={{ marginTop: 12 }}>
              <Btn label="更新到证据卡" kind="soft" onClick={() => applyInterviewSummary()} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
