"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Spinner, Empty } from "../ui";
import { RenderSheet, TplThumb } from "../SpecRenderer";
import { tplPresets, computeSpec } from "@/lib/templates";
import type { ResumeBullet } from "@/lib/types";

function TemplatePanel() {
  const resumeTpl = useStore((s) => s.resumeTpl);
  const pickTpl = useStore((s) => s.pickTpl);
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 11.5, color: "#8a919e", marginBottom: 12, lineHeight: 1.6 }}>源自 Telos 模板体系（TemplateSpec）· 内容不变，一键换装</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {tplPresets().map((p) => {
          const on = resumeTpl === p.id;
          return (
            <div key={p.id} onClick={() => pickTpl(p)} style={{ cursor: "pointer", border: "2px solid " + (on ? "#5850ec" : "#eef0f4"), borderRadius: 10, padding: 8, background: on ? "#faf9ff" : "#fff" }}>
              <TplThumb p={p} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#a3a8b5", fontFamily: "'JetBrains Mono'" }}>{p.en}</div>
                </div>
                <span style={{ width: 12, height: 12, borderRadius: 99, background: p.accent }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomPanel() {
  const resumeSpec = useStore((s) => s.resumeSpec);
  const resumeTpl = useStore((s) => s.resumeTpl);
  const spec = computeSpec(resumeSpec, resumeTpl);
  const setSpecField = useStore((s) => s.setSpecField);
  const grp = (label: string, path: string, opts: [string, string][]) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8a919e", marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {opts.map((o) => {
          const cur = path.split(".").reduce((a: unknown, k) => (a as Record<string, unknown>)[k], spec as unknown);
          const on = cur === o[0];
          return (
            <div key={o[0]} onClick={() => setSpecField(path, o[0])} style={{ cursor: "pointer", padding: "6px 11px", borderRadius: 8, fontSize: 12, fontWeight: on ? 700 : 500, background: on ? "#16181d" : "#f2f3f6", color: on ? "#fff" : "#4b5060" }}>{o[1]}</div>
          );
        })}
      </div>
    </div>
  );
  const colors: [string, string][] = [["#5850ec", "靛蓝"], ["#2f4bcf", "商务蓝"], ["#3f8f5e", "清新绿"], ["#c8622a", "暖橙"], ["#7a3f9d", "学院紫"], ["#1f2740", "墨黑"]];
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 11.5, color: "#8a919e", marginBottom: 14, lineHeight: 1.6 }}>自定义模板 = 一份受约束的设计参数（不流转代码，A4 与 ATS 始终安全）</div>
      {grp("骨架", "skeleton", [["single", "单栏"], ["sidebar-left", "左侧栏"], ["sidebar-right", "右侧栏"], ["banner", "顶部色块"]])}
      {grp("页眉对齐", "header.align", [["left", "左对齐"], ["center", "居中"]])}
      {grp("页眉风格", "header.style", [["plain", "无装饰"], ["underline", "下划线"], ["band", "色带"]])}
      {grp("姓名字号", "header.nameScale", [["md", "中"], ["lg", "大"], ["xl", "特大"]])}
      {grp("标题样式", "section.titleStyle", [["caps", "彩色"], ["underline", "下划线"], ["leftbar", "左色条"], ["band", "浅底"]])}
      {grp("标题语言", "section.titleLang", [["zh", "中文"], ["en", "英文"]])}
      {grp("密度", "section.density", [["compact", "紧凑"], ["normal", "标准"], ["loose", "宽松"]])}
      {grp("字族", "typography.font", [["sans", "无衬线"], ["serif", "衬线"], ["mono", "等宽"]])}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8a919e", marginBottom: 7 }}>强调色</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {colors.map((c) => (
            <div key={c[0]} onClick={() => setSpecField("colors.accent", c[0])} title={c[1]} style={{ cursor: "pointer", width: 26, height: 26, borderRadius: 8, background: c[0], border: spec.colors.accent === c[0] ? "2px solid #16181d" : "2px solid transparent", boxShadow: "0 0 0 2px #fff inset" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BulletCard({ b, jobId }: { b: ResumeBullet; jobId: string }) {
  const decideBullet = useStore((s) => s.decideBullet);
  const editBulletText = useStore((s) => s.editBulletText);
  const toggleHook = useStore((s) => s.toggleHook);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(b.text);
  const hasOpenSug = !!b.suggestion && !b.decision;

  return (
    <div style={{ border: "1px solid " + (hasOpenSug ? "#e4ddff" : "#eef0f4"), background: hasOpenSug ? "#fdfcff" : "#fff", borderRadius: 11, padding: 12, marginBottom: 10 }}>
      {/* 主文本 / 编辑 */}
      {editing ? (
        <div>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} style={{ width: "100%", border: "1px solid #e6e8ee", borderRadius: 8, padding: 9, fontSize: 12.5, lineHeight: 1.6, outline: "none", resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <div onClick={() => { editBulletText(jobId, b.id, draft.trim() || b.text); setEditing(false); }} style={{ cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", background: "#5850ec", padding: "5px 12px", borderRadius: 7 }}>保存</div>
            <div onClick={() => { setDraft(b.text); setEditing(false); }} style={{ cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#4b5060", background: "#f2f2f6", padding: "5px 12px", borderRadius: 7 }}>取消</div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "#2f333d", lineHeight: 1.6 }}>{b.text}</div>
      )}

      {/* AI 建议（待决策） */}
      {hasOpenSug ? (
        <div style={{ marginTop: 9, borderTop: "1px dashed #e4ddff", paddingTop: 9 }}>
          {b.risk ? <div style={{ fontSize: 10.5, color: "#d64545", fontWeight: 700, marginBottom: 5 }}>⚠ 风险修正（去夸大）</div> : <div style={{ fontSize: 10.5, color: "#5850ec", fontWeight: 700, marginBottom: 5 }}>AI 改写建议</div>}
          <div style={{ fontSize: 12, color: "#b0454a", textDecoration: "line-through", lineHeight: 1.5, marginBottom: 4 }}>{b.original || b.text}</div>
          <div style={{ fontSize: 12.5, color: "#12805c", lineHeight: 1.55, marginBottom: 5, fontWeight: 500 }}>{b.suggestion}</div>
          {b.reason ? <div style={{ fontSize: 11, color: "#8a919e", lineHeight: 1.5, marginBottom: 8 }}>{b.reason}</div> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={() => decideBullet(jobId, b.id, "accepted")} style={{ cursor: "pointer", flex: 1, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#fff", background: "#5850ec", padding: 6, borderRadius: 8 }}>接受</div>
            <div onClick={() => decideBullet(jobId, b.id, "rejected")} style={{ cursor: "pointer", flex: 1, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#4b5060", background: "#f2f2f6", padding: 6, borderRadius: 8 }}>拒绝</div>
            <div onClick={() => { setDraft(b.suggestion || b.text); setEditing(true); }} style={{ cursor: "pointer", flex: 1, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#5850ec", background: "#f1f0fb", padding: 6, borderRadius: 8 }}>修改</div>
          </div>
        </div>
      ) : b.decision ? (
        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: b.decision === "accepted" ? "#12805c" : b.decision === "edited" ? "#5850ec" : "#8a919e" }}>
          {b.decision === "accepted" ? "✓ 已接受 AI 建议" : b.decision === "edited" ? "✎ 已手动修改" : "已拒绝建议，保留原文"}
        </div>
      ) : null}

      {/* 元信息：证据 / 钩子 / 追问提示 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 9 }}>
        {b.ev ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: b.evStatus === "confirmed" ? "#12805c" : "#c2810c", background: b.evStatus === "confirmed" ? "#e6f5ee" : "#fdf3e0", padding: "3px 9px", borderRadius: 99 }}>
            ⛁ {b.ev}{b.evStatus === "pending" ? " · 证据待确认" : ""}
          </span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8a919e", background: "#f2f3f5", padding: "3px 9px", borderRadius: 99 }}>○ 未关联证据</span>
        )}
        <span
          onClick={() => toggleHook(jobId, b.id)}
          title="面试钩子：主动引导面试官追问的内容"
          style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: b.hook ? "#c8622a" : "#a3a8b5", background: b.hook ? "#fdf1e8" : "#f5f5fa", padding: "3px 9px", borderRadius: 99 }}
        >
          {b.hook ? "★ 面试钩子" : "☆ 设为钩子"}
        </span>
        {!editing ? (
          <span onClick={() => { setDraft(b.text); setEditing(true); }} style={{ cursor: "pointer", fontSize: 11, color: "#8a919e", marginLeft: "auto" }}>✎ 编辑</span>
        ) : null}
      </div>
      {b.probe ? (
        <div style={{ fontSize: 11.5, color: "#c2810c", background: "#fdf7ec", borderRadius: 8, padding: "6px 9px", marginTop: 8, lineHeight: 1.5 }}>
          ⚡ 易被追问：{b.probe}
        </div>
      ) : null}
      {b.evStatus === "none" && !hasOpenSug ? (
        <div style={{ fontSize: 11.5, color: "#8a919e", marginTop: 6 }}>提示：这条内容没有证据支撑，被追问时有风险。</div>
      ) : null}
    </div>
  );
}

function ContentPanel({ jobId }: { jobId: string }) {
  const r = useStore((s) => s.resumes[jobId])!;
  const versions = useStore((s) => s.resumeVersions[jobId]) || [];
  const saveResumeVersion = useStore((s) => s.saveResumeVersion);
  const restoreResumeVersion = useStore((s) => s.restoreResumeVersion);

  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 16, maxHeight: "calc(100vh - 320px)", overflow: "auto" }}>
      <div style={{ fontSize: 11.5, color: "#8a919e", marginBottom: 12, lineHeight: 1.6 }}>
        每条内容都关联职业证据。接受、拒绝或修改 AI 建议；把最想被问到的内容标为 ★ 面试钩子。
      </div>
      {/* 版本 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 14 }}>
        {versions.map((v) => (
          <span key={v.id} onClick={() => restoreResumeVersion(jobId, v.id)} title={"保存于 " + v.savedAt + " · 点击恢复"} style={{ cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#4b5060", background: "#f2f3f6", padding: "4px 10px", borderRadius: 99 }}>
            {v.label}
          </span>
        ))}
        <span onClick={() => saveResumeVersion(jobId)} style={{ cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#5850ec", background: "#f1f0fb", padding: "4px 10px", borderRadius: 99 }}>
          + 存为新版本
        </span>
      </div>
      {r.exp.map((x, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4b5060", marginBottom: 8 }}>{x.company} · {x.role} <span style={{ fontWeight: 400, color: "#a3a8b5" }}>{x.period}</span></div>
          {x.bullets.map((b) => (
            <BulletCard key={b.id} b={b} jobId={jobId} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Resume() {
  const s = useStore();
  const go = useStore((x) => x.go);
  const generateResume = useStore((x) => x.generateResume);
  const showToast = useStore((x) => x.showToast);

  const j = s.jobs.find((x) => x.id === s.activeJobId) || s.jobs[0];
  const r = s.resumes[j.id];
  const spec = computeSpec(s.resumeSpec, s.resumeTpl);
  const rail = s.resumeRail;
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    if (exporting || !sheetRef.current) return;
    const fileName = j.company + "-" + j.role + "-简历.pdf";
    setExporting(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: sheetRef.current.innerHTML, fileName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        showToast((err && err.error) || "导出失败（HTTP " + res.status + "）");
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast("PDF 已导出 · 本地 Chrome 渲染，ATS 可解析");
    } catch {
      showToast("导出失败：无法连接导出服务");
    } finally {
      setExporting(false);
    }
  };

  if (!r) {
    return (
      <Page title="简历编辑器" sub="一份简历绑定一个目标岗位——同一段经历在不同岗位可以有不同叙事重点。">
        {s.resumeLoading ? (
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, maxWidth: 620 }}>
            <Spinner text="AI 正在基于你的证据库为该岗位定制简历，每一句都会标注来源…" />
          </div>
        ) : (
          <Empty
            title={j.company + " · " + j.role}
            desc={
              s.analyses[j.id]
                ? "还没有为这个岗位生成简历。生成时会优先放匹配分析中「重点写」的证据，所有描述可追溯——不会自动编造数据。"
                : "建议先在申请包里分析 JD（知道重点写什么再生成），也可以直接基于已确认证据生成。"
            }
            action={
              <>
                {!s.analyses[j.id] ? <Btn label="先去分析 JD" kind="ghost" onClick={() => go("pkg")} /> : null}
                <Btn label="基于证据生成定制简历 →" onClick={() => generateResume()} />
              </>
            }
          />
        )}
      </Page>
    );
  }

  const bullets = r.exp.flatMap((x) => x.bullets);
  const confirmedN = bullets.filter((b) => b.evStatus === "confirmed").length;
  const openSugs = bullets.filter((b) => b.suggestion && !b.decision).length;
  const stale = s.qaStale[j.id] || s.mockStale[j.id];

  const seg = (k: typeof rail, label: string) => (
    <div onClick={() => useStore.setState({ resumeRail: k })} style={{ cursor: "pointer", flex: 1, textAlign: "center", padding: 7, fontSize: 12.5, fontWeight: rail === k ? 700 : 500, color: rail === k ? "#5850ec" : "#8a919e", background: rail === k ? "#fff" : "transparent", borderRadius: 8, boxShadow: rail === k ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>{label}</div>
  );

  return (
    <Page title="简历编辑器">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 372px", gap: 18, alignItems: "start" }}>
        <div style={{ background: "#eef0f4", border: "1px solid #e3e5ec", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: "#fff", borderBottom: "1px solid #f0f0f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#6b7280" }}>{j.company} 专属 · {tplPresets().find((p) => p.id === s.resumeTpl)!.name} · A4 · ATS 可解析</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={() => generateResume()} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec", fontWeight: 600 }}>重新生成</div>
              <div onClick={exportPdf} style={{ cursor: exporting ? "wait" : "pointer", fontSize: 12, padding: "4px 10px", borderRadius: 7, background: exporting ? "#6b7280" : "#16181d", color: "#fff" }}>{exporting ? "导出中…" : "导出 PDF"}</div>
            </div>
          </div>
          <div style={{ padding: "26px 30px", maxHeight: "calc(100vh - 210px)", overflow: "auto" }}>
            <div ref={sheetRef}>
              <RenderSheet r={r} spec={spec} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#eef8f2", border: "1px solid #cfeadd", borderRadius: 14, padding: "12px 14px", fontSize: 12.5, color: "#12805c", lineHeight: 1.6 }}>
            ✓ 可追溯：{bullets.length} 条内容中 {confirmedN} 条已绑定确认证据{openSugs ? "；" + openSugs + " 条 AI 建议待决策" : ""}。无自动编造数据。
          </div>
          {stale ? (
            <div onClick={() => go("qa")} style={{ cursor: "pointer", background: "#fdf7ec", border: "1px solid #f3e3c2", borderRadius: 14, padding: "11px 14px", fontSize: 12.5, color: "#c2810c", lineHeight: 1.6 }}>
              ⚠ 简历已更新——相关面试 QA{s.mockStale[j.id] ? "和模拟面试" : ""}可能需要刷新。点击去处理 →
            </div>
          ) : null}
          <div style={{ background: "#f2f3f6", borderRadius: 11, padding: 4, display: "flex", gap: 2 }}>
            {seg("content", "内容")}
            {seg("template", "模板")}
            {seg("custom", "自定义")}
          </div>
          {rail === "content" ? <ContentPanel jobId={j.id} /> : rail === "template" ? <TemplatePanel /> : <CustomPanel />}
        </div>
      </div>
    </Page>
  );
}
