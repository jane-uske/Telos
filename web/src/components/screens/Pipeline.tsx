"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page } from "../ui";
import type { JobStatus } from "@/lib/types";

const cols: [JobStatus, string, string][] = [
  ["saved", "收藏", "#8a919e"],
  ["preparing", "准备投递", "#5850ec"],
  ["applied", "已投递", "#3b82c4"],
  ["replied", "已回复", "#0ea5a0"],
  ["interviewing", "面试中", "#c2810c"],
  ["offer", "Offer", "#12805c"],
  ["rejected", "拒绝", "#b0454a"],
];

export default function Pipeline() {
  const jobs = useStore((s) => s.jobs);
  const moveJob = useStore((s) => s.moveJob);
  const go = useStore((s) => s.go);

  return (
    <Page title="求职进度">
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {cols.map((c) => {
          const items = jobs.filter((j) => j.status === c[0]);
          return (
            <div key={c[0]} style={{ minWidth: 190, flex: "0 0 190px", background: "#f2f3f6", borderRadius: 14, padding: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 6px 10px", fontSize: 12.5, fontWeight: 700, color: c[2] }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: c[2] }} />
                {c[1]}
                <span style={{ color: "#a3a8b5", fontWeight: 400 }}>{items.length}</span>
              </div>
              {items.map((j) => (
                <div key={j.id} style={{ background: "#fff", border: "1px solid #eaeaef", borderRadius: 11, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{j.company}</div>
                  <div style={{ fontSize: 11.5, color: "#8a919e", margin: "2px 0 8px", lineHeight: 1.4 }}>{j.role}</div>
                  {j.match ? <div style={{ fontSize: 11, color: "#5850ec", fontFamily: "'JetBrains Mono'", marginBottom: 8 }}>匹配 {j.match}</div> : null}
                  <div style={{ display: "flex", gap: 6 }}>
                    <div onClick={() => moveJob(j.id, -1)} style={{ cursor: "pointer", fontSize: 15, color: "#c9ccd6", lineHeight: 1 }}>‹</div>
                    <div onClick={() => { useStore.setState({ activeJobId: j.id }); go("jd"); }} style={{ cursor: "pointer", flex: 1, textAlign: "center", fontSize: 11, color: "#5850ec", fontWeight: 600 }}>打开</div>
                    <div onClick={() => moveJob(j.id, 1)} style={{ cursor: "pointer", fontSize: 15, color: "#c9ccd6", lineHeight: 1 }}>›</div>
                  </div>
                </div>
              ))}
              {items.length ? null : <div style={{ fontSize: 11.5, color: "#c0c4cf", textAlign: "center", padding: "16px 0" }}>空</div>}
            </div>
          );
        })}
      </div>
    </Page>
  );
}
