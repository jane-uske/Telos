"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, JobChips, Empty, Spinner } from "../ui";
import { GenBadge } from "../AuthGate";
import type { InterviewRecord, SegFlag } from "@/lib/types";

const flagMeta: Record<SegFlag, { label: string; fg: string; bg: string }> = {
  vague: { label: "含糊", fg: "#c2810c", bg: "#fdf3e0" },
  broken: { label: "中断", fg: "#8a919e", bg: "#f2f3f5" },
  noEvidence: { label: "缺依据", fg: "#d64545", bg: "#fff0f0" },
  conflict: { label: "矛盾", fg: "#b03a8c", bg: "#fbeef7" },
};

const sample =
  "面试官：先自我介绍一下吧。\n我：我是林深，5 年前端/全栈，主导过实时协作编辑器的冲突算法重构，同编延迟从 800ms 降到 120ms……\n面试官：CRDT 相比 OT 你具体怎么权衡的？内存问题怎么控制？\n我：呃…主要是 CRDT 收敛性更好，内存我们做了增量 GC，不过具体数字我记不太清了。\n面试官：120ms 是在什么环境测的？\n我：本地压测环境，真实环境可能会高一些，这块我没细看。\n面试官：如果放到抖音电商这种亿级流量，你会怎么设计？\n我：我需要再想想，可能要加分片和边缘节点……\n面试官：好，那我们聊聊你在团队里的角色。\n我：我主要负责协同层，也带过两个新人。";


