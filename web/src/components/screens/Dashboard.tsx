"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Pill, PrepPill } from "../ui";
import type { Tab } from "@/lib/types";

// 下一步行动引擎：按闭环顺序找出当前岗位最该做的一件事
function useNextAction() {
  const s = useStore();
  const j = s.jobs.find((x) => x.id === s.activeJobId) || s.jobs[0];
  const pendingEv = s.evidence.filter((e) => e.status !== "confirmed");
  const qa = s.qa[j.id] || [];
  const pendingSugs = s.records.flatMap((r) => r.suggestions.filter((x) => x.state === "pending").map((x) => ({ rec: r, sug: x })));
  const bullets = (s.resumes[j.id]?.exp || []).flatMap((x) => x.bullets);
  const openSuggestions = bullets.filter((b) => b.suggestion && !b.decision);

  if (pendingSugs.length)
    return { tab: "records" as Tab, title: "处理 " + pendingSugs.length + " 条复盘建议", desc: "最近一次真实面试的复盘产出了针对 QA / 简历 / 证据的修改建议，确认后它们会进入你的下一版准备。", label: "去确认建议 →" };
  if (!j.jd.trim() || !s.analyses[j.id])
    return { tab: "pkg" as Tab, title: "分析「" + j.company + "」的 JD", desc: "先拆解岗位要求，对照你的证据库，明确哪些重点写、哪些要弱化。", label: "去分析 JD →" };
  if (!s.resumes[j.id])
    return { tab: "resume" as Tab, title: "为「" + j.company + "」生成专属简历", desc: "基于已确认的职业证据生成，每一句都可追溯，不会编造数据。", label: "去生成简历 →" };
  if (openSuggestions.length)
    return { tab: "resume" as Tab, title: "处理简历中 " + openSuggestions.length + " 条 AI 建议", desc: "有改写建议等你决策：逐条接受、拒绝或修改，其中包含去夸大的风险修正。", label: "去处理建议 →" };
  if (!qa.length)
    return { tab: "qa" as Tab, title: "生成「" + j.company + "」的面试 QA", desc: "基于当前简历和证据，生成自我介绍、预测问题和高风险题清单。", label: "去生成 QA →" };
  if (s.qaStale[j.id])
    return { tab: "qa" as Tab, title: "简历已更新 · 刷新面试 QA", desc: "你修改过简历内容，相关 QA 可能已经过时，建议重新生成或逐条核对。", label: "去更新 QA →" };
  const riskQa = qa.filter((q) => q.prep === "risk" || (q.highRisk && q.prep !== "done"));
  if (riskQa.length)
    return { tab: "qa" as Tab, title: "补强 " + riskQa.length + " 道高风险题", desc: "「" + riskQa[0].q.slice(0, 26) + "…」等问题还没准备扎实，面试官大概率会问。", label: "去补答案 →" };
  if (!(s.mocks[j.id] || []).length || s.mockStale[j.id])
    return { tab: "mock" as Tab, title: s.mockStale[j.id] ? "简历已更新 · 再来一场模拟面试" : "来一场模拟面试", desc: "面试官会基于你的简历提问，优先追问面试钩子和历史薄弱点。", label: "开始模拟 →" };
  if (pendingEv.length)
    return { tab: "evidence" as Tab, title: "完善 " + pendingEv.length + " 张待确认证据卡", desc: "「" + pendingEv[0].title + "」等证据还未确认，确认后才能放心写进简历。", label: "去完善证据 →" };
  return { tab: "records" as Tab, title: "面试后上传录音复盘", desc: "准备已就绪。真实面试结束后上传录音，系统会转录、复盘并反哺下一版简历和 QA。", label: "去面试记录 →" };
}

function Stat({ label, val, sub, color }: { label: string; val: string; sub: string; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 900, fontFamily: "'JetBrains Mono'", color: color || "#16181d" }}>{val}</span>
        <span style={{ fontSize: 12, color: "#8a919e" }}>{sub}</span>
      </div>
    </div>
  );
}

