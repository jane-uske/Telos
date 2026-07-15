"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Spinner, JobChips } from "../ui";
import type { Analysis, Match } from "@/lib/types";

function AnalysisView({ a }: { a: Analysis }) {
  const block = (title: string, items: string[], color: string) => (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 9 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {items.length ? (
          items.map((x, i) => (
            <div key={i} style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.5, display: "flex", gap: 7 }}>
              <span style={{ color }}>·</span>
              {x}
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: "#c9ccd6" }}>—</div>
        )}
      </div>
    </div>
  );
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>岗位拆解</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {block("核心职责", a.responsibilities, "#5850ec")}
        {block("必要能力", a.mustHave, "#12805c")}
        {block("加分能力", a.niceToHave, "#c2810c")}
        {block("隐含要求 / 面试重点", a.hidden.concat(a.interviewFocus || []), "#d64545")}
      </div>
    </div>
  );
}

function MatchView({ m }: { m: Match }) {
  const met = (label: string, val: number, unit: string, color: string) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11.5, color: "#8a919e", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 900, fontSize: 22, color }}>{val}</span>
        <span style={{ fontSize: 11, color: "#a3a8b5" }}>{unit}</span>
      </div>
      <div style={{ height: 5, background: "#eee", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
        <div style={{ width: Math.min(100, unit === "处" ? val * 20 : val) + "%", height: "100%", background: color }} />
      </div>
    </div>
  );
  const col = (title: string, arr: Match["strong"], tone: string) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: tone }}>{title} · {arr.length}</div>
      {arr.length ? (
        arr.map((x, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #eef0f4", borderRadius: 11, padding: "10px 12px", marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{x.req}</div>
            {x.ev ? <div style={{ fontSize: 11.5, color: "#5850ec", margin: "4px 0 2px" }}>← {x.ev}</div> : null}
            <div style={{ fontSize: 11.5, color: "#8a919e", lineHeight: 1.5 }}>{x.note}</div>
          </div>
        ))
      ) : (
        <div style={{ fontSize: 12, color: "#c9ccd6", padding: "8px 0" }}>—</div>
      )}
    </div>
  );
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, margin: "4px 0 6px" }}>匹配分析</div>
      <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 12 }}>不止一个分数——明确告诉你：哪些重点写、哪些要弱化、哪些缺证据、哪些不能夸大。</div>
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
        <div style={{ background: "#f7f8fb", border: "1px solid #e8eaf1", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
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

/** 申请包内的模块入口卡 */
function ModuleCard({
  title,
  status,
  lines,
  cta,
  onOpen,
  warn,
}: {
  title: string;
  status: string;
  lines: string[];
  cta: string;
  onOpen: () => void;
  warn?: string | null;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        <span style={{ fontSize: 11.5, color: "#8a919e" }}>{status}</span>
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.55 }}>{l}</div>
      ))}
      {warn ? <div style={{ fontSize: 12, color: "#c2810c", background: "#fdf7ec", borderRadius: 9, padding: "7px 10px" }}>⚠ {warn}</div> : null}
      <div onClick={onOpen} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#5850ec", marginTop: "auto", paddingTop: 4 }}>{cta} →</div>
    </div>
  );
}

