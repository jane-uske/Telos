"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Spinner } from "../ui";
import { RenderSheet, TplThumb } from "../SpecRenderer";
import { tplPresets, computeSpec } from "@/lib/templates";

interface Diff {
  original: string;
  revised: string;
  reason: string;
  ev: string | null;
  risk?: boolean;
}

const resumeDiffs: Diff[] = [
  { original: "负责协作编辑器，做过一些性能优化", revised: "主导实时协作编辑器冲突算法重构，用 CRDT 替换 OT，将多人同编延迟从 800ms 降至 120ms", reason: "突出个人主导 + 量化结果，命中「React 深度经验」", ev: "实时协作编辑器" },
  { original: "参与商家中台开发", revised: "负责商家中台前端性能治理，首屏 5.1s→1.6s，LCP 达标率 62%→94%", reason: "补充可量化成果，命中「前端性能优化」", ev: "电商中台前端性能优化" },
  { original: "支撑日活 3 万团队", revised: "支撑高并发多人协同场景", reason: "原「日活 3 万」缺少数据来源，改为稳妥表述避免夸大", ev: null, risk: true },
  { original: "熟悉各种前端技术", revised: "精通 React / TypeScript，熟悉 Node.js / Go 与前端工程化", reason: "笼统表述改为可核验的具体技术栈", ev: null },
];

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

function DiffPanel() {
  const diffDecisions = useStore((s) => s.diffDecisions);
  const decideDiff = useStore((s) => s.decideDiff);
  const go = useStore((s) => s.go);
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>AI 改写差异</div>
      <div style={{ fontSize: 11.5, color: "#8a919e", marginBottom: 12 }}>逐条接受或拒绝，也可手动微调</div>
      {resumeDiffs.map((d, i) => {
        const dec = diffDecisions[i];
        return (
          <div key={i} style={{ border: "1px solid #eef0f4", borderRadius: 11, padding: 12, marginBottom: 10, opacity: dec === "reject" ? 0.5 : 1 }}>
            {d.risk ? <div style={{ fontSize: 10.5, color: "#d64545", fontWeight: 700, marginBottom: 6 }}>⚠ 风险修正</div> : null}
            <div style={{ fontSize: 12, color: "#b0454a", textDecoration: "line-through", lineHeight: 1.5, marginBottom: 5 }}>{d.original}</div>
            <div style={{ fontSize: 12.5, color: "#12805c", lineHeight: 1.55, marginBottom: 6, fontWeight: 500 }}>{d.revised}</div>
            <div style={{ fontSize: 11, color: "#8a919e", lineHeight: 1.5, marginBottom: 9 }}>{d.reason}</div>
            {dec ? (
              <div style={{ fontSize: 11.5, fontWeight: 700, color: dec === "accept" ? "#12805c" : "#8a919e" }}>{dec === "accept" ? "✓ 已接受" : "已拒绝，保留原文"}</div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <div onClick={() => decideDiff(i, "accept")} style={{ cursor: "pointer", flex: 1, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#fff", background: "#5850ec", padding: 7, borderRadius: 8 }}>接受</div>
                <div onClick={() => decideDiff(i, "reject")} style={{ cursor: "pointer", flex: 1, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#4b5060", background: "#f2f2f6", padding: 7, borderRadius: 8 }}>拒绝</div>
              </div>
            )}
          </div>
        );
      })}
      <Btn label="生成配套求职材料 →" kind="dark" onClick={() => go("materials")} />
    </div>
  );
}

export default function Resume() {
  const jobs = useStore((s) => s.jobs);
  const activeJobId = useStore((s) => s.activeJobId);
  const resumes = useStore((s) => s.resumes);
  const resumeLoading = useStore((s) => s.resumeLoading);
  const resumeTpl = useStore((s) => s.resumeTpl);
  const rail = useStore((s) => s.resumeRail);
  const resumeSpec = useStore((s) => s.resumeSpec);
  const spec = computeSpec(resumeSpec, resumeTpl);
  const generateResume = useStore((s) => s.generateResume);
  const showToast = useStore((s) => s.showToast);
  const setScreen = useStore((s) => s.setScreen);

  const j = jobs.find((x) => x.id === activeJobId) || jobs[0];
  const r = resumes[j.id];

  if (!r) {
    return (
      <Page title="定制简历生成">
        <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 16, padding: 40, maxWidth: 620, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{j.company} · {j.role}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 18, lineHeight: 1.7 }}>
            {resumeLoading ? "AI 正在基于你的证据库定制简历，每一句都会标注来源…" : "还没有为这个岗位生成简历。生成时会优先放最相关的证据，且所有描述都可追溯——不会自动编造数据。"}
          </div>
          {resumeLoading ? <Spinner text="生成中…" /> : <div style={{ display: "inline-flex" }}><Btn label="基于证据生成定制简历 →" onClick={() => generateResume()} /></div>}
        </div>
      </Page>
    );
  }

  const seg = (k: typeof rail, label: string) => (
    <div onClick={() => useStore.setState({ resumeRail: k })} style={{ cursor: "pointer", flex: 1, textAlign: "center", padding: 7, fontSize: 12.5, fontWeight: rail === k ? 700 : 500, color: rail === k ? "#5850ec" : "#8a919e", background: rail === k ? "#fff" : "transparent", borderRadius: 8, boxShadow: rail === k ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>{label}</div>
  );

  return (
    <Page title="定制简历生成">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 372px", gap: 18, alignItems: "start" }}>
        <div style={{ background: "#eef0f4", border: "1px solid #e3e5ec", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: "#fff", borderBottom: "1px solid #f0f0f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#6b7280" }}>模板 · {tplPresets().find((p) => p.id === resumeTpl)!.name} · A4 · ATS 可解析</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={() => setScreen("publicResume")} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec", fontWeight: 600 }}>预览分享页 ↗</div>
              <div onClick={() => showToast("已导出文字版 PDF（ATS 可解析，演示）")} style={{ cursor: "pointer", fontSize: 12, padding: "4px 10px", borderRadius: 7, background: "#16181d", color: "#fff" }}>导出 PDF</div>
            </div>
          </div>
          <div style={{ padding: "26px 30px", maxHeight: "calc(100vh - 210px)", overflow: "auto" }}>
            <RenderSheet r={r} spec={spec} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#eef8f2", border: "1px solid #cfeadd", borderRadius: 14, padding: "12px 14px", fontSize: 12.5, color: "#12805c", lineHeight: 1.6 }}>✓ 可追溯性：6 条描述中 5 条已绑定证据，1 条待确认。无自动编造数据。</div>
          <div style={{ background: "#f2f3f6", borderRadius: 11, padding: 4, display: "flex", gap: 2 }}>
            {seg("template", "模板")}
            {seg("custom", "自定义")}
            {seg("diff", "AI 改写")}
          </div>
          {rail === "template" ? <TemplatePanel /> : rail === "custom" ? <CustomPanel /> : <DiffPanel />}
        </div>
      </div>
    </Page>
  );
}
