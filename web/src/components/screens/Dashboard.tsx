"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Pill, PrepPill } from "../ui";
import type { Tab } from "@/lib/types";

// 下一步行动引擎：按闭环顺序找出用户现在最该做的一件事
function useNextAction() {
  const s = useStore();

  // 还没有整理任何经历——从导入旧简历开始
  if (!s.evidence.length)
    return { tab: "import" as Tab, title: "先导入一份旧简历", desc: "把你已有的简历粘贴进来，AI 会拆解出工作经历、项目和技能，作为整理经历的起点。", label: "去导入旧简历 →" };

  // 经历整理好了，但还没有目标岗位
  if (!s.jobs.length)
    return { tab: "jobs" as Tab, title: "下一步：添加目标岗位", desc: "经历已经整理得差不多了。挑一个你真正想投的岗位，粘贴 JD 就能开始准备。", label: "去添加目标岗位 →" };

  const j = s.jobs.find((x) => x.id === s.activeJobId) || s.jobs[0];
  const pendingEv = s.evidence.filter((e) => e.status !== "confirmed");
  const qa = s.qa[j.id] || [];
  const pendingSugs = s.records.flatMap((r) => r.suggestions.filter((x) => x.state === "pending").map((x) => ({ rec: r, sug: x })));
  const bullets = (s.resumes[j.id]?.exp || []).flatMap((x) => x.bullets);
  const openSuggestions = bullets.filter((b) => b.suggestion && !b.decision);

  if (pendingSugs.length)
    return { tab: "records" as Tab, title: "处理 " + pendingSugs.length + " 条复盘建议", desc: "最近一次真实面试的复盘产出了针对面试问题 / 简历 / 经历的修改建议，确认后它们会进入你的下一版准备。", label: "去确认建议 →" };
  if (!j.jd.trim() || !s.analyses[j.id])
    return { tab: "pkg" as Tab, title: "下一步：准备这个岗位", desc: "先拆解「" + j.company + "」的岗位要求，对照你整理好的经历，明确哪些重点写、哪些要弱化。", label: "去准备这个岗位 →" };
  if (!s.resumes[j.id])
    return { tab: "resume" as Tab, title: "下一步：准备这个岗位", desc: "基于已确认的经历为「" + j.company + "」定制简历，每一句都可追溯，不会编造数据。", label: "去定制简历 →" };
  if (openSuggestions.length)
    return { tab: "resume" as Tab, title: "处理简历中 " + openSuggestions.length + " 条 AI 建议", desc: "有改写建议等你决策：逐条接受、拒绝或修改，其中包含去夸大的风险修正。", label: "去处理建议 →" };
  if (!qa.length)
    return { tab: "qa" as Tab, title: "下一步：准备面试问题", desc: "基于当前简历和经历，生成自我介绍、预测问题和高风险题清单。", label: "去准备面试问题 →" };
  if (s.qaStale[j.id])
    return { tab: "qa" as Tab, title: "简历已更新 · 刷新面试问题", desc: "你修改过简历内容，相关问题可能已经过时，建议重新生成或逐条核对。", label: "去更新 →" };
  const riskQa = qa.filter((q) => q.prep === "risk" || (q.highRisk && q.prep !== "done"));
  if (riskQa.length)
    return { tab: "qa" as Tab, title: "补强 " + riskQa.length + " 道高风险题", desc: "「" + riskQa[0].q.slice(0, 26) + "…」等问题还没准备扎实，面试官大概率会问。", label: "去补答案 →" };
  if (!(s.mocks[j.id] || []).length || s.mockStale[j.id])
    return { tab: "mock" as Tab, title: s.mockStale[j.id] ? "简历已更新 · 再来一场模拟面试" : "来一场模拟面试", desc: "面试官会基于你的简历提问，优先追问面试钩子和历史薄弱点。", label: "开始模拟 →" };
  if (pendingEv.length)
    return { tab: "evidence" as Tab, title: "完善 " + pendingEv.length + " 条待确认的经历", desc: "「" + pendingEv[0].title + "」等经历还未确认，确认后才能放心写进简历。", label: "去完善经历 →" };
  return { tab: "records" as Tab, title: "下一步：复盘本次面试", desc: "准备已就绪。真实面试结束后来这里上传录音，系统会转录、复盘并反哺下一版简历和面试问题。", label: "去面试后复盘 →" };
}

function Stat({ label, val, sub, color }: { label: string; val: string; sub: string; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10.5, letterSpacing: ".08em", color: "#a3a8b5", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 30, fontWeight: 900, fontFamily: "'JetBrains Mono'", color: color || "#16181d" }}>{val}</span>
        <span style={{ fontSize: 12, color: "#8a919e" }}>{sub}</span>
      </div>
    </div>
  );
}