function SuggestionCard({ rec }: { rec: InterviewRecord }) {
  const applySuggestion = useStore((s) => s.applySuggestion);
  const dismissSuggestion = useStore((s) => s.dismissSuggestion);
  const targetLabel = { qa: "面试问题", resume: "简历", evidence: "经历" };
  const pending = rec.suggestions.filter((x) => x.state === "pending");
  const handled = rec.suggestions.filter((x) => x.state !== "pending");
  if (!rec.suggestions.length) return null;
  return (
    <div style={{ background: "#f1f0fb", border: "1px solid #ddd9f7", borderRadius: 16, padding: 18 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#3a3550", marginBottom: 4 }}>复盘产出的修改建议</div>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>任何修改都需要你确认后才会生效——系统不会自动覆盖你的内容。</div>
      {pending.map((sug) => (
        <div key={sug.id} style={{ background: "#fff", border: "1px solid #e4ddff", borderRadius: 12, padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#5850ec", background: "#f1f0fb", padding: "2px 8px", borderRadius: 5 }}>更新 → {targetLabel[sug.target]}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{sug.title}</span>
          </div>
          <div style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.6, marginBottom: 6 }}>{sug.detail}</div>
          {sug.suggestion ? <div style={{ fontSize: 12, color: "#12805c", background: "#eef8f2", borderRadius: 8, padding: "7px 10px", lineHeight: 1.55, marginBottom: 8 }}>建议改为：{sug.suggestion}</div> : null}
          {sug.qa ? <div style={{ fontSize: 12, color: "#3a3550", background: "#fbfbfd", border: "1px solid #f0f0f5", borderRadius: 8, padding: "7px 10px", lineHeight: 1.55, marginBottom: 8 }}>将加入问题：「{sug.qa.q}」</div> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={() => applySuggestion(rec.id, sug.id)} style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", background: "#5850ec", padding: "6px 16px", borderRadius: 8 }}>确认采纳</div>
            <div onClick={() => dismissSuggestion(rec.id, sug.id)} style={{ cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#4b5060", background: "#f2f2f6", padding: "6px 16px", borderRadius: 8 }}>忽略</div>
          </div>
        </div>
      ))}
      {handled.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {handled.map((sug) => (
            <div key={sug.id} style={{ fontSize: 12, color: sug.state === "accepted" ? "#12805c" : "#a3a8b5", lineHeight: 1.5 }}>
              {sug.state === "accepted" ? "✓ 已采纳：" : "− 已忽略："}{sug.title}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RecordDetail({ rec }: { rec: InterviewRecord }) {
  const s = useStore();
  const j = s.jobs.find((x) => x.id === rec.jobId);
  const genSrc = s.genSource["record:" + rec.id];
  const bulletById = new Map((s.resumes[rec.jobId]?.exp || []).flatMap((x) => x.bullets).map((b) => [b.id, b.text]));

  const listCard = (title: string, items: string[], color: string, prefix: string) =>
    items.length ? (
      <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color, marginBottom: 9 }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {items.map((x, i) => (
            <div key={i} style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.55, display: "flex", gap: 7 }}>
              <span style={{ color, flexShrink: 0 }}>{prefix}</span>
              {x}
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "pcvFade .3s ease both" }}>
      {/* 头部 */}
      <div style={{ display: "grid", gridTemplateColumns: rec.score ? "200px 1fr" : "1fr", gap: 16 }}>
        {rec.score ? (
          <div style={{ background: "#16181d", color: "#fff", borderRadius: 16, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#9aa0b0", marginBottom: 6 }}>整体表现</div>
            <div style={{ fontSize: 44, fontWeight: 900, fontFamily: "'JetBrains Mono'", lineHeight: 1 }}>{rec.score}</div>
            <div style={{ fontSize: 11, color: "#9aa0b0", marginTop: 4 }}>/ 100</div>
            <div style={{ height: 6, background: "#2a2d38", borderRadius: 99, margin: "12px 0 0", overflow: "hidden" }}>
              <div style={{ width: rec.score + "%", height: "100%", background: "#5850ec" }} />
            </div>
          </div>
        ) : null}
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{j ? j.company + " · " + j.role : ""} · {rec.date} · {rec.source}{rec.duration ? " · " + rec.duration : ""}</span>
            <GenBadge source={genSrc} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6, color: "#2f333d" }}>{rec.verdict}</div>
        </div>
      </div>

      {/* 待确认建议（最重要，放最前） */}
      <SuggestionCard rec={rec} />

      {/* 钩子命中 */}
      {rec.hooks.length ? (
        <div style={{ background: "#fdf1e8", border: "1px solid #f5ddc9", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#c8622a", marginBottom: 9 }}>★ 面试钩子命中情况</div>
          {rec.hooks.map((h, i) => (
            <div key={i} style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.6, marginBottom: 5 }}>
              <span style={{ fontWeight: 700, color: h.hit ? "#12805c" : "#8a919e" }}>{h.hit ? "✓ 命中" : "○ 未命中"}</span> · {h.hook} —— {h.note}
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {listCard("高光时刻", rec.highlights, "#12805c", "✓")}
        {listCard("暴露的失误", rec.issues, "#d64545", "!")}
      </div>

      {/* 问答提取 */}
      {rec.qas.length ? (
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>提取的面试问答</div>
          <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 12 }}>标注了追问链、简历触发来源与更好的答法。</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rec.qas.map((qa, i) => (
              <div key={i} style={{ border: "1px solid #eef0f4", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                  {qa.chain ? <span style={{ fontSize: 10.5, fontWeight: 700, color: "#b03a8c", background: "#fbeef7", padding: "2px 8px", borderRadius: 5 }}>追问链 #{qa.chain}</span> : null}
                  {qa.fromResume ? <span style={{ fontSize: 10.5, fontWeight: 700, color: "#5850ec", background: "#f1f0fb", padding: "2px 8px", borderRadius: 5 }} title={bulletById.get(qa.fromResume) || qa.fromResume}>由简历触发</span> : <span style={{ fontSize: 10.5, fontWeight: 700, color: "#8a919e", background: "#f2f3f5", padding: "2px 8px", borderRadius: 5 }}>简历之外的新问题</span>}
                  {qa.hookHit ? <span style={{ fontSize: 10.5, fontWeight: 700, color: "#c8622a", background: "#fdf1e8", padding: "2px 8px", borderRadius: 5 }}>★ 钩子命中</span> : null}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#16181d", lineHeight: 1.5, marginBottom: 5 }}>Q{i + 1}. {qa.q}</div>
                <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.6, marginBottom: qa.issue || qa.better ? 7 : 0 }}>你的回答：{qa.a}</div>
                {qa.issue ? <div style={{ fontSize: 12, color: "#c2810c", background: "#fdf7ec", borderRadius: 8, padding: "6px 10px", lineHeight: 1.5, marginBottom: 6 }}>⚠ {qa.issue}</div> : null}
                {qa.better ? <div style={{ fontSize: 12, color: "#12805c", background: "#eef8f2", borderRadius: 8, padding: "6px 10px", lineHeight: 1.55 }}>✦ 更好的答法：{qa.better}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 时间轴转写 */}
      <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>对话时间轴</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflow: "auto" }}>
          {rec.transcript.map((seg, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#a3a8b5", marginTop: 3, flexShrink: 0 }}>{seg.t}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, flexShrink: 0, marginTop: 1, background: seg.speaker === "interviewer" ? "#16181d" : "#f1f0fb", color: seg.speaker === "interviewer" ? "#fff" : "#5850ec" }}>
                {seg.speaker === "interviewer" ? "面试官" : "我"}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12.5, color: "#2f333d", lineHeight: 1.65 }}>{seg.text}</span>
                {(seg.flags || []).map((f) => (
                  <span key={f} style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 700, color: flagMeta[f].fg, background: flagMeta[f].bg, padding: "2px 7px", borderRadius: 5, whiteSpace: "nowrap" }}>{flagMeta[f].label}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 结构化笔记 */}
      {rec.notes.length ? (
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>结构化面试笔记</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {rec.notes.map((n, i) => (
              <div key={i} style={{ background: "#fbfbfd", border: "1px solid #f0f0f5", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#5850ec", marginBottom: 5 }}>{n.section}</div>
                <div style={{ fontSize: 12.5, color: "#4b5060", lineHeight: 1.65 }}>{n.content}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {listCard("新暴露的能力缺口", rec.gaps, "#c2810c", "▲")}
        {listCard("下一轮准备清单", rec.nextPrep, "#5850ec", "→")}
      </div>
    </div>
  );
}

export default function Records() {
  const s = useStore();
  const analyzeRecordingText = useStore((x) => x.analyzeRecordingText);
  const go = useStore((x) => x.go);

  const j = s.jobs.find((x) => x.id === s.recJobId) || s.jobs[0] || null;
  if (!j) {
    return (
      <Page title="面试后复盘" sub="把真实面试转化为下一次进步：粘贴面试转写，提取问答与追问链、分析薄弱回答、生成更好答案——修改建议逐条确认后更新到问题、简历和经历。">
        <Empty
          title="还没有目标岗位"
          desc="复盘挂在具体岗位下。先添加一个岗位，面试后再回来粘贴转写。"
          action={<Btn label="去添加目标岗位 →" onClick={() => go("jobs")} />}
        />
      </Page>
    );
  }
  const recs = s.records.filter((r) => r.jobId === j.id);
  const active = recs.find((r) => r.id === s.activeRecordId) || recs.slice(-1)[0];

  return (
    <Page title="面试后复盘" sub="把真实面试转化为下一次进步：粘贴面试转写，提取问答与追问链、分析薄弱回答、生成更好答案——修改建议逐条确认后更新到问题、简历和经历。">
      <JobChips jobs={s.jobs} activeId={j.id} onPick={(id) => useStore.setState({ recJobId: id, activeRecordId: null })} />

      {s.recPhase !== "idle" ? (
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
          <Spinner text="正在提取问答与追问链、标记含糊与缺依据的回答、生成修改建议…" />
        </div>
      ) : (
        <>
          {/* 新建复盘 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start", marginBottom: recs.length ? 20 : 0 }}>
            <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>新建一次复盘 · {j.company}</div>
                <div onClick={() => useStore.setState({ recInput: sample })} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec" }}>填入示例转写</div>
              </div>
              <div style={{ border: "1px solid #eef0f4", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#8a919e", background: "#fbfbfd", marginBottom: 10, lineHeight: 1.6 }}>
                🎙 录音自动转录<b style={{ color: "#5850ec" }}>即将上线</b>。目前请把面试录音先用你常用的转写工具转成文本，粘贴到下面（用「面试官：」「我：」区分说话人）。
              </div>
              <textarea
                value={s.recInput}
                onChange={(e) => useStore.setState({ recInput: e.target.value })}
                placeholder={"粘贴面试录音的转写文本，用「面试官：」「我：」区分说话人…"}
                style={{ width: "100%", height: 160, border: "1px solid #e6e8ee", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.7, resize: "vertical", background: "#fbfbfd", outline: "none" }}
              />
              <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
                <Btn label="复盘这场面试 →" onClick={() => analyzeRecordingText()} />
                <div style={{ fontSize: 12, color: "#a3a8b5" }}>转写只在复盘时临时处理，复盘结果保存在本机</div>
              </div>
            </div>
            <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: 18, fontSize: 12.5, color: "#6b7280", lineHeight: 1.8 }}>
              <div style={{ fontWeight: 700, color: "#16181d", marginBottom: 8 }}>复盘会给你什么</div>
              <div style={{ whiteSpace: "pre-line" }}>
                · 按时间轴的对话记录（区分说话人）{"\n"}· 提取的问题与连续追问链{"\n"}· 哪些问题由简历触发、钩子是否命中{"\n"}· 含糊 / 中断 / 缺依据 / 矛盾的标记{"\n"}· 每个弱回答的更好版本{"\n"}· 结构化面试笔记{"\n"}· 对面试问题 / 简历 / 经历的修改建议{"\n\n"}
                <span style={{ color: "#c2810c" }}>所有修改都需要你确认，不会自动覆盖。</span>
              </div>
            </div>
          </div>

          {/* 历史记录 tab */}
          {recs.length ? (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {recs
                  .slice()
                  .reverse()
                  .map((r) => {
                    const on = active?.id === r.id;
                    const pend = r.suggestions.filter((x) => x.state === "pending").length;
                    return (
                      <div key={r.id} onClick={() => useStore.setState({ activeRecordId: r.id })} style={{ cursor: "pointer", padding: "7px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, background: on ? "#16181d" : "#fff", color: on ? "#fff" : "#4b5060", border: "1px solid " + (on ? "#16181d" : "#e3e5ec"), display: "flex", gap: 7, alignItems: "center" }}>
                        {r.date} · {r.source.length > 16 ? r.source.slice(0, 16) + "…" : r.source}
                        {pend ? <span style={{ fontSize: 10.5, fontWeight: 700, background: on ? "#5850ec" : "#fdf3e0", color: on ? "#fff" : "#c2810c", padding: "1px 7px", borderRadius: 99 }}>{pend}</span> : null}
                      </div>
                    );
                  })}
              </div>
              {active ? <RecordDetail rec={active} /> : null}
            </>
          ) : (
            <div style={{ marginTop: 20, background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: "30px 24px", textAlign: "center", fontSize: 12.5, color: "#8a919e", lineHeight: 1.8 }}>
              「{j.company}」还没有面试记录。真实面试结束后尽快上传录音——细节还热乎的时候复盘效果最好。
            </div>
          )}
        </>
      )}
    </Page>
  );
}
