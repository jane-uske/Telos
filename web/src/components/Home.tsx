"use client";

import React from "react";
import { useStore } from "@/lib/store";

const homeSteps = [
  { n: 1, title: "沉淀职业证据", desc: "导入简历 + AI 访谈深挖，把模糊经历变成可追溯的证据卡。" },
  { n: 2, title: "解析目标岗位", desc: "粘贴 JD，识别核心职责、必要能力、加分项与隐含要求。" },
  { n: 3, title: "证据对照匹配", desc: "强/弱/未匹配一目了然，标出禁止夸大的风险表述。" },
  { n: 4, title: "生成求职材料", desc: "定制简历、招呼语、自我介绍、面试清单，句句可溯源。" },
];

export default function Home() {
  const go = useStore((s) => s.go);
  const enterDemo = () => useStore.setState({ screen: "app", tab: "dashboard" });

  return (
    <div style={{ minHeight: "100vh", background: "#faf9f7" }}>
      <header
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "22px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 20, letterSpacing: "-.02em" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#5850ec", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>P</div>
          ProofCV
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 14, color: "#4b5060" }}>
          <span style={{ cursor: "pointer" }}>产品能力</span>
          <span style={{ cursor: "pointer" }}>工作原理</span>
          <span style={{ cursor: "pointer" }}>分享案例</span>
          <span onClick={enterDemo} style={{ cursor: "pointer", padding: "9px 18px", borderRadius: 9, background: "#16181d", color: "#fff", fontWeight: 500 }}>进入演示</span>
        </nav>
      </header>

      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "64px 32px 40px",
          display: "grid",
          gridTemplateColumns: "1.05fr .95fr",
          gap: 56,
          alignItems: "center",
        }}
      >
        <div style={{ animation: "pcvFade .5s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 99, background: "#fff", border: "1px solid #eceae4", fontSize: 13, color: "#5850ec", fontWeight: 500, marginBottom: 24 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "#5850ec", display: "inline-block" }} />
            面向程序员的 AI 职业资产与求职作战平台
          </div>
          <h1 style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 52, lineHeight: 1.12, letterSpacing: "-.01em", margin: "0 0 22px" }}>
            先找到你<span style={{ color: "#5850ec" }}>真正值钱</span>的经历，<br />再让招聘者相信它。
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "#4b5060", margin: "0 0 32px", maxWidth: 520 }}>
            ProofCV 不是又一个简历模板编辑器。我们通过 AI 职业访谈深挖你做过的每个项目，沉淀成可追溯的「职业证据」，再针对具体岗位生成可信、可核验的简历与求职材料——拒绝编造数据。
          </p>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span onClick={enterDemo} style={{ cursor: "pointer", padding: "14px 26px", borderRadius: 11, background: "#5850ec", color: "#fff", fontWeight: 700, fontSize: 15, boxShadow: "0 6px 20px rgba(88,80,236,.28)" }}>用演示账号立即体验 →</span>
            <span onClick={() => go("import")} style={{ cursor: "pointer", padding: "14px 22px", borderRadius: 11, background: "#fff", border: "1px solid #e6e3db", fontWeight: 500, fontSize: 15 }}>导入我的简历</span>
          </div>
          <div style={{ display: "flex", gap: 28, marginTop: 40, fontSize: 13, color: "#8a8578" }}>
            <div><b style={{ color: "#16181d", fontSize: 22, fontFamily: "'JetBrains Mono'" }}>4</b> 步走完求职闭环</div>
            <div><b style={{ color: "#16181d", fontSize: 22, fontFamily: "'JetBrains Mono'" }}>0</b> 条编造数据</div>
            <div><b style={{ color: "#16181d", fontSize: 22, fontFamily: "'JetBrains Mono'" }}>1</b> 份证据库复用无数岗位</div>
          </div>
        </div>

        <div style={{ animation: "pcvFade .5s ease .1s both" }}>
          <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 20, padding: 20, boxShadow: "0 24px 60px -30px rgba(30,30,60,.35)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>职业证据卡 · 实时协作编辑器</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#12805c", background: "#e6f5ee", padding: "3px 9px", borderRadius: 99 }}>已确认</div>
            </div>
            <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.7, marginBottom: 14 }}>
              主导重构编辑器的协同冲突算法，将多人同编延迟从 <b style={{ color: "#16181d" }}>800ms 降到 120ms</b>，支撑日活 3 万团队稳定使用。
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {["CRDT", "WebSocket", "React"].map((t) => (
                <span key={t} style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, background: "#f1f0fb", color: "#5850ec", padding: "4px 9px", borderRadius: 6 }}>{t}</span>
              ))}
            </div>
            <div style={{ borderTop: "1px dashed #eceae4", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 12, color: "#4b5060" }}>
                <span style={{ width: 16, height: 16, borderRadius: 99, background: "#12805c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</span>
                成果有 PR 与监控截图佐证
              </div>
              <div style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 12, color: "#4b5060" }}>
                <span style={{ width: 16, height: 16, borderRadius: 99, background: "#c2810c", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>!</span>
                「3 万日活」待补充数据来源
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <div style={{ flex: 1, background: "#16181d", color: "#fff", borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, color: "#9aa0b0", marginBottom: 6 }}>JD 匹配 · 字节 高级前端</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 30, fontWeight: 900, fontFamily: "'JetBrains Mono'" }}>82</span>
                <span style={{ fontSize: 12, color: "#9aa0b0" }}>覆盖度</span>
              </div>
              <div style={{ height: 6, background: "#2a2d38", borderRadius: 99, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: "82%", height: "100%", background: "#5850ec" }} />
              </div>
            </div>
            <div style={{ flex: 1, background: "#fff", border: "1px solid #eceae4", borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, color: "#8a8578", marginBottom: 6 }}>风险项</div>
              <div style={{ fontSize: 13, color: "#d64545", fontWeight: 700 }}>2 处夸大表述</div>
              <div style={{ fontSize: 11, color: "#8a8578", marginTop: 6 }}>已自动标注并建议改写</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 13, color: "#5850ec", fontWeight: 700, letterSpacing: ".08em" }}>从零散经历到可信证据的四步</div>
          <h2 style={{ fontFamily: "'Noto Serif SC'", fontWeight: 900, fontSize: 34, margin: "10px 0 0" }}>求职作战，一条线走通</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
          {homeSteps.map((s) => (
            <div key={s.n} style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, padding: 22 }}>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#c9c4b8", fontWeight: 700 }}>0{s.n}</div>
              <div style={{ fontWeight: 700, fontSize: 16, margin: "12px 0 8px" }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
