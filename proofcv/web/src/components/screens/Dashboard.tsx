"use client";

import React from "react";
import { useStore, prepDone } from "@/lib/store";
import { Btn, PrepPill } from "../ui";
import type { Tab } from "@/lib/types";

// 下一步行动引擎：按闭环顺序找出用户现在最该做的一件事
function useNextAction() {
  const s = useStore();

  // 还没有整理任何经历——从导入旧简历开始
  if (!s.evidence.length)
    return { tab: "evidence" as Tab, title: "先整理你的经历", desc: "有旧简历就上传（TXT / Markdown / PDF 都行，本地解析），没有就用 AI 访谈从零整理。", label: "去整理经历 →" };

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
    return { tab: "pkg" as Tab, title: "下一步：分析「" + j.company + "」这个岗位", desc: "先拆解岗位要求，对照你整理好的经历，明确哪些重点写、哪些要弱化、哪些不能夸大。", label: "去分析岗位 →" };
  if (!s.resumes[j.id])
    return { tab: "resume" as Tab, title: "下一步：生成岗位专属简历", desc: "基于已确认的经历为「" + j.company + "」定制简历，每一句都可追溯，不会编造数据。", label: "去定制简历 →" };
  if (openSuggestions.length)
    return { tab: "resume" as Tab, title: "处理简历中 " + openSuggestions.length + " 条修改建议", desc: "有改写建议等你决策：逐条接受、拒绝或修改，其中包含去夸大的风险修正。", label: "去处理建议 →" };
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
  return { tab: "records" as Tab, title: "下一步：复盘真实面试", desc: "准备已就绪。真实面试结束后把转写文本粘贴进来，复盘结果经你确认后反哺下一版简历和面试问题。", label: "去面试后复盘 →" };
}

/** 全新用户的空白起点：只有三步说明和两个入口，不预置任何数据 */
function BlankStart() {
  const go = useStore((s) => s.go);
  const loadDemo = useStore((s) => s.loadDemo);
  const steps: [string, string][] = [
    ["整理经历", "上传旧简历，或用 AI 访谈从零整理——每段经历都标注来源和确认状态"],
    ["添加岗位并分析", "粘贴目标岗位 JD，看清哪些经历重点写、哪些不能夸大"],
    ["生成简历和面试准备", "岗位专属简历 + 面试 QA + 模拟面试 + 真实面试复盘，一轮比一轮准"],
  ];
  return (
    <div style={{ maxWidth: 660, margin: "40px auto 0", textAlign: "center" }}>
      <div style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 28, marginBottom: 10 }}>从整理你的经历开始</div>
      <div style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
        Telos 帮你把做过的事整理成站得住脚的证据，再针对每个岗位生成简历和面试准备。
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 28 }}>
        {steps.map((st, i) => (
          <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "#fff", border: "1px solid #eceae4", borderRadius: 14, padding: "14px 18px" }}>
            <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: "#5850ec", fontSize: 13, marginTop: 1 }}>0{i + 1}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{st[0]}</div>
              <div style={{ fontSize: 12.5, color: "#8a919e", lineHeight: 1.6, marginTop: 2 }}>{st[1]}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Btn label="我有旧简历 · 上传整理 →" onClick={() => go("import")} />
        <Btn label="我没有简历 · AI 从零整理 →" kind="dark" onClick={() => go("interview")} />
      </div>
      <div style={{ marginTop: 18, fontSize: 12.5, color: "#8a919e" }}>
        想先看看完整长什么样？<span onClick={loadDemo} className="pcv-link" style={{ fontWeight: 600 }}>加载演示数据</span>（示例账号，随时可退出清空）
      </div>
      <div style={{ marginTop: 26, fontSize: 11.5, color: "#a3a8b5", lineHeight: 1.7 }}>
        你的职业资料属于你，不属于平台——所有内容只保存在本机浏览器，用 AI 时才临时发送所需内容，不在服务端保存。
      </div>
    </div>
  );
}

