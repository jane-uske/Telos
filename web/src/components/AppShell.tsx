"use client";

import React from "react";
import { useStore } from "@/lib/store";
import type { Tab } from "@/lib/types";

import Dashboard from "./screens/Dashboard";
import Import from "./screens/Import";
import Interview from "./screens/Interview";
import Evidence from "./screens/Evidence";
import Jobs from "./screens/Jobs";
import Package from "./screens/Package";
import Resume from "./screens/Resume";
import Qa from "./screens/Qa";
import Mock from "./screens/Mock";
import Records from "./screens/Records";

const titles: Record<Tab, string> = {
  dashboard: "工作台",
  import: "简历导入（证据流程）",
  interview: "AI 职业访谈（证据流程）",
  evidence: "职业证据库",
  jobs: "岗位列表",
  pkg: "岗位申请包",
  resume: "简历编辑器",
  qa: "面试 QA",
  mock: "模拟面试",
  records: "面试记录与复盘",
};

const SCREENS: Record<Tab, React.ComponentType> = {
  dashboard: Dashboard,
  import: Import,
  interview: Interview,
  evidence: Evidence,
  jobs: Jobs,
  pkg: Package,
  resume: Resume,
  qa: Qa,
  mock: Mock,
  records: Records,
};

function NavItem({ tabKey, label, badge }: { tabKey: Tab; label: string; badge?: string }) {
  const active = useStore((s) => s.screen === "app" && s.tab === tabKey);
  const go = useStore((s) => s.go);
  return (
    <div
      onClick={() => go(tabKey)}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 10px",
        borderRadius: 9,
        fontSize: 13.5,
        marginBottom: 2,
        fontWeight: active ? 700 : 400,
        background: active ? "#f1f0fb" : "transparent",
        color: active ? "#5850ec" : "#4b5060",
        transition: "background .2s ease, color .2s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLDivElement).style.background = "#f5f5fa";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      <span>{label}</span>
      {badge ? (
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, background: "#f1f0fb", color: "#5850ec", padding: "1px 7px", borderRadius: 99 }}>{badge}</span>
      ) : null}
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  color: "#a3a8b5",
  fontWeight: 700,
  padding: "6px 10px",
  letterSpacing: ".05em",
};

export default function AppShell() {
  const tab = useStore((s) => s.tab);
  const evidenceCount = useStore((s) => s.evidence.length);
  const jobsCount = useStore((s) => s.jobs.length);
  const pendingSugs = useStore((s) =>
    s.records.reduce((n, r) => n + r.suggestions.filter((x) => x.state === "pending").length, 0)
  );
  const setScreen = useStore((s) => s.setScreen);
  const go = useStore((s) => s.go);
  const activeJob = useStore((s) => s.jobs.find((j) => j.id === s.activeJobId) || s.jobs[0]);

  const Screen = SCREENS[tab] || Dashboard;
  const pkgScoped = tab === "pkg" || tab === "resume" || tab === "qa" || tab === "mock" || tab === "records";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "236px 1fr", minHeight: "100vh" }}>
      {/* sidebar */}
      <aside style={{ background: "#fff", borderRight: "1px solid #eceae4", padding: "18px 14px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div onClick={() => setScreen("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 18, padding: "6px 8px 18px" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#5850ec", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'JetBrains Mono'" }}>P</div>
          ProofCV
        </div>
        <div style={sectionLabel}>职业资产</div>
        <NavItem tabKey="dashboard" label="工作台" />
        <NavItem tabKey="evidence" label="职业证据库" badge={String(evidenceCount)} />
        <div style={{ ...sectionLabel, padding: "16px 10px 6px" }}>求职作战</div>
        <NavItem tabKey="jobs" label="岗位列表" badge={String(jobsCount)} />
        <NavItem tabKey="pkg" label="岗位申请包" />
        <NavItem tabKey="resume" label="简历编辑器" />
        <NavItem tabKey="qa" label="面试 QA" />
        <NavItem tabKey="mock" label="模拟面试" />
        <NavItem tabKey="records" label="面试记录与复盘" badge={pendingSugs ? String(pendingSugs) : undefined} />
        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid #f0efe9", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 99, background: "#dcd9ff", color: "#5850ec", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>林</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>林深</div>
            <div style={{ fontSize: 11, color: "#8a919e" }}>演示账号 · 全栈工程师</div>
          </div>
        </div>
      </aside>

      {/* main */}
      <main style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 58, borderBottom: "1px solid #eceae4", background: "rgba(255,255,255,.78)", backdropFilter: "blur(12px) saturate(1.1)", WebkitBackdropFilter: "blur(12px) saturate(1.1)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{titles[tab] || "工作台"}</div>
            {pkgScoped && activeJob ? (
              <span style={{ fontSize: 12, color: "#5850ec", background: "#f1f0fb", padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
                {activeJob.company} · {activeJob.role.split("·")[0].trim()}
              </span>
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div onClick={() => go("import")} className="pcv-press" style={{ fontSize: 13, padding: "8px 14px", borderRadius: 9, background: "#5850ec", color: "#fff", fontWeight: 500, boxShadow: "0 4px 14px rgba(88,80,236,.24)" }}>+ 新增证据</div>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 28 }} key={tab}>
          <Screen />
        </div>
      </main>
    </div>
  );
}
