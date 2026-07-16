"use client";

import React, { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { useSpeechInput } from "@/lib/speech";
import { Page, Btn, Pill } from "../ui";
import { VoiceButton, VoiceStatus } from "../VoiceInput";
import type { InterviewMsg } from "@/lib/types";

const checklist = [
  "项目背景与目标",
  "你的职责与贡献边界",
  "关键技术决策",
  "最难的技术难点",
  "协作与推动方式",
  "可量化的结果",
  "可验证的成果",
];

function Bubble({ m }: { m: InterviewMsg }) {
  const me = m.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: me ? "flex-end" : "flex-start" }}>
      {/* Agent 工具调用透明记录：访谈官查了什么、起草了什么，用户全程可见 */}
      {m.tools?.map((t, i) => (
        <div key={i} style={{ fontSize: 11, color: "#8a919e", fontFamily: "'JetBrains Mono'", background: "#f7f7fa", border: "1px solid #ececf2", borderRadius: 8, padding: "3px 9px" }}>
          ⚙ {t}
        </div>
      ))}
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
  const ivDraft = useStore((s) => s.ivDraft);
  const ivBasic = useStore((s) => s.ivBasic);
  const startInterview = useStore((s) => s.startInterview);
  const sendInterview = useStore((s) => s.sendInterview);
  const endInterview = useStore((s) => s.endInterview);
  const applyInterviewSummary = useStore((s) => s.applyInterviewSummary);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ivMsgs, ivLoading]);

  // 语音回答：识别定稿一段就追加进输入框，用户改完再发送
  const sp = useSpeechInput((t) =>
    useStore.setState((st) => ({ ivInput: st.ivInput + t }))
  );

  if (!ivProject) {
    const cands = evidence.filter((e) => e.status !== "confirmed");
    const kinds: { k: NonNullable<import("@/lib/types").EvidenceKind>; label: string }[] = [
      { k: "work", label: "工作经历" },
      { k: "intern", label: "实习" },
      { k: "project", label: "公司项目" },
      { k: "personal", label: "个人项目" },
      { k: "opensource", label: "开源经历" },
    ];
    return (
      <Page
        title="AI 访谈整理经历"
        sub="没有简历也能从零开始。AI 会像资深面试官一样连续追问：背景、你的职责边界、关键行动、难点、可量化结果与可验证的成果——只记录你说过的事实，确认后才保存。"
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: "#faf9ff", border: "1.5px dashed #c9c4f5", borderRadius: 14, padding: 18, gridColumn: cands.length ? undefined : "1 / -1" }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>从零整理一段新经历</div>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 12, lineHeight: 1.6 }}>选类型开始访谈，问清楚一段是一段：</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {kinds.map((x) => (
                <Btn
                  key={x.k}
                  label={x.label + " →"}
                  kind="soft"
                  onClick={() => startInterview({ id: "new", title: "新经历深挖 · " + x.label, kind: x.k, project: "待确认", background: "", status: "insufficient" })}
                />
              ))}
            </div>
          </div>
          {cands.map((e) => (
            <div key={e.id} style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{e.title}</div>
                <Pill status={e.status} />
              </div>
              <div style={{ fontSize: 12.5, color: "#6b7280", margin: "8px 0 14px", lineHeight: 1.6 }}>{e.note || e.background}</div>
              <Btn label="补全这段经历 →" kind="ghost" onClick={() => startInterview(e)} />
            </div>
          ))}
        </div>
      </Page>
    );
  }

  const doneCount = Math.floor(ivMsgs.length / 2);
  return (
    <div style={{ animation: "pcvFade .3s ease both", display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, height: "calc(100vh - 130px)" }}>
      <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>深挖：{ivProject.title}</div>
            <div style={{ fontSize: 11.5, color: ivBasic ? "#c2810c" : "#8a919e" }}>
              {ivBasic ? "基础模式 · 本地预设问题，不调用在线 AI" : "AI 职业教练 · 连续追问中"}
            </div>
          </div>
          <div onClick={() => useStore.setState({ ivProject: null, ivMsgs: [], ivSummary: null, ivDraft: null, ivBasic: false })} style={{ cursor: "pointer", fontSize: 12, color: "#8a919e" }}>退出</div>
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
        <div style={{ padding: 14, borderTop: "1px solid #f0f0f5" }}>
          <VoiceStatus sp={sp} />
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={ivInput}
              onChange={(e) => useStore.setState({ ivInput: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") { sp.stop(); sendInterview(); } }}
              placeholder={sp.listening ? "正在听……说完点「停止」，检查识别结果后再发送" : "如实回答，越具体越能挖出可信的细节——点「语音」开口说，或直接打字"}
              style={{ flex: 1, border: "1px solid #e6e8ee", borderRadius: 10, padding: "11px 13px", fontSize: 13.5, outline: "none" }}
            />
            <VoiceButton sp={sp} />
            <Btn label="发送" onClick={() => { sp.stop(); sendInterview(); }} />
          </div>
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
        {ivDraft ? (
          <div style={{ background: "#fff", border: "1.5px dashed #c9c4f5", borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5850ec", marginBottom: 8 }}>⚙ Agent 起草中的经历卡</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12, color: "#4b5060", lineHeight: 1.55 }}>
              {ivDraft.background ? <div><b>背景</b>：{ivDraft.background}</div> : null}
              {ivDraft.responsibilities?.length ? <div><b>职责</b>：{ivDraft.responsibilities.join("；")}</div> : null}
              {ivDraft.actions?.length ? <div><b>行动</b>：{ivDraft.actions.join("；")}</div> : null}
              {ivDraft.challenges?.length ? <div><b>难点</b>：{ivDraft.challenges.join("；")}</div> : null}
              {ivDraft.results?.length ? <div><b>结果</b>：{ivDraft.results.join("；")}</div> : null}
              {ivDraft.skills?.length ? <div><b>技能</b>：{ivDraft.skills.join("、")}</div> : null}
            </div>
            <div style={{ fontSize: 11, color: "#a3a8b5", marginTop: 9, lineHeight: 1.5 }}>只是草稿——结束访谈后经你确认才会写入经历库。</div>
          </div>
        ) : null}
        <Btn label={ivLoading ? "请稍候…" : "结束访谈并生成总结"} kind="dark" onClick={() => endInterview()} />
        {ivSummary ? (
          <div style={{ background: "#16181d", color: "#fff", borderRadius: 16, padding: 16, fontSize: 12.5, lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#c9c4f5" }}>访谈总结</div>
            <div style={{ marginBottom: 10 }}>{ivSummary.summary}</div>
            {ivSummary.missing && ivSummary.missing.length ? (
              <div style={{ background: "#2a2438", borderRadius: 9, padding: "8px 10px", color: "#f0b866" }}>仍缺少：{ivSummary.missing.join("；")}</div>
            ) : null}
            <div style={{ marginTop: 12 }}>
              <Btn label="更新到经历卡" kind="soft" onClick={() => applyInterviewSummary()} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
