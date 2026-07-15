"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Pill, Tags } from "../ui";
import type { Evidence as Ev } from "@/lib/types";

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e6e8ee",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12.5,
  lineHeight: 1.6,
  outline: "none",
  background: "#fbfbfd",
  resize: "vertical",
};

function EditForm({ e }: { e: Ev }) {
  const saveEvidence = useStore((s) => s.saveEvidence);
  const [f, setF] = useState({
    title: e.title,
    project: e.project,
    background: e.background,
    responsibilities: e.responsibilities.join("\n"),
    actions: e.actions.join("\n"),
    challenges: e.challenges.join("\n"),
    collaboration: e.collaboration || "",
    results: e.results.join("\n"),
    skills: e.skills.join("、"),
  });
  const set = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setF({ ...f, [k]: ev.target.value });
  const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
  const row = (label: string, node: React.ReactNode) => (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#a3a8b5", marginBottom: 4 }}>{label}</div>
      {node}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {row("名称", <input value={f.title} onChange={set("title")} style={inputStyle} />)}
      {row("项目 / 公司", <input value={f.project} onChange={set("project")} style={inputStyle} />)}
      {row("背景", <textarea value={f.background} onChange={set("background")} rows={2} style={inputStyle} />)}
      {row("我实际负责的（每行一条）", <textarea value={f.responsibilities} onChange={set("responsibilities")} rows={2} style={inputStyle} />)}
      {row("关键行动（每行一条）", <textarea value={f.actions} onChange={set("actions")} rows={3} style={inputStyle} />)}
      {row("难点：技术 / 业务（每行一条）", <textarea value={f.challenges} onChange={set("challenges")} rows={2} style={inputStyle} />)}
      {row("协作过程", <textarea value={f.collaboration} onChange={set("collaboration")} rows={2} style={inputStyle} />)}
      {row("结果与量化数据（每行一条，只写有依据的）", <textarea value={f.results} onChange={set("results")} rows={2} style={inputStyle} />)}
      {row("技能标签（用「、」分隔）", <input value={f.skills} onChange={set("skills")} style={inputStyle} />)}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn
          label="保存"
          onClick={() =>
            saveEvidence(e.id, {
              title: f.title.trim() || e.title,
              project: f.project.trim(),
              background: f.background.trim(),
              responsibilities: lines(f.responsibilities),
              actions: lines(f.actions),
              challenges: lines(f.challenges),
              collaboration: f.collaboration.trim() || undefined,
              results: lines(f.results),
              skills: f.skills.split(/[、,，]/).map((x) => x.trim()).filter(Boolean),
            })
          }
        />
        <Btn label="取消" kind="ghost" onClick={() => useStore.setState({ editingEvidenceId: null })} />
      </div>
    </div>
  );
}

