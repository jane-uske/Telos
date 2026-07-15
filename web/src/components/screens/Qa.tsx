"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Spinner, Empty, JobChips, PrepPill, prepMeta } from "../ui";
import type { QaItem, QaPrep, QaCategory } from "@/lib/types";

const catLabels: Record<QaCategory, string> = {
  intro: "自我介绍",
  project: "项目讲述",
  resume: "简历追问",
  tech: "技术",
  biz: "业务",
  collab: "协作",
  risk: "风险",
  reverse: "反问",
};

const prepOrder: QaPrep[] = ["todo", "doing", "done", "risk"];

function QaCard({ q, jobId, bulletText }: { q: QaItem; jobId: string; bulletText: string | null }) {
  const setQaPrep = useStore((s) => s.setQaPrep);
  const editQaAnswer = useStore((s) => s.editQaAnswer);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(q.answer);

  return (
    <div style={{ background: "#fff", border: "1px solid " + (q.highRisk ? "#f3d1d1" : "#ececf2"), borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#5850ec", background: "#f1f0fb", padding: "2px 8px", borderRadius: 5 }}>{catLabels[q.cat] || q.cat}</span>
            {q.highRisk ? <span style={{ fontSize: 10.5, fontWeight: 700, color: "#d64545", background: "#fff0f0", padding: "2px 8px", borderRadius: 5 }}>高风险</span> : null}
            {q.origin === "real" ? <span style={{ fontSize: 10.5, fontWeight: 700, color: "#c8622a", background: "#fdf1e8", padding: "2px 8px", borderRadius: 5 }}>来自真实面试</span> : q.origin === "mock" ? <span style={{ fontSize: 10.5, fontWeight: 700, color: "#3b5bdb", background: "#eef3ff", padding: "2px 8px", borderRadius: 5 }}>来自模拟</span> : null}
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#16181d", lineHeight: 1.5 }}>{q.q}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, fontSize: 11.5, color: "#8a919e" }}>
            {bulletText ? <span title={bulletText}>📄 来自简历：{bulletText.slice(0, 22)}…</span> : null}
            {q.jdReq ? <span>🎯 对应要求：{q.jdReq}</span> : null}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <PrepPill prep={q.prep} />
          <span style={{ color: "#c9ccd6", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open ? (
        <div style={{ marginTop: 12, borderTop: "1px solid #f2f2f6", paddingTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#a3a8b5" }}>我的准备答案</div>
            {!editing ? (
              <div onClick={() => { setDraft(q.answer); setEditing(true); }} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec", fontWeight: 600 }}>✎ 编辑答案</div>
            ) : null}
          </div>
          {editing ? (
            <div>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} style={{ width: "100%", border: "1px solid #e6e8ee", borderRadius: 10, padding: 11, fontSize: 12.5, lineHeight: 1.7, outline: "none", resize: "vertical", background: "#fbfbfd" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <div onClick={() => { editQaAnswer(jobId, q.id, draft); setEditing(false); }} style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", background: "#5850ec", padding: "6px 14px", borderRadius: 8 }}>保存</div>
                <div onClick={() => setEditing(false)} style={{ cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#4b5060", background: "#f2f2f6", padding: "6px 14px", borderRadius: 8 }}>取消</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: "#2f333d", lineHeight: 1.8, whiteSpace: "pre-wrap", background: "#fbfbfd", border: "1px solid #f0f0f5", borderRadius: 10, padding: "12px 14px" }}>{q.answer || "（还没有写答案）"}</div>
          )}
          {q.followUps?.length ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#c2810c", marginBottom: 6 }}>⚡ 面试官可能继续深挖</div>
              {q.followUps.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, display: "flex", gap: 6 }}>
                  <span style={{ color: "#e2c088" }}>·</span>{f}
                </div>
              ))}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center" }}>
            <span style={{ fontSize: 11.5, color: "#a3a8b5", marginRight: 4 }}>标记状态：</span>
            {prepOrder.map((p) => {
              const meta = prepMeta(p);
              const on = q.prep === p;
              return (
                <div key={p} onClick={() => setQaPrep(jobId, q.id, p)} style={{ cursor: "pointer", fontSize: 11.5, fontWeight: on ? 700 : 500, color: on ? meta.fg : "#8a919e", background: on ? meta.bg : "#f5f5fa", padding: "4px 11px", borderRadius: 99 }}>
                  {meta.label}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Qa() {
  const s = useStore();
  const go = useStore((x) => x.go);
  const openPackage = useStore((x) => x.openPackage);
  const generateQa = useStore((x) => x.generateQa);

  const j = s.jobs.find((x) => x.id === s.activeJobId) || s.jobs[0];
  const items = s.qa[j.id] || [];
  const r = s.resumes[j.id];
  const filt = s.qaFilter;
  const bulletById = new Map((r?.exp || []).flatMap((x) => x.bullets).map((b) => [b.id, b.text]));

  if (!items.length) {
    return (
      <Page title="面试 QA" sub="基于当前岗位、当前简历和职业证据生成——每题都标注来源、对应的岗位要求和准备状态。">
        <JobChips jobs={s.jobs} activeId={j.id} onPick={(id) => openPackage(id)} />
        {s.qaLoading ? (
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, maxWidth: 620 }}>
            <Spinner text="正在从简历逐条预测问题、生成追问链与准备答案…" />
          </div>
        ) : (
          <Empty
            title={j.company + " · " + j.role}
            desc={r ? "还没有生成面试 QA。会包含：30 秒 / 2 分钟自我介绍、项目讲述、每条简历内容的预测问题与深挖追问、技术 / 业务 / 协作 / 风险 / 反问清单。" : "面试 QA 基于岗位专属简历生成——请先生成这个岗位的简历。"}
            action={r ? <Btn label="生成面试 QA →" onClick={() => generateQa()} /> : <Btn label="先去生成简历" onClick={() => go("resume")} />}
          />
        )}
      </Page>
    );
  }

  const counts: Record<string, number> = { all: items.length };
  (Object.keys(catLabels) as QaCategory[]).forEach((c) => (counts[c] = items.filter((q) => q.cat === c).length));
  const list = items.filter((q) => filt === "all" || q.cat === filt);
  const riskCount = items.filter((q) => q.prep === "risk" || (q.highRisk && q.prep !== "done")).length;
  const doneCount = items.filter((q) => q.prep === "done").length;

  const fbtn = (k: string, label: string) =>
    counts[k] ? (
      <div key={k} onClick={() => useStore.setState({ qaFilter: k })} style={{ cursor: "pointer", padding: "6px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: 600, background: filt === k ? "#16181d" : "#fff", color: filt === k ? "#fff" : "#4b5060", border: "1px solid " + (filt === k ? "#16181d" : "#e3e5ec") }}>
        {label} {counts[k]}
      </div>
    ) : null;

  return (
    <Page
      title="面试 QA"
      sub={"共 " + items.length + " 题 · 已掌握 " + doneCount + " · 需要注意 " + riskCount + " 题高风险。逐题写好答案后，去模拟面试检验。"}
      actions={
        <div style={{ display: "flex", gap: 10 }}>
          <Btn label={s.qaLoading ? "重新生成中…" : "重新生成 QA"} kind="ghost" onClick={() => generateQa()} />
          <Btn label="去模拟面试 →" kind="dark" onClick={() => go("mock")} />
        </div>
      }
    >
      <JobChips jobs={s.jobs} activeId={j.id} onPick={(id) => openPackage(id)} />
      {s.qaStale[j.id] ? (
        <div style={{ background: "#fdf7ec", border: "1px solid #f3e3c2", borderRadius: 12, padding: "11px 14px", fontSize: 12.5, color: "#c2810c", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠ 简历内容已更新——以下 QA 基于旧版简历生成，可能需要刷新。</span>
          <span onClick={() => generateQa()} style={{ cursor: "pointer", fontWeight: 700, color: "#5850ec" }}>重新生成 →</span>
        </div>
      ) : null}
      {s.qaLoading ? (
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
          <Spinner text="正在重新生成面试 QA…" />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {fbtn("all", "全部")}
            {(Object.keys(catLabels) as QaCategory[]).map((c) => fbtn(c, catLabels[c]))}
          </div>
          {list.map((q) => (
            <QaCard key={q.id} q={q} jobId={j.id} bulletText={q.fromBullet ? bulletById.get(q.fromBullet) || null : null} />
          ))}
        </>
      )}
    </Page>
  );
}
