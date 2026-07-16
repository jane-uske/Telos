"use client";

import React, { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/lib/store";

const noopSubscribe = () => () => {};
import { Page, Btn, Spinner, Empty } from "../ui";
import { RenderSheet, TplThumb } from "../SpecRenderer";
import { GenBadge } from "../AuthGate";
import { tplPresets, computeSpec } from "@/lib/templates";
import { BASE_RESUME_ID, type ResumeBullet } from "@/lib/types";

/** 编辑对象切换：通用简历 ↔ 各岗位的定制版。样式与 JobChips 对齐 */
function ScopeChips({ activeKey }: { activeKey: string }) {
  const jobs = useStore((s) => s.jobs);
  const chip = (on: boolean): React.CSSProperties => ({
    padding: "7px 13px",
    borderRadius: 99,
    fontSize: 12.5,
    fontWeight: 600,
    background: on ? "#16181d" : "#fff",
    color: on ? "#fff" : "#4b5060",
    border: "1px solid " + (on ? "#16181d" : "#e6e3db"),
  });
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
      <div onClick={() => useStore.setState({ resumeScope: "base" })} className="pcv-press" style={chip(activeKey === BASE_RESUME_ID)}>
        通用简历
      </div>
      {jobs.length ? <span style={{ width: 1, height: 18, background: "#e6e3db" }} /> : null}
      {jobs.map((x) => (
        <div
          key={x.id}
          onClick={() => useStore.setState({ activeJobId: x.id, resumeScope: "job" })}
          className="pcv-press"
          style={chip(activeKey === x.id)}
        >
          {x.company} · {x.role.split("·")[0].trim()}
        </div>
      ))}
    </div>
  );
}

