"use client";

import React, { useRef, useState } from "react";
import { useStore, prepDone } from "@/lib/store";
import { Page, Btn } from "../ui";
import { parseBossJson, type BossJobDraft } from "@/lib/bossImport";
import type { Job, JobStatus } from "@/lib/types";

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e6e8ee",
  borderRadius: 9,
  padding: "9px 11px",
  fontSize: 13,
  outline: "none",
  background: "#fbfbfd",
};

function AddJobCard() {
  const draft = useStore((s) => s.jobDraft);
  const createJob = useStore((s) => s.createJob);
  if (!draft) {
    return (
      <div
        onClick={() => useStore.setState({ jobDraft: { company: "", role: "", jd: "" } })}
        style={{ cursor: "pointer", background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#5850ec", minHeight: 170 }}
      >
        <div style={{ fontSize: 26, fontWeight: 300, marginBottom: 6 }}>+</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>导入新岗位</div>
        <div style={{ fontSize: 12, color: "#8a919e", marginTop: 4 }}>粘贴 JD，创建岗位申请包</div>
      </div>
    );
  }
  return (
    <div style={{ background: "#fff", border: "1.5px solid #5850ec", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>导入新岗位</div>
      <input placeholder="公司名称 *" value={draft.company} onChange={(e) => useStore.setState({ jobDraft: { ...draft, company: e.target.value } })} style={inputStyle} />
      <input placeholder="岗位名称（如：高级前端工程师）" value={draft.role} onChange={(e) => useStore.setState({ jobDraft: { ...draft, role: e.target.value } })} style={inputStyle} />
      <textarea placeholder="粘贴完整 JD *" rows={4} value={draft.jd} onChange={(e) => useStore.setState({ jobDraft: { ...draft, jd: e.target.value } })} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <Btn label="创建申请包 →" onClick={() => createJob()} />
        <Btn label="取消" kind="ghost" onClick={() => useStore.setState({ jobDraft: null })} />
      </div>
    </div>
  );
}

function BossImportPanel({ onClose }: { onClose: () => void }) {
  const createJobsFromImport = useStore((x) => x.createJobsFromImport);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState("");
  const [drafts, setDrafts] = useState<BossJobDraft[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const runParse = (inputs: { name: string; text: string }[]) => {
    const r = parseBossJson(inputs);
    setErrors(r.errors);
    setDrafts(r.drafts.length ? r.drafts : null);
  };
  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const inputs = await Promise.all(Array.from(files).map(async (f) => ({ name: f.name, text: await f.text() })));
    runParse(inputs);
  };
  const toggle = (key: string) => setDrafts((ds) => (ds ? ds.map((d) => (d.key === key ? { ...d, selected: !d.selected } : d)) : ds));
  const selected = (drafts || []).filter((d) => d.selected);

  return (
    <div style={{ gridColumn: "1 / -1", background: "#fff", border: "1.5px solid #5850ec", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>导入 Boss 直聘数据</div>
        <div style={{ fontSize: 12, color: "#8a919e", marginTop: 4, lineHeight: 1.7 }}>
          支持 boss-zhipin-scraper 导出的 <span style={{ fontFamily: "'JetBrains Mono'" }}>boss_jobs_*.json</span> / <span style={{ fontFamily: "'JetBrains Mono'" }}>boss_details_*.json</span>（可同时选择，自动按岗位合并），也可以直接粘贴 JSON。抓取在你本地的 Chrome 完成，这里只读产物、不发请求，缺 JD 详情会如实标注。
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".json,application/json" multiple style={{ display: "none" }} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Btn label="选择 JSON 文件" onClick={() => fileRef.current?.click()} />
        <Btn label="解析粘贴内容" kind="ghost" onClick={() => (pasted.trim() ? runParse([{ name: "粘贴内容", text: pasted }]) : setErrors(["请先在右侧粘贴 JSON"]))} />
        <textarea
          placeholder="或直接把 JSON 粘贴到这里…"
          rows={2}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          style={{ flex: 1, border: "1px solid #e6e8ee", borderRadius: 9, padding: "8px 11px", fontSize: 12, outline: "none", background: "#fbfbfd", fontFamily: "'JetBrains Mono'", resize: "vertical", lineHeight: 1.6 }}
        />
      </div>
      {errors.length ? (
        <div style={{ background: "#fff5f5", border: "1px solid #f3d2d2", borderRadius: 10, padding: "9px 12px", fontSize: 12, color: "#d64545", lineHeight: 1.7 }}>
          {errors.map((e, i) => (
            <div key={i}>⚠ {e}</div>
          ))}
        </div>
      ) : null}
      {drafts ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>解析出 {drafts.length} 个岗位 · 已选 {selected.length}</div>
            <div
              onClick={() => setDrafts(drafts.map((d) => ({ ...d, selected: selected.length !== drafts.length })))}
              style={{ cursor: "pointer", fontSize: 12, color: "#5850ec", fontWeight: 600 }}
            >
              {selected.length === drafts.length ? "全不选" : "全选"}
            </div>
          </div>
          <div style={{ maxHeight: 280, overflow: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
            {drafts.map((d) => (
              <div key={d.key} onClick={() => toggle(d.key)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, border: "1px solid " + (d.selected ? "#d8d4ff" : "#eef0f4"), background: d.selected ? "#faf9ff" : "#fff", borderRadius: 10, padding: "9px 12px" }}>
                <div style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, border: "1.5px solid " + (d.selected ? "#5850ec" : "#c9ccd6"), background: d.selected ? "#5850ec" : "#fff", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{d.selected ? "✓" : ""}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{d.company}</span>
                  <span style={{ fontSize: 12.5, color: "#4b5060" }}> · {d.role}</span>
                  {d.salary ? <span style={{ marginLeft: 8, fontSize: 11, fontFamily: "'JetBrains Mono'", color: "#12805c", fontWeight: 700 }}>{d.salary}</span> : null}
                  {d.city ? <span style={{ marginLeft: 8, fontSize: 11, color: "#8a919e" }}>{d.city}</span> : null}
                </div>
                {d.jdFull ? (
                  <span style={{ fontSize: 11, color: "#a3a8b5", whiteSpace: "nowrap" }}>JD {d.jd.length} 字</span>
                ) : (
                  <span style={{ fontSize: 11, color: "#c2810c", whiteSpace: "nowrap" }}>仅摘要 · 缺 JD 详情</span>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn
              label={"创建 " + selected.length + " 个申请包 →"}
              onClick={() => {
                if (!selected.length) return;
                createJobsFromImport(selected.map((d) => ({ company: d.company, role: d.role, jd: d.jd })));
                onClose();
              }}
            />
            <Btn label="取消" kind="ghost" onClick={onClose} />
            <span style={{ fontSize: 11.5, color: "#a3a8b5" }}>已存在相同「公司 + 岗位」的会自动跳过，不会覆盖你已准备的内容。</span>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Agent ①：批量分析进度 + 按经历覆盖度排序的准备优先级面板 */
function PriorityPanel() {
  const s = useStore();
  const openPackage = useStore((x) => x.openPackage);
  const batchAnalyze = useStore((x) => x.batchAnalyze);
  const pending = s.jobs.filter((j) => j.jd.trim() && !s.analyses[j.id]);
  const ranked = s.jobs
    .filter((j) => s.matches[j.id])
    .map((j) => ({ j, m: s.matches[j.id] }))
    .sort((a, b) => b.m.metrics.coverage - a.m.metrics.coverage);
  const b = s.batch;
  if (!pending.length && ranked.length < 2 && !b) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14.5 }}>准备优先级</div>
          <div style={{ fontSize: 12, color: "#8a919e", marginTop: 3 }}>
            按经历覆盖度排序，回答「这批岗位先准备哪个」。只做分析排序，不替你生成任何内容。
          </div>
        </div>
        {b?.running ? (
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "#5850ec", fontWeight: 600 }}>
            <span style={{ width: 14, height: 14, border: "2px solid #ece9ff", borderTopColor: "#5850ec", borderRadius: 99, animation: "pcvSpin .8s linear infinite" }} />
            正在分析 {b.done + 1}/{b.total}{b.current ? "：" + b.current : ""}
          </div>
        ) : pending.length ? (
          <Btn label={"批量分析 " + pending.length + " 个未分析岗位"} onClick={() => batchAnalyze()} />
        ) : null}
      </div>
      {ranked.length >= 2 ? (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
          {ranked.map(({ j, m }, i) => {
            const gap = m.none.length
              ? "缺经历支撑 " + m.none.length + " 项：" + m.none.map((x) => x.req).filter(Boolean).slice(0, 2).join("、")
              : m.weak.length
              ? m.weak.length + " 项弱匹配待澄清"
              : "经历覆盖良好";
            return (
              <div
                key={j.id}
                onClick={() => openPackage(j.id)}
                className="pcv-row"
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderTop: i ? "1px solid #f2f2f6" : "none", cursor: "pointer", borderRadius: 8 }}
              >
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 700, color: i === 0 ? "#5850ec" : "#a3a8b5", width: 26, flexShrink: 0 }}>#{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {j.company} · {j.role}
                    {i === 0 ? <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#12805c", background: "#e6f5ee", padding: "1px 8px", borderRadius: 99 }}>先准备这个</span> : null}
                  </div>
                  <div style={{ fontSize: 11.5, color: m.none.length ? "#c2810c" : "#8a919e", marginTop: 2 }}>{gap}{m.metrics.risk ? " · 风险 " + m.metrics.risk + " 处" : ""}</div>
                </div>
                <div style={{ width: 120, flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#8a919e", marginBottom: 3 }}>
                    <span>覆盖度</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: "#16181d" }}>{m.metrics.coverage}</span>
                  </div>
                  <div style={{ height: 5, background: "#eee", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: m.metrics.coverage + "%", height: "100%", background: i === 0 ? "#12805c" : "#5850ec" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** 准备完成度小条（五步）——和投递进度是两回事，分开标注 */
function PrepBar({ done }: { done: number }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8a919e", marginBottom: 4 }}>
        <span>准备完成度</span>
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: "#16181d" }}>{done}/5</span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} style={{ flex: 1, height: 5, borderRadius: 99, background: i < done ? "#5850ec" : "#eceae4" }} />
        ))}
      </div>
    </div>
  );
}

function JobCard({ j }: { j: Job }) {
  const s = useStore();
  const openPackage = useStore((x) => x.openPackage);
  const moveJobStatus = useStore((x) => x.moveJobStatus);
  const done = prepDone(s, j.id);
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
      <div onClick={() => openPackage(j.id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: "#16181d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>{j.logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{j.company}</div>
          <div style={{ fontSize: 12, color: "#8a919e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.role}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 10.5, color: "#a3a8b5" }}>投递进度</span>
          <div onClick={() => moveJobStatus(j.id, -1)} title="上一状态" style={{ cursor: "pointer", fontSize: 14, color: "#c9ccd6", lineHeight: 1, padding: "0 2px" }}>‹</div>
          <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: "#f1f0fb", color: "#5850ec" }}>{j.statusLabel}</span>
          <div onClick={() => moveJobStatus(j.id, 1)} title="下一状态" style={{ cursor: "pointer", fontSize: 14, color: "#c9ccd6", lineHeight: 1, padding: "0 2px" }}>›</div>
        </div>
        <span style={{ fontSize: 11.5, color: "#a3a8b5" }}>更新 {j.updated}</span>
      </div>
      <PrepBar done={done} />
      {j.match ? (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#8a919e" }}>
          <span>经历覆盖度（来自岗位分析）</span>
          <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: "#16181d" }}>{j.match}/100</span>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#c2810c" }}>尚未分析岗位</div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", borderTop: "1px solid #f2f2f6", paddingTop: 10 }}>
        <div onClick={() => openPackage(j.id)} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#5850ec" }}>去准备这个岗位 →</div>
      </div>
    </div>
  );
}

const STATUS_ORDER: JobStatus[] = ["saved", "preparing", "applied", "replied", "interviewing", "offer", "rejected"];
const STATUS_LABELS: Record<JobStatus, string> = { saved: "收藏", preparing: "准备投递", applied: "已投递", replied: "已回复", interviewing: "面试中", offer: "Offer", rejected: "拒绝" };

/** 「我的申请」视图：按投递进度分组，回答「我投到哪一步了」 */
function TrackView() {
  const s = useStore();
  const openPackage = useStore((x) => x.openPackage);
  const moveJobStatus = useStore((x) => x.moveJobStatus);
  const groups = STATUS_ORDER.map((st) => ({ st, jobs: s.jobs.filter((j) => j.status === st) })).filter((g) => g.jobs.length);
  if (!groups.length) {
    return (
      <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: "40px 24px", textAlign: "center", color: "#6b7280", fontSize: 13, lineHeight: 1.8 }}>
        还没有任何岗位。切到「找目标岗位」新增一个，或导入 Boss 直聘数据。
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontSize: 12, color: "#8a919e", lineHeight: 1.6 }}>
        <b style={{ color: "#4b5060" }}>投递进度</b> = 招聘流程走到哪（收藏 → 投递 → 回复 → 面试 → 结果）；每张卡里的<b style={{ color: "#4b5060" }}>准备完成度</b> = 分析/简历/问题/模拟/复盘五步做完多少——两者是独立的两件事。
      </div>
      {groups.map((g) => (
        <div key={g.st}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800 }}>{STATUS_LABELS[g.st]}</span>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11.5, color: "#8a919e" }}>{g.jobs.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {g.jobs.map((j) => {
              const done = prepDone(s, j.id);
              return (
                <div key={j.id} className="pcv-row" style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #ececf2", borderRadius: 13, padding: "12px 16px" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "#16181d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{j.logo}</div>
                  <div onClick={() => openPackage(j.id)} style={{ cursor: "pointer", flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{j.company} <span style={{ fontWeight: 400, color: "#8a919e", fontSize: 12 }}>{j.role}</span></div>
                    <div style={{ fontSize: 11, color: "#a3a8b5", marginTop: 2 }}>更新 {j.updated}</div>
                  </div>
                  <div style={{ width: 130, flexShrink: 0 }}>
                    <PrepBar done={done} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                    <div onClick={() => moveJobStatus(j.id, -1)} title="上一状态" style={{ cursor: "pointer", fontSize: 15, color: "#c9ccd6", padding: "0 3px" }}>‹</div>
                    <div onClick={() => moveJobStatus(j.id, 1)} title="下一状态" style={{ cursor: "pointer", fontSize: 15, color: "#c9ccd6", padding: "0 3px" }}>›</div>
                  </div>
                  <div onClick={() => openPackage(j.id)} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#5850ec", flexShrink: 0 }}>准备 →</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Jobs() {
  const s = useStore();
  const view = useStore((x) => x.jobsView);
  const [bossOpen, setBossOpen] = useState(false);

  const seg = (k: "find" | "track", label: string) => (
    <div
      onClick={() => useStore.setState({ jobsView: k })}
      style={{ cursor: "pointer", padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: view === k ? 700 : 500, background: view === k ? "#16181d" : "#fff", color: view === k ? "#fff" : "#4b5060", border: "1px solid " + (view === k ? "#16181d" : "#e3e5ec") }}
    >
      {label}
    </div>
  );

  return (
    <Page
      title="岗位与进度"
      sub="「找目标岗位」新增和分析岗位；「我的申请」按投递进度看全局。每个岗位都有自己独立的简历、面试问题、模拟和复盘。"
    >
      <div style={{ display: "flex", gap: 9, marginBottom: 18 }}>
        {seg("find", "找目标岗位")}
        {seg("track", "我的申请")}
      </div>
      {view === "track" ? (
        <TrackView />
      ) : (
        <>
          <PriorityPanel />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {bossOpen ? <BossImportPanel onClose={() => setBossOpen(false)} /> : null}
            {s.jobs.map((j) => (
              <JobCard key={j.id} j={j} />
            ))}
            <AddJobCard />
            {!bossOpen ? (
              <div
                onClick={() => setBossOpen(true)}
                style={{ cursor: "pointer", background: "#fbfbfd", border: "1px dashed #d5d8e3", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#4b5060", minHeight: 170 }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>⇪</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>导入 Boss 直聘数据</div>
                <div style={{ fontSize: 12, color: "#8a919e", marginTop: 4, textAlign: "center" }}>boss_jobs / boss_details JSON<br />批量创建岗位</div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </Page>
  );
}