export default function Dashboard() {
  const s = useStore();
  const go = useStore((x) => x.go);
  const openResume = useStore((x) => x.openResume);
  const openPackage = useStore((x) => x.openPackage);
  const next = useNextAction();
  // 「下一步」引擎只会在有岗位时指向简历，那都是岗位定制版
  const goNext = (t: Tab) => (t === "resume" ? openResume("job") : go(t));

  // 全新用户（无任何数据、非演示）：只显示三步说明和两个入口
  if (!s.evidence.length && !s.jobs.length && !s.records.length && !s.demoMode) {
    return <BlankStart />;
  }

  const j = s.jobs.find((x) => x.id === s.activeJobId) || s.jobs[0] || null;
  const qa = j ? s.qa[j.id] || [] : [];
  const riskQa = qa.filter((q) => q.prep === "risk" || (q.highRisk && q.prep !== "done"));
  const lastRec = j ? s.records.filter((r) => r.jobId === j.id).slice(-1)[0] || s.records.slice(-1)[0] : s.records.slice(-1)[0];
  const lastMock = j ? (s.mocks[j.id] || []).slice(-1)[0] : null;
  const recJob = lastRec ? s.jobs.find((x) => x.id === lastRec.jobId) : null;
  const done = j ? prepDone(s, j.id) : 0;
  const lastTab = s.lastWorkTab;
  const titles: Partial<Record<Tab, string>> = {
    import: "导入旧简历", interview: "AI 访谈", evidence: "整理我的经历", jobs: "岗位与进度",
    pkg: "准备这个岗位", resume: "定制简历", qa: "面试问题", mock: "模拟面试", records: "面试后复盘",
  };

  return (
    <div style={{ position: "relative" }}>
      {/* 极浅环境色斑：与首页一致 */}
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -60, right: "-6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(88,80,236,.08), transparent)" }} />
        <div style={{ position: "absolute", top: 380, left: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(232,137,107,.06), transparent)" }} />
      </div>

      <div className="pcv-fade" style={{ marginBottom: 18, position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 26 }}>
            {s.profile.name ? "你好，" + s.profile.name + " 👋" : "开始准备 👋"}
          </div>
          <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
            每准备一个岗位、参加一次面试，下一次都会准备得更充分。
          </div>
        </div>
        {lastTab && lastTab !== "dashboard" ? (
          <span onClick={() => go(lastTab)} className="pcv-link" style={{ fontSize: 12.5, fontWeight: 600 }}>
            继续上次工作：{titles[lastTab] || lastTab} →
          </span>
        ) : null}
      </div>

      {/* 今天最该做的一件事 */}
      <div className="pcv-fade" style={{ position: "relative", background: "#16181d", color: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 18, display: "flex", alignItems: "center", gap: 18, animationDelay: ".08s" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10.5, color: "#9aa0b0", letterSpacing: ".1em", marginBottom: 7 }}>今天最该做的一件事</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 5 }}>{next.title}</div>
          <div style={{ fontSize: 12.5, color: "#c7cad5", lineHeight: 1.6 }}>{next.desc}</div>
        </div>
        <div onClick={() => goNext(next.tab)} className="pcv-press" style={{ flexShrink: 0, background: "#5850ec", color: "#fff", fontWeight: 700, fontSize: 13.5, padding: "12px 20px", borderRadius: 11, boxShadow: "0 6px 18px rgba(88,80,236,.35)" }}>
          {next.label}
        </div>
      </div>

      <div className="pcv-fade" style={{ position: "relative", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, animationDelay: ".16s" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 当前岗位 + 准备完成度 */}
          <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>当前岗位</div>
              <div onClick={() => go("jobs")} className="pcv-link" style={{ fontSize: 12.5 }}>全部岗位 →</div>
            </div>
            {j ? (
              <div onClick={() => openPackage(j.id)} className="pcv-row" style={{ padding: "6px 10px", margin: "0 -10px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: "#16181d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>{j.logo}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{j.company} <span style={{ fontWeight: 400, color: "#8a919e", fontSize: 12.5 }}>{j.role}</span></div>
                    <div style={{ fontSize: 11.5, color: "#8a919e", marginTop: 2 }}>投递进度：<b style={{ color: "#5850ec" }}>{j.statusLabel}</b></div>
                  </div>
                  <span style={{ color: "#c9ccd6" }}>→</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#8a919e", marginBottom: 4 }}>
                    <span>准备完成度（分析 / 简历 / 问题 / 模拟 / 复盘）</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: "#16181d" }}>{done}/5</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} style={{ flex: 1, height: 6, borderRadius: 99, background: i < done ? "#5850ec" : "#eceae4" }} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: "#a3a8b5", lineHeight: 1.7 }}>
                还没有目标岗位。<span onClick={() => go("jobs")} className="pcv-link">去添加 →</span>
              </div>
            )}
          </div>

          {/* 最近一次模拟或复盘 */}
          <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>最近一次模拟 / 复盘</div>
              <div onClick={() => go("records")} className="pcv-link" style={{ fontSize: 12.5 }}>全部记录 →</div>
            </div>
            {lastRec ? (
              <div onClick={() => { useStore.setState({ activeRecordId: lastRec.id, recJobId: lastRec.jobId }); go("records"); }} className="pcv-row" style={{ padding: "8px 10px", margin: "0 -10px", cursor: "pointer" }}>
                <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 6 }}>真实面试复盘 · {recJob ? recJob.company : ""} · {lastRec.date}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.6, color: "#2f333d", marginBottom: 8 }}>{lastRec.verdict}</div>
                {lastRec.suggestions.filter((x) => x.state === "pending").length ? (
                  <div style={{ fontSize: 12, color: "#c2810c", background: "#fdf7ec", borderRadius: 9, padding: "7px 11px" }}>
                    ⚠ {lastRec.suggestions.filter((x) => x.state === "pending").length} 条修改建议待你确认 →
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#12805c" }}>✓ 复盘建议均已处理</div>
                )}
              </div>
            ) : lastMock?.report ? (
              <div onClick={() => go("mock")} className="pcv-row" style={{ padding: "8px 10px", margin: "0 -10px", cursor: "pointer" }}>
                <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 6 }}>模拟面试 · {lastMock.date}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "#2f333d" }}>{lastMock.report.overall}</div>
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: "#a3a8b5", lineHeight: 1.7 }}>还没有模拟或复盘记录。准备好简历后先来一场模拟面试。</div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 高风险问题 */}
          <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>高风险问题</div>
              <div onClick={() => go("qa")} className="pcv-link" style={{ fontSize: 12.5 }}>面试问题 →</div>
            </div>
            {riskQa.length ? (
              riskQa.slice(0, 4).map((q, i) => (
                <div key={q.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", padding: "9px 0", borderTop: i ? "1px solid #f4f2ec" : "none" }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#2f333d" }}>{q.q}</div>
                  <PrepPill prep={q.prep} />
                </div>
              ))
            ) : qa.length ? (
              <div style={{ fontSize: 12.5, color: "#12805c" }}>✓ 当前岗位没有待补的高风险题</div>
            ) : (
              <div style={{ fontSize: 12.5, color: "#a3a8b5", lineHeight: 1.7 }}>当前岗位还没有生成面试问题。</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
