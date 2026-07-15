"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Spinner, JobChips } from "../ui";
import type { Analysis, Match, Tab } from "@/lib/types";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

/** 与首页一致的编号小节头：短横线 + mono 编号 + 标题 */
function SectionHead({ no, title, desc }: { no: string; title: string; desc?: string }) {
  return (
    <div style={{ margin: "6px 0 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 16, height: 1, background: "#5850ec", display: "inline-block" }} />
        <span style={{ ...mono, fontSize: 11, color: "#5850ec", letterSpacing: ".1em" }}>{no}</span>
        <span style={{ fontWeight: 800, fontSize: 15 }}>{title}</span>
      </div>
      {desc ? <div style={{ fontSize: 12, color: "#8a919e", marginTop: 5, marginLeft: 25 }}>{desc}</div> : null}
    </div>
  );
}

type StepState = "done" | "warn" | "todo";

/** 准备进度流水线中的一步：整卡可点，状态一目了然 */
function Step({
  n,
  title,
  state,
  line,
  warn,
  onOpen,
}: {
  n: string;
  title: string;
  state: StepState;
  line: string;
  warn?: string | null;
  onOpen: () => void;
}) {
  const icon =
    state === "done" ? (
      <span style={{ width: 18, height: 18, borderRadius: 99, background: "#e6f5ee", color: "#12805c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</span>
    ) : state === "warn" ? (
      <span style={{ width: 18, height: 18, borderRadius: 99, background: "#fdf3e0", color: "#c2810c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>!</span>
    ) : (
      <span style={{ width: 18, height: 18, borderRadius: 99, border: "1.5px solid #d8d5cb", display: "inline-block" }} />
    );
  return (
    <div
      onClick={onOpen}
      className="pcv-press"
      style={{ flex: 1, minWidth: 0, background: "#fff", border: "1px solid " + (state === "warn" ? "#f3e2bd" : "#eceae4"), borderRadius: 13, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ ...mono, fontSize: 10, color: "#c9c4b8" }}>{n}</span>
        {icon}
      </div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: "#8a919e", lineHeight: 1.5 }}>{line}</div>
      {warn ? <div style={{ fontSize: 11, color: "#c2810c", lineHeight: 1.45 }}>⚠ {warn}</div> : null}
    </div>
  );
}

function AnalysisView({ a }: { a: Analysis }) {
  const block = (title: string, items: string[], color: string) => (
    <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 9 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {items.length ? (
          items.map((x, i) => (
            <div key={i} style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.55, display: "flex", gap: 7 }}>
              <span style={{ color }}>·</span>
              {x}
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: "#c9c4b8" }}>—</div>
        )}
      </div>
    </div>
  );
  const hidden = a.hidden.concat(a.interviewFocus || []);
  return (
    <div>
      <SectionHead no="01" title="岗位拆解" desc="JD 说了什么、没说什么——按职责 / 必要 / 加分 / 隐含四类拆开。" />
      {/* 三个短类目并排，条数长的「隐含要求」独占整行，避免高低不齐 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 12 }}>
        {block("核心职责", a.responsibilities, "#5850ec")}
        {block("必要能力", a.mustHave, "#12805c")}
        {block("加分能力", a.niceToHave, "#c2810c")}
      </div>
      <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#d64545", marginBottom: 9 }}>隐含要求 / 面试重点</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 20px" }}>
          {hidden.map((x, i) => (
            <div key={i} style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.55, display: "flex", gap: 7 }}>
              <span style={{ color: "#d64545" }}>·</span>
              {x}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchView({ m }: { m: Match }) {
  const met = (label: string, val: number, unit: string, color: string) => (
    <div style={{ flex: 1 }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: ".06em", color: "#9aa0b0", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ ...mono, fontWeight: 900, fontSize: 22, color }}>{val}</span>
        <span style={{ fontSize: 11, color: "#7a8090" }}>{unit}</span>
      </div>
      <div style={{ height: 5, background: "#2a2d38", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
        <div style={{ width: Math.min(100, unit === "处" ? val * 20 : val) + "%", height: "100%", background: color, transition: "width .8s cubic-bezier(.22,1,.36,1)" }} />
      </div>
    </div>
  );
  const col = (title: string, arr: Match["strong"], tone: string) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: tone }}>{title} · {arr.length}</div>
      {arr.length ? (
        arr.map((x, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 11, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{x.req}</div>
            {x.ev ? <div style={{ fontSize: 11.5, color: "#5850ec", margin: "4px 0 2px" }}>← {x.ev}</div> : null}
            <div style={{ fontSize: 11.5, color: "#8a919e", lineHeight: 1.5 }}>{x.note}</div>
          </div>
        ))
      ) : (
        <div style={{ fontSize: 12, color: "#c9c4b8", padding: "8px 0" }}>—</div>
      )}
    </div>
  );
  return (
    <div>
      <SectionHead no="02" title="证据匹配" desc="不止一个分数——明确告诉你：哪些重点写、哪些要弱化、哪些缺证据、哪些不能夸大。" />
      <div style={{ display: "flex", gap: 20, background: "#16181d", borderRadius: 14, padding: "16px 20px", marginBottom: 14 }}>
        {met("要求覆盖度", m.metrics.coverage, "/100", "#ffffff")}
        {met("证据强度", m.metrics.strength, "/100", "#a5f3d0")}
        {met("表达清晰度", m.metrics.clarity, "/100", "#c9c4f5")}
        {met("风险项", m.metrics.risk, "处", "#f0a0a0")}
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        {col("✓ 重点写", m.strong, "#12805c")}
        {col("△ 弱匹配 · 先澄清", m.weak, "#c2810c")}
        {col("○ 缺少证据", m.none, "#8a919e")}
      </div>
      {m.downplay?.length ? (
        <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#4b5060", marginBottom: 8 }}>建议弱化的内容</div>
          {m.downplay.map((d, i) => (
            <div key={i} style={{ fontSize: 12.5, marginBottom: 6, lineHeight: 1.5 }}>
              <span style={{ color: "#8a919e" }}>▽ </span>
              <span style={{ fontWeight: 600 }}>{d.text}</span>
              <span style={{ color: "#8a919e" }}> —— {d.why}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ background: "#fff5f5", border: "1px solid #f7d9d9", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#d64545", marginBottom: 8 }}>禁止夸大 · 风险表述</div>
        {m.risks.length ? (
          m.risks.map((r, i) => (
            <div key={i} style={{ fontSize: 12.5, marginBottom: 6, lineHeight: 1.5 }}>
              <span style={{ color: "#d64545" }}>⚠ </span>
              {r.text}
              <span style={{ color: "#12805c" }}> → {r.fix}</span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: "#8a919e" }}>暂未发现明显夸大风险。</div>
        )}
      </div>
    </div>
  );
}

/** Agent ③：一键备齐编排的进行中/等确认/完成引导条 */
function PrepBanner({ jobId, openSugs }: { jobId: string; openSugs: number }) {
  const prep = useStore((x) => x.prep);
  const go = useStore((x) => x.go);
  const prepContinueQa = useStore((x) => x.prepContinueQa);
  if (!prep || prep.jobId !== jobId) return null;
  const running = prep.stage === "analyzing" || prep.stage === "resume" || prep.stage === "qa";
  const stageText =
    prep.stage === "analyzing" ? "① 正在分析 JD 并对照证据库…" :
    prep.stage === "resume" ? "② 正在基于已确认证据生成专属简历…" :
    prep.stage === "qa" ? "③ 正在生成面试 QA…" : "";
  if (running) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f1f0fb", border: "1px solid #dcd9ff", borderRadius: 12, padding: "11px 14px", marginBottom: 14, fontSize: 13, fontWeight: 600, color: "#5850ec" }}>
        <span style={{ width: 14, height: 14, border: "2px solid #dcd9ff", borderTopColor: "#5850ec", borderRadius: 99, animation: "pcvSpin .8s linear infinite", flexShrink: 0 }} />
        一键备齐进行中：{stageText}
      </div>
    );
  }
  if (prep.stage === "confirm") {
    return (
      <div style={{ background: "#fdf7ec", border: "1px solid #f3e2bd", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#c2810c" }}>
          ⏸ 编排已暂停：简历生成好了，{openSugs ? "还有 " + openSugs + " 条 AI 建议等你逐条确认" : "AI 建议已处理完"}——确认后再继续生成 QA，不会替你做决定。
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <Btn label="去简历编辑器逐条确认 →" kind="ghost" onClick={() => go("resume" as Tab)} />
          <Btn label={openSugs ? "剩余建议稍后处理，先生成 QA" : "继续生成 QA →"} onClick={() => prepContinueQa()} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#e6f5ee", border: "1px solid #bfe6d4", borderRadius: 12, padding: "11px 14px", marginBottom: 14, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#12805c" }}>✓ 申请包已备齐：岗位分析、专属简历、面试 QA 全部就绪。建议下一步：来一场模拟面试。</span>
      <Btn label="去模拟面试 →" kind="dark" onClick={() => go("mock" as Tab)} />
    </div>
  );
}

export default function Package() {
  const s = useStore();
  const go = useStore((x) => x.go);
  const openPackage = useStore((x) => x.openPackage);
  const updateJd = useStore((x) => x.updateJd);
  const analyzeJd = useStore((x) => x.analyzeJd);
  const prepPackage = useStore((x) => x.prepPackage);
  const [jdOpen, setJdOpen] = useState(false);

  const j = s.jobs.find((x) => x.id === s.activeJobId) || s.jobs[0];
  const a = s.analyses[j.id];
  const m = s.matches[j.id];
  const r = s.resumes[j.id];
  const qa = s.qa[j.id] || [];
  const mocks = s.mocks[j.id] || [];
  const recs = s.records.filter((x) => x.jobId === j.id);

  const bullets = (r?.exp || []).flatMap((x) => x.bullets);
  const hooks = bullets.filter((b) => b.hook);
  const openSugs = bullets.filter((b) => b.suggestion && !b.decision);
  const qaByPrep = (p: string) => qa.filter((q) => q.prep === p).length;
  const lastMock = mocks.slice(-1)[0];
  const lastRec = recs.slice(-1)[0];
  const pendingSugs = recs.flatMap((rec) => rec.suggestions.filter((x) => x.state === "pending"));

  // 历次优化建议（真实复盘 + 模拟报告汇总）
  const history = recs
    .flatMap((rec) => rec.suggestions.map((sug) => ({ date: rec.date, src: "真实面试复盘 · " + rec.source, title: sug.title, state: sug.state as string })))
    .concat(
      mocks.filter((mk) => mk.report).flatMap((mk) => (mk.report!.resumeSuggestions || []).map((t) => ({ date: mk.date, src: "模拟面试报告", title: t, state: "info" })))
    );

  // 五步准备流水线：状态优先级 warn > done > todo
  const steps: { n: string; title: string; state: StepState; line: string; warn?: string | null; open: () => void }[] = [
    {
      n: "01", title: "岗位分析",
      state: a ? "done" : "todo",
      line: a ? (m ? "覆盖度 " + m.metrics.coverage + "/100 · 风险 " + m.metrics.risk + " 处" : "已拆解") : "从这里开始：粘贴并分析 JD",
      open: () => setJdOpen(true),
    },
    {
      n: "02", title: "专属简历",
      state: r ? (openSugs.length ? "warn" : "done") : "todo",
      line: r ? bullets.length + " 条内容 · " + hooks.length + " 个面试钩子" : "基于已确认证据生成，句句可溯源",
      warn: openSugs.length ? openSugs.length + " 条 AI 建议待决策" : null,
      open: () => go("resume" as Tab),
    },
    {
      n: "03", title: "面试 QA",
      state: qa.length ? (s.qaStale[j.id] || qaByPrep("risk") ? "warn" : "done") : "todo",
      line: qa.length ? qa.length + " 题 · 已掌握 " + qaByPrep("done") + " · 高风险 " + qaByPrep("risk") : "每题标注来源与对应岗位要求",
      warn: s.qaStale[j.id] ? "简历已更新，QA 需刷新" : qaByPrep("risk") ? qaByPrep("risk") + " 道高风险题待补强" : null,
      open: () => go("qa" as Tab),
    },
    {
      n: "04", title: "模拟面试",
      state: mocks.length ? (s.mockStale[j.id] ? "warn" : "done") : "todo",
      line: lastMock ? mocks.length + " 场 · 最近 " + lastMock.date : "面试官优先追问钩子与薄弱点",
      warn: s.mockStale[j.id] ? "简历已更新，建议再模拟一场" : null,
      open: () => go("mock" as Tab),
    },
    {
      n: "05", title: "真实复盘",
      state: recs.length ? (pendingSugs.length ? "warn" : "done") : "todo",
      line: lastRec ? recs.length + " 次复盘 · 最近 " + lastRec.date : "面试后上传录音，反哺下一轮",
      warn: pendingSugs.length ? pendingSugs.length + " 条复盘建议待确认" : null,
      open: () => go("records" as Tab),
    },
  ];

  return (
    <Page title="岗位申请包" sub="这个岗位的一切都在这里：JD 分析、专属简历、面试 QA、模拟面试与真实复盘——全部围绕当前岗位生成，互相联动。">
      <JobChips jobs={s.jobs} activeId={j.id} onPick={(id) => openPackage(id)} />

      {/* 岗位信息 + JD */}
      <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#16181d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>{j.logo}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{j.company} · {j.role}</div>
            <div style={{ fontSize: 12, color: "#8a919e", marginTop: 2 }}>{j.statusLabel} · 更新 {j.updated}</div>
          </div>
          {a ? (
            <div onClick={() => setJdOpen(!jdOpen)} className="pcv-link" style={{ fontSize: 12.5 }}>
              {jdOpen ? "收起 JD ▲" : "查看完整 JD ▼"}
            </div>
          ) : null}
        </div>
        {!a || jdOpen ? (
          <div style={{ marginTop: 14 }}>
            <textarea
              value={j.jd}
              onChange={(e) => updateJd(j.id, e.target.value)}
              placeholder="粘贴目标岗位的完整 JD…"
              style={{ width: "100%", height: a ? 140 : 180, border: "1px solid #e6e8ee", borderRadius: 10, padding: 12, fontSize: 12.5, lineHeight: 1.7, resize: "vertical", outline: "none", background: "#fbfbf9" }}
            />
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <Btn label={s.jdLoading ? "分析中…" : a ? "重新分析 JD" : "分析 JD →"} onClick={() => analyzeJd()} />
              {!a ? <span style={{ fontSize: 12, color: "#a3a8b5" }}>AI 会拆解岗位要求，并和你的证据库逐条对照</span> : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* 准备进度流水线：先回答「到哪了、下一步做什么」，每一步可直接点进去 */}
      <div style={{ marginBottom: 22 }}>
        <PrepBanner jobId={j.id} openSugs={openSugs.length} />
        <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
          {steps.map((st, i) => (
            <React.Fragment key={st.n}>
              <Step n={st.n} title={st.title} state={st.state} line={st.line} warn={st.warn} onOpen={st.open} />
              {i < steps.length - 1 ? (
                <span style={{ alignSelf: "center", color: "#c9c4b8", fontSize: 12, flexShrink: 0 }}>→</span>
              ) : null}
            </React.Fragment>
          ))}
        </div>
        {j.jd.trim() && (!a || !r || !qa.length) && (!s.prep || s.prep.jobId !== j.id || s.prep.stage === "done") ? (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Btn label="⚡ 一键备齐申请包" kind="dark" onClick={() => prepPackage()} />
            <span style={{ fontSize: 12, color: "#a3a8b5" }}>依次执行：分析 JD → 生成专属简历 →（停下来等你逐条确认 AI 建议）→ 生成面试 QA</span>
          </div>
        ) : null}
      </div>

      {s.jdLoading ? (
        <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: 18 }}>
          <Spinner text="识别核心职责、必要/加分能力与隐含要求，并对照你的证据…" />
        </div>
      ) : !a ? (
        <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: "40px 24px", textAlign: "center", color: "#6b7280", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line" }}>
          申请包从分析 JD 开始。{"\n"}AI 会告诉你：哪些经历重点写、哪些要弱化、哪些能力缺证据、哪些内容不能夸大——{"\n"}然后再生成专属简历和面试 QA。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <AnalysisView a={a} />
          {m ? <MatchView m={m} /> : null}

          {/* 历次优化建议 */}
          {history.length ? (
            <div>
              <SectionHead no="03" title="迭代记录" desc="每次模拟和真实面试的产出都沉淀在这里——系统越用越懂你。" />
              <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: "6px 18px" }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderTop: i ? "1px solid #f4f2ec" : "none" }}>
                    <span style={{ ...mono, fontSize: 11, color: "#a3a8b5", whiteSpace: "nowrap", marginTop: 2 }}>{h.date}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, color: "#2f333d", lineHeight: 1.5 }}>{h.title}</div>
                      <div style={{ fontSize: 11, color: "#a3a8b5", marginTop: 2 }}>{h.src}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap", background: h.state === "accepted" ? "#e6f5ee" : h.state === "dismissed" ? "#f2f3f5" : h.state === "pending" ? "#fdf3e0" : "#f1f0fb", color: h.state === "accepted" ? "#12805c" : h.state === "dismissed" ? "#8a919e" : h.state === "pending" ? "#c2810c" : "#5850ec" }}>
                      {h.state === "accepted" ? "已采纳" : h.state === "dismissed" ? "已忽略" : h.state === "pending" ? "待确认" : "参考"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Page>
  );
}
