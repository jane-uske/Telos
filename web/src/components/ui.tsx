"use client";

import React from "react";
import type { EvidenceStatus } from "@/lib/types";

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
      ? { background: "#fff", border: "1px solid #e3e5ec", color: "#16181d" }
      : kind === "dark"
      ? { background: "#16181d", color: "#fff" }
      : kind === "soft"
      ? { background: "#f1f0fb", color: "#5850ec" }
      : { background: "#5850ec", color: "#fff" };
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
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
    <div style={{ animation: "pcvFade .3s ease both", maxWidth: 1080 }}>
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