export default function Package() {
  const s = useStore();
  const go = useStore((x) => x.go);
  const openPackage = useStore((x) => x.openPackage);
  const updateJd = useStore((x) => x.updateJd);
  const analyzeJd = useStore((x) => x.analyzeJd);
  const [jdOpen, setJdOpen] = useState(false);

  const j = s.jobs.find((x) => x.id === s.activeJobId) || s.jobs[0];
  const a = s.analyses[j.id];
  const m = s.matches[j.id];
  const r = s.resumes[j.id];
  const qa = s.qa[j.id] || [];
  const mocks = s.mocks[j.id] || [];
  const recs = s.records.filter((x) => x.jobId === j.id);
  const versions = s.resumeVersions[j.id] || [];

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

  return (
    <Page title="岗位申请包" sub="这个岗位的一切都在这里：JD 分析、专属简历、面试 QA、模拟面试与真实复盘——全部围绕当前岗位生成，互相联动。">
      <JobChips jobs={s.jobs} activeId={j.id} onPick={(id) => openPackage(id)} />

      {/* 岗位信息 + JD */}
      <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#16181d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>{j.logo}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{j.company} · {j.role}</div>
            <div style={{ fontSize: 12, color: "#8a919e", marginTop: 2 }}>{j.statusLabel} · 更新 {j.updated}</div>
          </div>
          {a ? (
            <div onClick={() => setJdOpen(!jdOpen)} style={{ cursor: "pointer", fontSize: 12.5, color: "#5850ec", fontWeight: 600 }}>
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
              style={{ width: "100%", height: a ? 140 : 180, border: "1px solid #e6e8ee", borderRadius: 10, padding: 12, fontSize: 12.5, lineHeight: 1.7, resize: "vertical", outline: "none", background: "#fbfbfd" }}
            />
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <Btn label={s.jdLoading ? "分析中…" : a ? "重新分析 JD" : "分析 JD →"} onClick={() => analyzeJd()} />
              {!a ? <span style={{ fontSize: 12, color: "#a3a8b5" }}>AI 会拆解岗位要求，并和你的证据库逐条对照</span> : null}
            </div>
          </div>
        ) : null}
      </div>

      {s.jdLoading ? (
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
          <Spinner text="识别核心职责、必要/加分能力与隐含要求，并对照你的证据…" />
        </div>
      ) : !a ? (
        <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: "40px 24px", textAlign: "center", color: "#6b7280", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-line" }}>
          申请包从分析 JD 开始。{"\n"}AI 会告诉你：哪些经历重点写、哪些要弱化、哪些能力缺证据、哪些内容不能夸大——{"\n"}然后再生成专属简历和面试 QA。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AnalysisView a={a} />
          {m ? <MatchView m={m} /> : null}

          {/* 申请包模块 */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>准备进度</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <ModuleCard
                title="专属简历"
                status={r ? versions.length + " 个版本" : "未生成"}
                lines={
                  r
                    ? ["共 " + bullets.length + " 条内容 · " + hooks.length + " 个面试钩子", bullets.filter((b) => b.evStatus === "confirmed").length + " 条已绑定确认证据 · " + bullets.filter((b) => b.evStatus === "pending").length + " 条证据待确认"]
                    : ["基于已确认的职业证据生成，每一句都可追溯到证据卡。"]
                }
                warn={openSugs.length ? openSugs.length + " 条 AI 建议待决策" : null}
                cta={r ? "打开简历编辑器" : "去生成简历"}
                onOpen={() => go("resume")}
              />
              <ModuleCard
                title="面试 QA"
                status={qa.length ? qa.length + " 题" : "未生成"}
                lines={
                  qa.length
                    ? ["已掌握 " + qaByPrep("done") + " · 准备中 " + qaByPrep("doing") + " · 未准备 " + qaByPrep("todo") + " · 高风险 " + qaByPrep("risk"), "含自我介绍、项目讲述、预测追问与反问清单"]
                    : ["基于当前简历和证据生成：每题都标注来自哪条简历内容、对应哪项岗位要求。"]
                }
                warn={s.qaStale[j.id] ? "简历已更新，QA 可能需要刷新" : null}
                cta={qa.length ? "打开面试 QA" : "去生成 QA"}
                onOpen={() => go("qa")}
              />
              <ModuleCard
                title="模拟面试"
                status={mocks.length ? mocks.length + " 场" : "未开始"}
                lines={
                  lastMock?.report
                    ? ["最近一场（" + lastMock.date + "）：" + lastMock.report.overall.slice(0, 40) + "…", "下次重点：" + (lastMock.report.nextFocus[0] || "—")]
                    : ["面试官基于当前简历提问，优先追问你标记的钩子和历史薄弱点。"]
                }
                warn={s.mockStale[j.id] ? "简历已更新，建议再来一场模拟" : null}
                cta={mocks.length ? "查看记录 / 再来一场" : "开始模拟面试"}
                onOpen={() => go("mock")}
              />
              <ModuleCard
                title="真实面试复盘"
                status={recs.length ? recs.length + " 次" : "暂无"}
                lines={
                  lastRec
                    ? ["最近：" + lastRec.date + " · " + lastRec.source, lastRec.verdict.slice(0, 44) + "…"]
                    : ["面试后上传录音：自动转录、区分说话人、提取问题、生成复盘与修改建议。"]
                }
                warn={pendingSugs.length ? pendingSugs.length + " 条复盘建议待确认" : null}
                cta={recs.length ? "查看复盘" : "上传面试录音"}
                onOpen={() => go("records")}
              />
            </div>
          </div>

          {/* 历次优化建议 */}
          {history.length ? (
            <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>历次优化建议</div>
              <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 12 }}>每次模拟和真实面试的产出都沉淀在这里——系统越用越懂你。</div>
              {history.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderTop: i ? "1px solid #f2f2f6" : "none" }}>
                  <span style={{ fontSize: 11, color: "#a3a8b5", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono'", marginTop: 2 }}>{h.date}</span>
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
          ) : null}
        </div>
      )}
    </Page>
  );
}