const guideSteps: [string, Tab][] = [
  ["导入旧简历", "import"],
  ["AI 访谈补全经历", "interview"],
  ["整理好我的经历", "evidence"],
  ["添加目标岗位", "jobs"],
  ["定制简历", "resume"],
  ["准备面试问题", "qa"],
  ["模拟面试", "mock"],
  ["面试后复盘", "records"],
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
    <div style={{ position: "relative" }}>
      {/* 极浅环境色斑：与首页一致，给毛玻璃卡提供可模糊的层次 */}
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -60, right: "-6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(88,80,236,.08), transparent)" }} />
        <div style={{ position: "absolute", top: 380, left: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(232,137,107,.06), transparent)" }} />
      </div>
      <div className="pcv-fade" style={{ marginBottom: 18, position: "relative" }}>
        <div style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 26 }}>早上好，林深 👋</div>
        <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
          每准备一个岗位、参加一次面试，系统都会更了解你——下一次就准备得更充分。
        </div>
      </div>

      {/* 首次使用引导（可关闭）——浮层提示卡，与首页毛玻璃语言一致 */}
      {!s.guideDismissed ? (
        <div className="hv-glass pcv-fade" style={{ position: "relative", borderRadius: 14, padding: "14px 18px", marginBottom: 18, animationDelay: ".06s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#5850ec" }}>第一次使用？这是一条完整闭环（当前为演示数据，可直接点通）</div>
            <div onClick={() => useStore.setState({ guideDismissed: true })} className="pcv-link" style={{ fontSize: 12, color: "#a3a8b5", fontWeight: 400 }}>知道了 ✕</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {guideSteps.map((g, i) => (
              <React.Fragment key={i}>
                <span onClick={() => go(g[1])} className="pcv-press" style={{ fontSize: 12, fontWeight: 600, color: "#4b5060", background: "#fff", border: "1px solid #eceae4", padding: "5px 10px", borderRadius: 8 }}>
                  {i + 1} {g[0]}
                </span>
                {i < guideSteps.length - 1 ? <span style={{ color: "#c9c4b8", fontSize: 11 }}>→</span> : null}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : null}

      {/* 下一步行动 —— 你现在最应该继续做什么 */}
      <div className="pcv-fade" style={{ position: "relative", background: "#16181d", color: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 18, display: "flex", alignItems: "center", gap: 18, animationDelay: ".12s" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10.5, color: "#9aa0b0", letterSpacing: ".1em", marginBottom: 7 }}>你现在最应该继续做的</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 5 }}>{next.title}</div>
          <div style={{ fontSize: 12.5, color: "#c7cad5", lineHeight: 1.6 }}>{next.desc}</div>
        </div>
        <div onClick={() => go(next.tab)} className="pcv-press" style={{ flexShrink: 0, background: "#5850ec", color: "#fff", fontWeight: 700, fontSize: 13.5, padding: "12px 20px", borderRadius: 11, boxShadow: "0 6px 18px rgba(88,80,236,.35)" }}>
          {next.label}
        </div>
      </div>

      <div className="pcv-fade" style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18, animationDelay: ".18s" }}>
        <Stat label="我的经历" val={String(s.evidence.length)} sub={confirmed + " 条已确认"} />
        <Stat label="目标岗位" val={String(s.jobs.length)} sub="个在准备中" color="#5850ec" />
        <Stat label="待准备问题" val={String(todoQa.length)} sub={"当前岗位 · 共 " + qa.length + " 题"} color="#c2810c" />
        <Stat label="面试记录" val={String(s.records.length)} sub="次复盘" color="#12805c" />
      </div>

      <div className="pcv-fade" style={{ position: "relative", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, animationDelay: ".24s" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 当前正在准备的岗位 */}
          <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>当前正在准备的岗位</div>
              <div onClick={() => go("jobs")} className="pcv-link" style={{ fontSize: 12.5 }}>全部岗位 →</div>
            </div>
            {s.jobs.map((x, i) => {
              const hasPkg = !!s.analyses[x.id];
              const hasResume = !!s.resumes[x.id];
              const hasQa = !!(s.qa[x.id] || []).length;
              const stage = !hasPkg ? "待分析 JD" : !hasResume ? "待生成简历" : !hasQa ? "待生成面试问题" : "准备中";
              return (
                <div key={x.id} onClick={() => openPackage(x.id)} className="pcv-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 10px", margin: "0 -10px", borderTop: i ? "1px solid #f4f2ec" : "none" }}>
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
          <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>最近一次面试复盘</div>
              <div onClick={() => go("records")} className="pcv-link" style={{ fontSize: 12.5 }}>全部记录 →</div>
            </div>
            {lastRec ? (
              <div onClick={() => { useStore.setState({ activeRecordId: lastRec.id, recJobId: lastRec.jobId }); go("records"); }} className="pcv-row" style={{ padding: "8px 10px", margin: "0 -10px" }}>
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
              <div style={{ fontSize: 12.5, color: "#a3a8b5", lineHeight: 1.7 }}>还没有面试记录。真实面试后上传录音，系统会转录、复盘并反哺你的简历和面试问题。</div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 待完善的经历 */}
          <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>待完善的经历</div>
              <div onClick={() => go("evidence")} className="pcv-link" style={{ fontSize: 12.5 }}>我的经历 →</div>
            </div>
            {pendingEv.length ? (
              pendingEv.slice(0, 3).map((e, i) => (
                <div key={e.id} style={{ padding: "10px 0", borderTop: i ? "1px solid #f4f2ec" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>{e.title}</div>
                    <Pill status={e.status} />
                  </div>
                  {e.note ? <div style={{ fontSize: 11.5, color: "#c2810c", marginTop: 4, lineHeight: 1.5 }}>{e.note}</div> : null}
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12.5, color: "#12805c" }}>✓ 所有经历都已确认</div>
            )}
          </div>

          {/* 待准备的问题 */}
          <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>待准备的问题</div>
              <div onClick={() => go("qa")} className="pcv-link" style={{ fontSize: 12.5 }}>面试问题 →</div>
            </div>
            {todoQa.length ? (
              todoQa.slice(0, 4).map((q, i) => (
                <div key={q.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", padding: "9px 0", borderTop: i ? "1px solid #f4f2ec" : "none" }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#2f333d" }}>{q.q}</div>
                  <PrepPill prep={q.prep} />
                </div>
              ))
            ) : qa.length ? (
              <div style={{ fontSize: 12.5, color: "#12805c" }}>✓ 当前岗位的问题都已在准备中</div>
            ) : (
              <div style={{ fontSize: 12.5, color: "#a3a8b5", lineHeight: 1.7 }}>当前岗位还没有生成面试问题。</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
