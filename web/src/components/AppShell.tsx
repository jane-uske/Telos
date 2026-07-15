"use client";

import React from "react";
import { useStore } from "@/lib/store";
import type { Tab } from "@/lib/types";

import Dashboard from "./screens/Dashboard";
import Import from "./screens/Import";
import Interview from "./screens/Interview";
import Evidence from "./screens/Evidence";
import Github from "./screens/Github";
import Jobs from "./screens/Jobs";
import Jd from "./screens/Jd";
import Resume from "./screens/Resume";
import Materials from "./screens/Materials";
import Pipeline from "./screens/Pipeline";
import Review from "./screens/Review";
import Market from "./screens/Market";
import Settings from "./screens/Settings";

const titles: Record<Tab, string> = {
  dashboard: "工作台",
  import: "简历导入与解析",
  interview: "AI 职业访谈",
  evidence: "职业证据库",
  github: "GitHub 项目导入",
  jobs: "岗位管理",
  jd: "JD 分析与证据匹配",
  resume: "定制简历生成",
  materials: "求职材料中心",
  pipeline: "求职进度",
  review: "面试复盘",
  market: "岗位市场分析",
  settings: "账号与隐私",
};

const SCREENS: Record<Tab, React.ComponentType> = {
  dashboard: Dashboard,
  import: Import,
  interview: Interview,
  evidence: Evidence,
  github: Github,
  jobs: Jobs,
  jd: Jd,
  resume: Resume,
  materials: Materials,
  pipeline: Pipeline,
  review: Review,
  market: Market,
  settings: Settings,
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
  const setScreen = useStore((s) => s.setScreen);
  const go = useStore((s) => s.go);

  const Screen = SCREENS[tab] || Dashboard;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "236px 1fr", minHeight: "100vh" }}>
      {/* sidebar */}
      <aside style={{ background: "#fff", borderRight: "1px solid #ececf2", padding: "18px 14px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div onClick={() => setScreen("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 18, padding: "6px 8px 18px" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#5850ec", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'JetBrains Mono'" }}>P</div>
          ProofCV
        </div>
        <div style={sectionLabel}>职业资产</div>
        <NavItem tabKey="dashboard" label="工作台" />
        <NavItem tabKey="import" label="简历导入" />
        <NavItem tabKey="interview" label="AI 职业访谈" />
        <NavItem tabKey="evidence" label="职业证据库" badge={String(evidenceCount)} />
        <NavItem tabKey="github" label="GitHub 导入" />
        <div style={{ ...sectionLabel, padding: "16px 10px 6px" }}>求职作战</div>
        <NavItem tabKey="market" label="岗位市场" />
        <NavItem tabKey="jobs" label="岗位管理" badge={String(jobsCount)} />
        <NavItem tabKey="jd" label="JD 匹配工作台" />
        <NavItem tabKey="resume" label="定制简历" />
        <NavItem tabKey="materials" label="求职材料" />
        <NavItem tabKey="review" label="面试复盘" />
        <NavItem tabKey="pipeline" label="求职进度" />
        <NavItem tabKey="settings" label="账号与隐私" />
        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid #f0f0f5", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 99, background: "#dcd9ff", color: "#5850ec", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>林</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>林深</div>
            <div style={{ fontSize: 11, color: "#8a919e" }}>演示账号 · 全栈工程师</div>
          </div>
          <div onClick={() => go("settings")} style={{ cursor: "pointer", color: "#a3a8b5" }} title="设置">⚙</div>
        </div>
      </aside>

      {/* main */}
      <main style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 58, borderBottom: "1px solid #ececf2", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 5 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{titles[tab] || "工作台"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div onClick={() => setScreen("publicProfile")} style={{ cursor: "pointer", fontSize: 13, color: "#5850ec", fontWeight: 500 }}>查看我的公开主页 ↗</div>
            <div onClick={() => go("import")} style={{ cursor: "pointer", fontSize: 13, padding: "8px 14px", borderRadius: 9, background: "#5850ec", color: "#fff", fontWeight: 500 }}>+ 新增证据</div>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 28 }} key={tab}>
          <Screen />
        </div>
      </main>
    </div>
  );
}