function EvidenceCard({ e }: { e: Ev }) {
  const confirmEvidence = useStore((s) => s.confirmEvidence);
  const startInterview = useStore((s) => s.startInterview);
  const editing = useStore((s) => s.editingEvidenceId === e.id);

  const section = (label: string, items: string[]) =>
    items.length ? (
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#a3a8b5", marginBottom: 5 }}>{label}</div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: "#4b5060", lineHeight: 1.75 }}>
          {items.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.4 }}>{e.title}</div>
          <div style={{ fontSize: 12, color: "#8a919e", marginTop: 3 }}>{e.project}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Pill status={e.status} />
          {!editing ? (
            <div onClick={() => useStore.setState({ editingEvidenceId: e.id })} style={{ cursor: "pointer", fontSize: 12, color: "#8a919e" }} title="编辑证据卡">✎</div>
          ) : null}
        </div>
      </div>

      {editing ? (
        <EditForm e={e} />
      ) : (
        <>
          {e.background ? <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.65 }}>{e.background}</div> : null}
          {section("我实际负责的", e.responsibilities)}
          {section("关键行动", e.actions)}
          {section("难点", e.challenges)}
          {e.collaboration ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#a3a8b5", marginBottom: 5 }}>协作过程</div>
              <div style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.65 }}>{e.collaboration}</div>
            </div>
          ) : null}
          {e.results.length ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {e.results.map((r, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 600, color: "#12805c", background: "#eef8f2", padding: "4px 10px", borderRadius: 7 }}>↑ {r}</span>
              ))}
            </div>
          ) : null}
          {e.skills.length ? <Tags arr={e.skills} /> : null}
          {e.note ? (
            <div style={{ fontSize: 12, color: "#c2810c", background: "#fdf7ec", borderRadius: 9, padding: "8px 11px", lineHeight: 1.55 }}>⚠ {e.note}</div>
          ) : null}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f2f2f6", paddingTop: 11 }}>
            <div style={{ fontSize: 11.5, color: "#a3a8b5" }}>来源：{e.source}</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {e.status !== "confirmed" ? (
                <>
                  <div onClick={() => startInterview(e)} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "#e8896b" }}>访谈补全 →</div>
                  <div onClick={() => confirmEvidence(e.id)} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#5850ec" }}>标记为已确认 ✓</div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "#12805c", fontWeight: 600 }}>适用：{e.roles.join(" / ") || "通用"}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Evidence() {
  const evidence = useStore((s) => s.evidence);
  const filt = useStore((s) => s.evidenceFilter);
  const go = useStore((s) => s.go);
  const jobsCount = useStore((s) => s.jobs.length);

  const list = evidence.filter((e) => filt === "all" || e.status === filt);
  const confirmed = evidence.filter((e) => e.status === "confirmed").length;
  const counts = {
    all: evidence.length,
    confirmed: evidence.filter((e) => e.status === "confirmed").length,
    pending: evidence.filter((e) => e.status === "pending").length,
    insufficient: evidence.filter((e) => e.status === "insufficient").length,
  } as Record<string, number>;

  const fbtn = (k: string, label: string) => (
    <div
      onClick={() => useStore.setState({ evidenceFilter: k })}
      style={{ cursor: "pointer", padding: "7px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, background: filt === k ? "#16181d" : "#fff", color: filt === k ? "#fff" : "#4b5060", border: "1px solid " + (filt === k ? "#16181d" : "#e3e5ec") }}
    >
      {label} {counts[k]}
    </div>
  );

  return (
    <Page
      title="整理我的经历"
      sub="把过去做过的事情重新想清楚。每段经历都标注来源与确认状态——不会替你编造数据，缺什么就用访谈补什么。所有岗位共用这份经历库。"
      actions={
        <div style={{ display: "flex", gap: 10 }}>
          <Btn label="我有旧简历 · 上传/粘贴" kind="ghost" onClick={() => go("import")} />
          <Btn label="我没有简历 · AI 从零整理" kind="soft" onClick={() => go("interview")} />
        </div>
      }
    >
      {!evidence.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 860 }}>
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 22 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>我有旧简历</div>
            <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.7, marginBottom: 14 }}>
              粘贴文本，或上传 .txt / .md / 带文本层的 .pdf（在浏览器本地解析，不上传服务器）。拆解出的每段经历都先预览、再由你确认。
            </div>
            <Btn label="上传 / 粘贴旧简历 →" onClick={() => go("import")} />
          </div>
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 22 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>我没有简历</div>
            <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.7, marginBottom: 14 }}>
              用 AI 访谈从零整理：工作、实习、项目、个人项目、开源经历都行。像面试官一样连续追问背景、职责、行动、难点、结果和证据，确认后才保存。
            </div>
            <Btn label="开始 AI 访谈 →" kind="dark" onClick={() => go("interview")} />
          </div>
        </div>
      ) : (
        <>
          {confirmed > 0 && !jobsCount ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "#e6f5ee", border: "1px solid #bfe6d4", borderRadius: 12, padding: "11px 14px", marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#12805c" }}>✓ 已确认 {confirmed} 段经历——可以开始准备岗位了。</span>
              <Btn label="下一步：添加目标岗位 →" kind="dark" onClick={() => go("jobs")} />
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
            {fbtn("all", "全部")}
            {fbtn("confirmed", "已确认")}
            {fbtn("pending", "待确认")}
            {fbtn("insufficient", "证据不足")}
          </div>
          {list.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {list.map((e) => (
                <EvidenceCard key={e.id} e={e} />
              ))}
            </div>
          ) : (
            <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: "40px 24px", textAlign: "center", color: "#6b7280", fontSize: 13, lineHeight: 1.8 }}>
              这个状态下还没有经历。
            </div>
          )}
        </>
      )}
    </Page>
  );
}
