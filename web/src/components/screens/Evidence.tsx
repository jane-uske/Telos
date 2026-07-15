"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Pill, Tags } from "../ui";
import type { Evidence as Ev } from "@/lib/types";

function EvidenceCard({ e }: { e: Ev }) {
  const confirmEvidence = useStore((s) => s.confirmEvidence);
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.4 }}>{e.title}</div>
          <div style={{ fontSize: 12, color: "#8a919e", marginTop: 3 }}>{e.project}</div>
        </div>
        <Pill status={e.status} />
      </div>
      <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.65 }}>{e.background}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#a3a8b5", marginBottom: 5 }}>我的关键行动</div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: "#4b5060", lineHeight: 1.75 }}>
          {e.actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {e.results.map((r, i) => (
          <span key={i} style={{ fontSize: 12, fontWeight: 600, color: "#12805c", background: "#eef8f2", padding: "4px 10px", borderRadius: 7 }}>↑ {r}</span>
        ))}
      </div>
      <Tags arr={e.skills} />
      {e.note ? (
        <div style={{ fontSize: 12, color: "#c2810c", background: "#fdf7ec", borderRadius: 9, padding: "8px 11px", lineHeight: 1.55 }}>⚠ {e.note}</div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f2f2f6", paddingTop: 11 }}>
        <div style={{ fontSize: 11.5, color: "#a3a8b5" }}>来源：{e.source}</div>
        {e.status !== "confirmed" ? (
          <div onClick={() => confirmEvidence(e.id)} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#5850ec" }}>标记为已确认 ✓</div>
        ) : (
          <div style={{ fontSize: 12, color: "#12805c", fontWeight: 600 }}>适用：{e.roles.join(" / ")}</div>
        )}
      </div>
    </div>
  );
}

export default function Evidence() {
  const evidence = useStore((s) => s.evidence);
  const filt = useStore((s) => s.evidenceFilter);
  const go = useStore((s) => s.go);

  const list = evidence.filter((e) => filt === "all" || e.status === filt);
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
      title="职业证据库"
      sub="这是产品的核心资产。每张证据卡都标注了信息来源与置信状态——新增岗位时直接复用，不用重复填写经历。"
      actions={<Btn label="去 AI 访谈补充证据" kind="ghost" onClick={() => go("interview")} />}
    >
      <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
        {fbtn("all", "全部")}
        {fbtn("confirmed", "已确认")}
        {fbtn("pending", "待确认")}
        {fbtn("insufficient", "证据不足")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {list.map((e) => (
          <EvidenceCard key={e.id} e={e} />
        ))}
      </div>
    </Page>
  );
}
