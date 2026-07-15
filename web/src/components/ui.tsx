"use client";

import React from "react";
import type { EvidenceStatus, QaPrep } from "@/lib/types";

type Kind = "primary" | "ghost" | "dark" | "soft";

export function Btn({
  label,
  onClick,
  kind = "primary",
}: {
  label: React.ReactNode;
  onClick?: () => void;
  kind?: Kind;
}) {
  const st: React.CSSProperties =
    kind === "ghost"
      ? { background: "#fff", border: "1px solid #e6e3db", color: "#16181d" }
      : kind === "dark"
      ? { background: "#16181d", color: "#fff" }
      : kind === "soft"
      ? { background: "#f1f0fb", color: "#5850ec" }
      : { background: "#5850ec", color: "#fff", boxShadow: "0 4px 14px rgba(88,80,236,.24)" };
  return (
    <div
      onClick={onClick}
      className="pcv-press"
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 13.5,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
        ...st,
      }}
    >
      {label}
    </div>
  );
}

export function statusMeta(st: EvidenceStatus) {
  return st === "confirmed"
    ? { bg: "#e6f5ee", fg: "#12805c", label: "已确认", dot: "#12805c" }
    : st === "pending"
    ? { bg: "#fdf3e0", fg: "#c2810c", label: "待确认", dot: "#c2810c" }
    : { bg: "#f2f3f5", fg: "#8a919e", label: "证据不足", dot: "#b6bcc7" };
}

export function Pill({ status }: { status: EvidenceStatus }) {
  const m = statusMeta(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11.5,
        fontWeight: 700,
        color: m.fg,
        background: m.bg,
        padding: "3px 10px",
        borderRadius: 99,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 99, background: m.dot }} />
      {m.label}
    </span>
  );
}

export function prepMeta(p: QaPrep) {
  return p === "done"
    ? { bg: "#e6f5ee", fg: "#12805c", label: "已掌握" }
    : p === "doing"
    ? { bg: "#eef3ff", fg: "#3b5bdb", label: "准备中" }
    : p === "risk"
    ? { bg: "#fff0f0", fg: "#d64545", label: "高风险" }
    : { bg: "#f2f3f5", fg: "#8a919e", label: "未准备" };
}

export function PrepPill({ prep }: { prep: QaPrep }) {
  const m = prepMeta(prep);
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: m.fg, background: m.bg, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>
      {m.label}
    </span>
  );
}

/** 统一空状态卡：说明 + 主行动 */
export function Empty({
  title,
  desc,
  action,
  maxWidth,
}: {
  title: string;
  desc: string;
  action?: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: "40px 24px", textAlign: "center", maxWidth: maxWidth || 620 }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: action ? 18 : 0, lineHeight: 1.7, whiteSpace: "pre-line" }}>{desc}</div>
      {action ? <div style={{ display: "inline-flex", gap: 10 }}>{action}</div> : null}
    </div>
  );
}

/** 岗位切换 chips（申请包 / QA / 模拟 / 记录页共用） */
export function JobChips({
  jobs,
  activeId,
  onPick,
}: {
  jobs: { id: string; company: string; role: string }[];
  activeId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
      {jobs.map((x) => (
        <div
          key={x.id}
          onClick={() => onPick(x.id)}
          className="pcv-press"
          style={{ padding: "7px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, background: x.id === activeId ? "#16181d" : "#fff", color: x.id === activeId ? "#fff" : "#4b5060", border: "1px solid " + (x.id === activeId ? "#16181d" : "#e6e3db") }}
        >
          {x.company} · {x.role.split("·")[0].trim()}
        </div>
      ))}
    </div>
  );
}

export function Tags({ arr, color }: { arr: string[]; color?: "role" | string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {arr.map((x, i) => (
        <span
          key={i}
          style={{
            fontFamily: "'JetBrains Mono'",
            fontSize: 11,
            background: color === "role" ? "#eef3ff" : "#f1f0fb",
            color: color === "role" ? "#3b5bdb" : "#5850ec",
            padding: "3px 9px",
            borderRadius: 6,
          }}
        >
          {x}
        </span>
      ))}
    </div>
  );
}

export function Spinner({ text }: { text?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 0",
        gap: 16,
        color: "#6b7280",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          border: "3px solid #ece9ff",
          borderTopColor: "#5850ec",
          borderRadius: 99,
          animation: "pcvSpin .8s linear infinite",
        }}
      />
      <div style={{ fontSize: 13.5 }}>{text || "AI 正在分析…"}</div>
      <div
        style={{
          width: 180,
          height: 4,
          background: "#ece9ff",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "30%",
            height: "100%",
            background: "#5850ec",
            borderRadius: 99,
            animation: "pcvBar 1.1s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

export function Page({
  title,
  sub,
  actions,
  children,
}: {
  title: string;
  sub?: string | null;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ animation: "pcvFade .3s ease both" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <div>
          <div style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 24 }}>
            {title}
          </div>
          {sub ? (
            <div
              style={{
                color: "#6b7280",
                fontSize: 13.5,
                marginTop: 5,
                maxWidth: 640,
                lineHeight: 1.6,
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>
        {actions || null}
      </div>
      {children}
    </div>
  );
}
