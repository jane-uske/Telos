"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { useAiConfig, aiConfigured } from "@/lib/aiConfig";
import { useAuth } from "@/lib/apiClient";
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
import Settings from "./screens/Settings";
import BrandMark from "./BrandMark";
import { AccountBox } from "./AuthGate";

const titles: Record<Tab, string> = {
  dashboard: "开始准备",
  import: "导入旧简历",
  interview: "AI 访谈整理经历",
  evidence: "整理我的经历",
  jobs: "岗位与进度",
  pkg: "准备这个岗位",
  resume: "定制简历",
  qa: "面试问题",
  mock: "模拟面试",
  records: "面试后复盘",
  settings: "设置",
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
  settings: Settings,
};

function NavItem({ tabKey, label, badge, highlight, before }: { tabKey: Tab; label: string; badge?: string; highlight?: boolean; before?: () => void }) {
  const active = useStore((s) => s.screen === "app" && s.tab === tabKey);
  const go = useStore((s) => s.go);
  return (
    <div
      onClick={() => {
        before?.();
        go(tabKey);
      }}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 10px",
        borderRadius: 9,
        fontSize: 13.5,
        marginBottom: 2,
        fontWeight: active || highlight ? 700 : 400,
        background: active ? "#f1f0fb" : highlight ? "#fdf7ec" : "transparent",
        color: active ? "#5850ec" : highlight ? "#a3690f" : "#4b5060",
        transition: "background .2s ease, color .2s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLDivElement).style.background = highlight ? "#fbeed9" : "#f5f5fa";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLDivElement).style.background = highlight ? "#fdf7ec" : "transparent";
      }}
    >
      <span>{label}</span>
      {badge ? (
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, background: "#f1f0fb", color: highlight ? "#a3690f" : "#5850ec", padding: "1px 7px", borderRadius: 99 }}>{badge}</span>
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
  const demoMode = useStore((s) => s.demoMode);
  const exitDemo = useStore((s) => s.exitDemo);
  const activeJob = useStore((s) => s.jobs.find((j) => j.id === s.activeJobId) || s.jobs[0] || null);
  const byok = useAiConfig((s) => aiConfigured(s));
  const loggedIn = useAuth((s) => !!s.token);
  // 首次进入产品（还没点掉工作台的新手引导）时，把「整理我的经历」当作起点高亮出来
  const firstTime = useStore((s) => !s.guideDismissed && !s.evidence.length);

  const Screen = SCREENS[tab] || Dashboard;
  const baseResume = useStore((s) => s.resumeScope === "base" || !s.jobs.length);
  // 通用简历不属于任何岗位，顶栏不该显示岗位名，标题也换成「我的简历」
  const onBaseResume = tab === "resume" && baseResume;
  const pkgScoped = !onBaseResume && (tab === "pkg" || tab === "resume" || tab === "qa" || tab === "mock" || tab === "records");
  const aiBadge = byok ? "自带 Key" : loggedIn ? "在线 AI" : "基础模式";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "236px 1fr", minHeight: "100vh" }}>
      {/* sidebar */}
      <aside className="rr-no-print" style={{ background: "#fff", borderRight: "1px solid #eceae4", padding: "18px 14px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div onClick={() => setScreen("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 18, padding: "6px 8px 14px", letterSpacing: "-.02em" }}>
          <BrandMark size={28} />
          Telos
        </div>

        {demoMode ? (
          <div style={{ margin: "0 0 12px", border: "1px solid #f3e2bd", background: "#fdf7ec", borderRadius: 11, padding: "9px 11px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#a3690f" }}>◎ 演示模式</div>
            <div style={{ fontSize: 11, color: "#a3690f", opacity: 0.85, lineHeight: 1.55, margin: "3px 0 6px" }}>当前全部是示例数据，不会和你的真实数据混在一起。</div>
            <span onClick={exitDemo} className="pcv-link" style={{ fontSize: 11.5, fontWeight: 700 }}>退出演示并清空示例数据 →</span>
          </div>
        ) : null}

        <NavItem tabKey="dashboard" label="开始准备" />

        <div style={sectionLabel}>整理我的经历</div>
        <NavItem tabKey="evidence" label="我的经历" badge={firstTime ? "从这里开始" : String(evidenceCount)} highlight={firstTime && tab !== "evidence"} />
        {/* 通用简历：不绑定岗位，没有目标岗位时也能写 */}
        <NavItem tabKey="resume" label="我的简历" before={() => useStore.setState({ resumeScope: "base" })} />

        <div style={{ ...sectionLabel, padding: "16px 10px 6px" }}>岗位与进度</div>
        <NavItem tabKey="jobs" label="岗位与进度" badge={String(jobsCount)} />

        {/* 准备这个岗位：核心流程入口，进入后内部展示岗位分析、匹配、简历与面试问题 */}
        <div style={{ marginTop: 12, border: "1px solid #e6e2f7", background: "#faf9ff", borderRadius: 12, padding: "8px 6px 6px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px 8px" }}>
            <span style={{ fontSize: 10.5, letterSpacing: ".05em", color: "#a3a8b5", fontWeight: 700 }}>当前岗位</span>
            <span onClick={() => go("jobs")} className="pcv-link" style={{ fontSize: 11 }}>切换</span>
          </div>
          {activeJob ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px 10px" }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: "#16181d", color: "#fff", fontSize: 11.5, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>{activeJob.logo}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeJob.company}</div>
                <div style={{ fontSize: 10.5, color: "#8a919e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeJob.role}</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "0 6px 10px", fontSize: 11.5, color: "#a3a8b5", lineHeight: 1.5 }}>还没有目标岗位</div>
          )}
          <NavItem tabKey="pkg" label="准备这个岗位" />
        </div>

        <div style={{ ...sectionLabel, padding: "16px 10px 6px" }}>练习与复盘</div>
        <NavItem tabKey="mock" label="模拟面试" />
        <NavItem tabKey="records" label="面试后复盘" badge={pendingSugs ? String(pendingSugs) : undefined} />

        <div style={{ ...sectionLabel, padding: "16px 10px 6px" }}>系统</div>
        <NavItem tabKey="settings" label="设置" badge={aiBadge} />
        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid #f0efe9" }}>
          <AccountBox />
        </div>
      </aside>

      {/* main */}
      <main style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div className="rr-no-print" style={{ height: 58, borderBottom: "1px solid #eceae4", background: "rgba(255,255,255,.78)", backdropFilter: "blur(12px) saturate(1.1)", WebkitBackdropFilter: "blur(12px) saturate(1.1)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{onBaseResume ? "我的简历" : titles[tab] || "开始准备"}</div>
            {pkgScoped && activeJob ? (
              <span style={{ fontSize: 12, color: "#5850ec", background: "#f1f0fb", padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
                {activeJob.company} · {activeJob.role.split("·")[0].trim()}
              </span>
            ) : null}
            {demoMode ? (
              <span style={{ fontSize: 11.5, color: "#a3690f", background: "#fdf3e0", padding: "3px 10px", borderRadius: 99, fontWeight: 700 }}>演示模式</span>
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div onClick={() => go("import")} className="pcv-press" style={{ fontSize: 13, padding: "8px 14px", borderRadius: 9, background: "#5850ec", color: "#fff", fontWeight: 500, boxShadow: "0 4px 14px rgba(88,80,236,.24)" }}>+ 整理新经历</div>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "28px 36px" }} key={tab}>
          {/* 内容列与首页容器对齐：加宽并居中，避免宽屏右侧留白 */}
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <Screen />
          </div>
        </div>
      </main>
    </div>
  );
}
