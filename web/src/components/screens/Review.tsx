"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn } from "../ui";
import type { Job, Review as Rv } from "@/lib/types";

const sample =
  "面试官：先自我介绍一下吧。\n我：我是林深，5 年前端/全栈，主导过实时协作编辑器的冲突算法重构，同编延迟从 800ms 降到 120ms……\n面试官：CRDT 相比 OT 你具体怎么权衡的？内存问题怎么控制？\n我：呃…主要是 CRDT 收敛性更好，内存我们做了增量 GC，不过具体数字我记不太清了。\n面试官：120ms 是在什么环境测的？\n我：本地压测环境，真实环境可能会高一些，这块我没细看。\n面试官：如果放到抖音电商这种亿级流量，你会怎么设计？\n我：我需要再想想，可能要加分片和边缘节点……\n面试官：好，那我们聊聊你在团队里的角色。\n我：我主要负责协同层，也带过两个新人。";

function chips(jobs: Job[], activeId: string) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
      {jobs.map((x) => (
        <div key={x.id} onClick={() => useStore.setState({ reviewJobId: x.id })} style={{ cursor: "pointer", padding: "7px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, background: x.id === activeId ? "#16181d" : "#fff", color: x.id === activeId ? "#fff" : "#4b5060", border: "1px solid " + (x.id === activeId ? "#16181d" : "#e3e5ec") }}>
          {x.company} · {x.role.split("·")[0].trim()}
        </div>
      ))}
    </div>
  );
}

function ReviewResult({ j, rv }: { j: Job; rv: Rv }) {
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);
  const qcolor = (q: string) => (q === "good" ? "#12805c" : q === "weak" ? "#d64545" : "#c2810c");
  const qlabel = (q: string) => (q === "good" ? "答得好" : q === "weak" ? "答得弱" : "一般");
  const listCard = (title: string, items: string[], color: string, prefix: string) => (
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
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 920 }}>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
        <div style={{ background: "#16181d", color: "#fff", borderRadius: 16, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#9aa0b0", marginBottom: 6 }}>整体表现</div>
          <div style={{ fontSize: 46, fontWeight: 900, fontFamily: "'JetBrains Mono'", lineHeight: 1 }}>{rv.score}</div>
          <div style={{ fontSize: 11, color: "#9aa0b0", marginTop: 4 }}>/ 100</div>
          <div style={{ height: 6, background: "#2a2d38", borderRadius: 99, margin: "12px 0 0", overflow: "hidden" }}>
            <div style={{ width: rv.score + "%", height: "100%", background: "#5850ec" }} />
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 6 }}>{j.company} · {j.role} · 一句话诊断</div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6, color: "#2f333d" }}>{rv.verdict}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {listCard("高光时刻", rv.highlights, "#12805c", "✓")}
        {listCard("暴露的失误", rv.issues, "#d64545", "!")}
      </div>
      <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>被问到的问题 · 回答评估</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rv.qa.map((q, i) => (
            <div key={i} style={{ border: "1px solid #eef0f4", borderRadius: 11, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#16181d", lineHeight: 1.5 }}>Q{i + 1}. {q.q}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: qcolor(q.quality), background: qcolor(q.quality) + "18", padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{qlabel(q.quality)}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, lineHeight: 1.55 }}>{q.comment}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {listCard("新暴露的能力缺口", rv.gaps, "#c2810c", "▲")}
        <div style={{ background: "#f1f0fb", border: "1px solid #ddd9f7", borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#5850ec", marginBottom: 9 }}>下一轮准备清单</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {rv.nextPrep.map((x, i) => (
              <label key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "#3a3550", lineHeight: 1.5, cursor: "pointer" }}>
                <input type="checkbox" style={{ accentColor: "#5850ec", marginTop: 2 }} />
                {x}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn label="把缺口补进证据库" kind="ghost" onClick={() => { go("interview"); showToast("已带着缺口进入访谈补充"); }} />
        <Btn label="生成下一轮材料" kind="ghost" onClick={() => go("materials")} />
        <Btn label="重新复盘" kind="soft" onClick={() => useStore.setState((st) => ({ reviews: { ...st.reviews, [j.id]: undefined }, reviewInput: "" }))} />
      </div>
    </div>
  );
}

export default function Review() {
  const jobs = useStore((s) => s.jobs);
  const reviewJobId = useStore((s) => s.reviewJobId);
  const reviews = useStore((s) => s.reviews);
  const reviewInput = useStore((s) => s.reviewInput);
  const reviewLoading = useStore((s) => s.reviewLoading);
  const analyzeReview = useStore((s) => s.analyzeReview);
  const showToast = useStore((s) => s.showToast);

  const j = jobs.find((x) => x.id === reviewJobId) || jobs[0];
  const rv = reviews[j.id];

  if (!rv) {
    return (
      <Page title="面试复盘">
        {chips(jobs, j.id)}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }}>
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>面试录音转写文本</div>
              <div onClick={() => useStore.setState({ reviewInput: sample })} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec" }}>填入示例转写</div>
            </div>
            <div onClick={() => showToast("已上传录音，转写完成（演示）")} style={{ cursor: "pointer", border: "1.5px dashed #d8d4ff", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 12.5, color: "#5850ec", background: "#faf9ff", marginBottom: 10 }}>🎙 拖入面试录音（mp3/m4a）自动转写，或直接粘贴转写文本</div>
            <textarea
              value={reviewInput}
              onChange={(e) => useStore.setState({ reviewInput: e.target.value })}
              placeholder="粘贴面试录音的转写文本（含面试官提问与你的回答）…"
              style={{ width: "100%", height: 280, border: "1px solid #e6e8ee", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.7, resize: "vertical", background: "#fbfbfd", outline: "none" }}
            />
            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
              <Btn label={reviewLoading ? "AI 复盘中…" : "AI 复盘这场面试 →"} onClick={() => analyzeReview()} />
              <div style={{ fontSize: 12, color: "#a3a8b5" }}>录音仅本地转写，不上云</div>
            </div>
          </div>
          <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: 18, fontSize: 12.5, color: "#6b7280", lineHeight: 1.8 }}>
            <div style={{ fontWeight: 700, color: "#16181d", marginBottom: 8 }}>复盘会给你什么</div>
            <div style={{ whiteSpace: "pre-line" }}>· 整体表现评分与一句话诊断{"\n"}· 高光时刻与暴露的失误{"\n"}· 被问到的问题 vs 你的准备清单{"\n"}· 每个回答的质量评估{"\n"}· 新暴露的能力缺口{"\n"}· 下一轮针对性准备清单{"\n\n"}复盘结果可一键反哺证据库与求职材料。</div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="面试复盘">
      {chips(jobs, j.id)}
      <ReviewResult j={j} rv={rv} />
    </Page>
  );
}