const guideSteps: [string, Tab][] = [
  ["导入旧简历", "import"],
  ["访谈补全经历", "interview"],
  ["确认职业证据", "evidence"],
  ["导入岗位并分析", "jobs"],
  ["生成专属简历", "resume"],
  ["生成面试 QA", "qa"],
  ["模拟面试", "mock"],
  ["真实面试复盘", "records"],
];

export default function Dashboard() {
  const s = useStore();
  const go = useStore((x) => x.go);
  const openPackage = useStore((x) => x.openPackage);
  const next = useNextAction();

  const j = s.jobs.find((x) => x.id === s.activeJobId) || s.jobs[0];
  const confirmed = s.evidence.filter((e) => e.status === "confirmed").length;
  const pendingEv = s.evidence.filter((e) => e.status !== "confirmed");
  const qa = s.qa[j.id] || [];
  const todoQa = qa.filter((q) => q.prep === "todo" || q.prep === "risk");
  const lastRec = s.records.filter((r) => r.jobId === j.id).slice(-1)[0] || s.records.slice(-1)[0];
  const recJob = lastRec ? s.jobs.find((x) => x.id === lastRec.jobId) : null;

  return (
    <div style={{ animation: "pcvFade .3s ease both", maxWidth: 1080 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 26 }}>早上好，林深 👋</div>
        <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
          每准备一个岗位、参加一次面试，系统都会更了解你——下一次就准备得更充分。
        </div>
      </div>

      {/* 首次使用引导（可关闭） */}
      {!s.guideDismissed ? (
        <div style={{ background: "#fff", border: "1px solid #ddd9f7", borderRadius: 14, padding: "14px 18px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#5850ec" }}>第一次使用？这是一条完整闭环（当前为演示数据，可直接点通）</div>
            <div onClick={() => useStore.setState({ guideDismissed: true })} style={{ cursor: "pointer", fontSize: 12, color: "#a3a8b5" }}>知道了 ✕</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {guideSteps.map((g, i) => (
              <React.Fragment key={i}>
                <span onClick={() => go(g[1])} style={{ cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#4b5060", background: "#f5f5fa", padding: "5px 10px", borderRadius: 8 }}>
                  {i + 1} {g[0]}
                </span>
                {i < guideSteps.length - 1 ? <span style={{ color: "#c9ccd6", fontSize: 11 }}>→</span> : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : null}

      {/* 下一步行动 —— 你现在最应该继续做什么 */}
      <div style={{ background: "#16181d", color: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 18, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, color: "#9aa0b0", fontWeight: 700, letterSpacing: ".06em", marginBottom: 6 }}>你现在最应该继续做的</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 5 }}>{next.title}</div>
          <div style={{ fontSize: 12.5, color: "#c7cad5", lineHeight: 1.6 }}>{next.desc}</div>
        </div>
        <div onClick={() => go(next.tab)} style={{ cursor: "pointer", flexShrink: 0, background: "#5850ec", color: "#fff", fontWeight: 700, fontSize: 13.5, padding: "12px 20px", borderRadius: 11 }}>
          {next.label}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        <Stat label="职业证据" val={String(s.evidence.length)} sub={confirmed + " 张已确认"} />
        <Stat label="进行中岗位" val={String(s.jobs.length)} sub="个申请包" color="#5850ec" />
        <Stat label="待准备问题" val={String(todoQa.length)} sub={"当前岗位 · 共 " + qa.length + " 题"} color="#c2810c" />
        <Stat label="面试记录" val={String(s.records.length)} sub="次复盘" color="#12805c" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 当前正在准备的岗位 */}
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>当前正在准备的岗位</div>
              <div onClick={() => go("jobs")} style={{ cursor: "pointer", fontSize: 12.5, color: "#5850ec", fontWeight: 600 }}>全部岗位 →</div>
            </div>
            {s.jobs.map((x, i) => {
              const hasPkg = !!s.analyses[x.id];
              const hasResume = !!s.resumes[x.id];
              const hasQa = !!(s.qa[x.id] || []).length;
              const stage = !hasPkg ? "待分析 JD" : !hasResume ? "待生成简历" : !hasQa ? "待生成 QA" : "准备中";
              return (
                <div key={x.id} onClick={() => openPackage(x.id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i ? "1px solid #f2f2f6" : "none" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#16181d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{x.logo}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{x.company} <span style={{ fontWeight: 400, color: "#8a919e", fontSize: 12 }}>{x.role}</span></div>
                    <div style={{ fontSize: 11.5, color: x.id === j.id ? "#5850ec" : "#a3a8b5", marginTop: 2 }}>{x.statusLabel} · {stage}{x.id === j.id ? " · 当前" : ""}</div>
                  </div>
                  {x.match ? <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12.5, fontWeight: 700, color: "#5850ec" }}>{x.match}</span> : null}
                  <span style={{ color: "#c9ccd6" }}>→</span>
                </div>
              );
            })}
          </div>

          {/* 最近一次面试复盘 */}
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>最近一次面试复盘</div>
              <div onClick={() => go("records")} style={{ cursor: "pointer", fontSize: 12.5, color: "#5850ec", fontWeight: 600 }}>全部记录 →</div>
            </div>
            {lastRec ? (
              <div onClick={() => { useStore.setState({ activeRecordId: lastRec.id, recJobId: lastRec.jobId }); go("records"); }} style={{ cursor: "pointer" }}>
                <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 6 }}>{recJob ? recJob.company + " · " + recJob.role : ""} · {lastRec.date} · {lastRec.source}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.6, color: "#2f333d", marginBottom: 8 }}>{lastRec.verdict}</div>
                {lastRec.suggestions.filter((x) => x.state === "pending").length ? (
                  <div style={{ fontSize: 12, color: "#c2810c", background: "#fdf7ec", borderRadius: 9, padding: "7px 11px" }}>
                    ⚠ {lastRec.suggestions.filter((x) => x.state === "pending").length} 条修改建议待你确认 →
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#12805c" }}>✓ 复盘建议均已处理</div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: "#a3a8b5", lineHeight: 1.7 }}>还没有面试记录。真实面试后上传录音，系统会转录、复盘并反哺你的简历和 QA。</div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 待完善的职业证据 */}
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>待完善的证据</div>
              <div onClick={() => go("evidence")} style={{ cursor: "pointer", fontSize: 12.5, color: "#5850ec", fontWeight: 600 }}>证据库 →</div>
            </div>
            {pendingEv.length ? (
              pendingEv.slice(0, 3).map((e, i) => (
                <div key={e.id} style={{ padding: "10px 0", borderTop: i ? "1px solid #f2f2f6" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>{e.title}</div>
                    <Pill status={e.status} />
                  </div>
                  {e.note ? <div style={{ fontSize: 11.5, color: "#c2810c", marginTop: 4, lineHeight: 1.5 }}>{e.note}</div> : null}
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12.5, color: "#12805c" }}>✓ 所有证据都已确认</div>
            )}
          </div>

          {/* 待准备的问题 */}
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>待准备的问题</div>
              <div onClick={() => go("qa")} style={{ cursor: "pointer", fontSize: 12.5, color: "#5850ec", fontWeight: 600 }}>面试 QA →</div>
            </div>
            {todoQa.length ? (
              todoQa.slice(0, 4).map((q, i) => (
                <div key={q.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", padding: "9px 0", borderTop: i ? "1px solid #f2f2f6" : "none" }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#2f333d" }}>{q.q}</div>
                  <PrepPill prep={q.prep} />
                </div>
              ))
            ) : qa.length ? (
              <div style={{ fontSize: 12.5, color: "#12805c" }}>✓ 当前岗位的问题都已在准备中</div>
            ) : (
              <div style={{ fontSize: 12.5, color: "#a3a8b5", lineHeight: 1.7 }}>当前岗位还没有生成 QA。</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