/** 简历页眉个人信息：只存本机，打印/导出时进入简历页眉 */
function ProfilePanel() {
  const profile = useStore((s) => s.profile);
  const patchProfile = useStore((s) => s.patchProfile);
  const input: React.CSSProperties = { width: "100%", border: "1px solid #e6e8ee", borderRadius: 9, padding: "9px 11px", fontSize: 13, outline: "none", background: "#fbfbfd" };
  const row = (label: string, key: keyof typeof profile, placeholder: string) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8a919e", marginBottom: 5 }}>{label}</div>
      <input style={input} value={profile[key]} placeholder={placeholder} onChange={(e) => patchProfile({ [key]: e.target.value })} />
    </div>
  );
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 11.5, color: "#8a919e", marginBottom: 14, lineHeight: 1.6 }}>
        显示在简历页眉。只保存在本机浏览器，不上传。没填的项不会出现在简历上。
      </div>
      {row("姓名", "name", "你的姓名")}
      {row("头衔 / 定位", "headline", "如：高级前端工程师")}
      {row("城市", "city", "如：杭州")}
      {row("邮箱", "email", "you@example.com")}
      {row("链接", "link", "GitHub / 个人主页（可选）")}
    </div>
  );
}

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
  // 经历关联以稳定 ID 为准：改经历标题不断联；ID 找不到时退回标题快照并提示
  const liveTitle = useStore((s) => (b.evId ? s.evidence.find((e) => e.id === b.evId)?.title || null : null));
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

      {/* 元信息：来源经历 / 对应岗位要求 / 钩子 / 追问提示 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 9 }}>
        {liveTitle || b.ev ? (
          <span title="这条内容的来源经历" style={{ fontSize: 11, fontWeight: 600, color: b.evStatus === "confirmed" ? "#12805c" : "#c2810c", background: b.evStatus === "confirmed" ? "#e6f5ee" : "#fdf3e0", padding: "3px 9px", borderRadius: 99 }}>
            ⛁ {liveTitle || b.ev}
            {b.evStatus === "pending" ? " · 经历待确认" : ""}
            {!liveTitle && b.ev ? " · 原经历已不在库中" : ""}
          </span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8a919e", background: "#f2f3f5", padding: "3px 9px", borderRadius: 99 }}>○ 未关联经历</span>
        )}
        {b.jdReq ? (
          <span title="这条内容对应的岗位要求" style={{ fontSize: 11, fontWeight: 600, color: "#3b5bdb", background: "#eef3ff", padding: "3px 9px", borderRadius: 99 }}>
            🎯 {b.jdReq}
          </span>
        ) : null}
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
        <div style={{ fontSize: 11.5, color: "#8a919e", marginTop: 6 }}>提示：这条内容没有经历支撑，被追问时有风险。</div>
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
        每条内容都关联你整理好的经历。接受、拒绝或修改 AI 建议；把最想被问到的内容标为 ★ 面试钩子。
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
  const importBaseToJob = useStore((x) => x.importBaseToJob);
  const showToast = useStore((x) => x.showToast);

  const j = s.jobs.find((x) => x.id === s.activeJobId) || s.jobs[0] || null;
  // 没有岗位时只能编辑通用简历；有岗位时由 scope 决定编辑哪一份
  const base = s.resumeScope === "base" || !j;
  const key = base ? BASE_RESUME_ID : j!.id;
  const r = s.resumes[key];
  const spec = computeSpec(s.resumeSpec, s.resumeTpl);
  const rail = s.resumeRail;
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  // 打印挂载点走 portal 到 body：打印时隐藏应用本体、只输出干净简历（可靠分页）。
  // SSR/注水期间不渲染 portal，客户端接管后再挂。
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const sub = base
    ? "一份不绑定岗位的通用简历，只基于你已确认的经历。添加目标岗位后，可以再为具体岗位派生定制版。"
    : "这份简历绑定「" + j!.company + "」——同一段经历在不同岗位可以有不同叙事重点。";

  // 用通用简历打底。覆盖已有内容前先问一句——原内容会被 store 自动存成一个版本
  const hasBase = !!s.resumes[BASE_RESUME_ID];
  const importBase = () => {
    if (r && !window.confirm("用通用简历覆盖当前「" + j!.company + "」的这份简历？\n\n当前内容会先存为一个版本，之后可以在「内容」面板里恢复。")) return;
    importBaseToJob();
  };

  // 默认导出方式：浏览器打印 / 另存为 PDF（不依赖服务端 Chrome，Vercel 可用）。
  // 打印时只渲染 #rr-print-mount 里 internal=false 的干净版本——
  // 内部标注（已核验/细节不足/★钩子/追问提示）绝不出现在给企业的简历里。
  const printPdf = () => {
    if (!s.profile.name.trim()) showToast("提示：还没填姓名——右侧「个人信息」补全后简历页眉才完整");
    setTimeout(() => window.print(), 50);
  };

  const exportPdf = async () => {
    if (exporting || !sheetRef.current) return;
    const fileName = base ? (s.profile.name.trim() || "我") + "-通用简历.pdf" : j!.company + "-" + j!.role + "-简历.pdf";
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
    // 一条能写进简历的经历都没有——生成出来只会是空壳，先把人送去整理经历
    const usableEv = s.evidence.filter((e) => e.status !== "insufficient");
    return (
      <Page title="简历编辑器" sub={sub}>
        <ScopeChips activeKey={key} />
        {s.resumeLoading ? (
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, maxWidth: 620 }}>
            <Spinner text={base ? "正在基于你整理好的经历编译通用简历，每一句都会标注来源…" : "正在基于你整理好的经历为该岗位定制简历，每一句都会标注来源…"} />
          </div>
        ) : !usableEv.length ? (
          <Empty
            title="还没有可写进简历的经历"
            desc="简历只会用你整理并确认过的经历拼装，不会替你编造。先去导入旧简历或用 AI 访谈整理几段经历。"
            action={<Btn label="去整理我的经历 →" onClick={() => go("evidence")} />}
          />
        ) : base ? (
          <Empty
            title="还没有通用简历"
            desc={"基于你已确认的 " + usableEv.length + " 段经历生成一份不绑定岗位的通用简历——突出经历本身最有说服力的地方。之后添加目标岗位时，可以再派生岗位定制版。"}
            action={<Btn label="基于经历生成通用简历 →" onClick={() => generateResume()} />}
          />
        ) : (
          <Empty
            title={j!.company + " · " + j!.role}
            desc={
              (s.analyses[j!.id]
                ? "还没有为这个岗位生成简历。生成时会遵守匹配分析：强匹配优先突出、弱匹配谨慎表达、没有经历支撑的不虚构。"
                : "建议先在「准备这个岗位」里分析岗位（知道重点写什么再生成），也可以直接基于已确认经历生成。") +
              (hasBase ? "你已经有一份通用简历，也可以拿它打底再按这个岗位改。" : "")
            }
            action={
              <>
                {hasBase ? <Btn label="用通用简历打底" kind="soft" onClick={importBase} /> : null}
                {!s.analyses[j!.id] ? <Btn label="先去分析岗位" kind="ghost" onClick={() => go("pkg")} /> : null}
                <Btn label="基于经历生成定制简历 →" onClick={() => generateResume()} />
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
  // 通用简历不挂 QA / 模拟面试，改不脏任何东西
  const stale = base ? false : s.qaStale[j!.id] || s.mockStale[j!.id];

  const seg = (k: typeof rail, label: string) => (
    <div onClick={() => useStore.setState({ resumeRail: k })} style={{ cursor: "pointer", flex: 1, textAlign: "center", padding: 7, fontSize: 12.5, fontWeight: rail === k ? 700 : 500, color: rail === k ? "#5850ec" : "#8a919e", background: rail === k ? "#fff" : "transparent", borderRadius: 8, boxShadow: rail === k ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>{label}</div>
  );

  const genSrc = s.genSource["resume:" + key];

  return (
    <Page title="简历编辑器" sub={sub}>
      <ScopeChips activeKey={key} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 372px", gap: 18, alignItems: "start" }}>
        <div style={{ background: "#eef0f4", border: "1px solid #e3e5ec", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: "#fff", borderBottom: "1px solid #f0f0f5", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#6b7280", display: "flex", alignItems: "center", gap: 8 }}>
              <span>{base ? "通用 · 不绑定岗位" : j!.company + " 专属"} · {tplPresets().find((p) => p.id === s.resumeTpl)!.name} · A4</span>
              <GenBadge source={genSrc} />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div onClick={() => generateResume()} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec", fontWeight: 600 }}>重新生成</div>
              {!base && hasBase ? (
                <div onClick={importBase} title="用通用简历的内容覆盖这份岗位简历——覆盖前会先存一个版本" style={{ cursor: "pointer", fontSize: 12, color: "#8a919e" }}>
                  用通用简历打底
                </div>
              ) : null}
              <div onClick={exportPdf} title="需要本机 Chrome 的服务端导出（部署到 Vercel 时不可用，请用「打印」）" style={{ cursor: exporting ? "wait" : "pointer", fontSize: 12, color: "#8a919e" }}>{exporting ? "导出中…" : "服务端导出"}</div>
              <div onClick={printPdf} style={{ cursor: "pointer", fontSize: 12, padding: "4px 12px", borderRadius: 7, background: "#16181d", color: "#fff", fontWeight: 600 }}>打印 / 保存 PDF</div>
            </div>
          </div>
          <div style={{ padding: "26px 30px", maxHeight: "calc(100vh - 210px)", overflow: "auto" }}>
            <div ref={sheetRef}>
              <RenderSheet r={r} spec={spec} profile={s.profile} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#eef8f2", border: "1px solid #cfeadd", borderRadius: 14, padding: "12px 14px", fontSize: 12.5, color: "#12805c", lineHeight: 1.6 }}>
            ✓ 可追溯：{bullets.length} 条内容中 {confirmedN} 条已绑定确认经历{openSugs ? "；" + openSugs + " 条建议待决策" : ""}。无自动编造数据；打印版不含任何内部标注。
          </div>
          {stale ? (
            <div onClick={() => go("qa")} style={{ cursor: "pointer", background: "#fdf7ec", border: "1px solid #f3e3c2", borderRadius: 14, padding: "11px 14px", fontSize: 12.5, color: "#c2810c", lineHeight: 1.6 }}>
              ⚠ 简历已更新——相关面试问题{s.mockStale[j!.id] ? "和模拟面试" : ""}可能需要刷新。点击去处理 →
            </div>
          ) : null}
          <div style={{ background: "#f2f3f6", borderRadius: 11, padding: 4, display: "flex", gap: 2 }}>
            {seg("content", "内容")}
            {seg("profile", "个人信息")}
            {seg("template", "模板")}
            {seg("custom", "自定义")}
          </div>
          {rail === "content" ? <ContentPanel jobId={key} /> : rail === "profile" ? <ProfilePanel /> : rail === "template" ? <TemplatePanel /> : <CustomPanel />}
        </div>
      </div>

      {/* 打印挂载点：无内部标注的干净版，仅 @media print 时可见（见 globals.css） */}
      {mounted
        ? createPortal(
            <div id="rr-print-mount" aria-hidden>
              <RenderSheet r={r} spec={spec} profile={s.profile} internal={false} print />
            </div>,
            document.body
          )
        : null}
    </Page>
  );
}
