"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Spinner } from "../ui";

const sample =
  "林深｜全栈工程师\n杭州 · 5 年经验 · 985 计算机本科\n\n工作经历\n某在线文档 SaaS｜高级前端｜2022.06-至今\n- 负责协作编辑器核心，重构冲突算法\n- 优化实时同步性能\n某电商公司｜前端工程师｜2020.07-2022.05\n- 负责商家中台前端，做过性能优化\n- 参与埋点 SDK 建设\n\n技能：React / TypeScript / Node.js / Go / Webpack";

export default function Import() {
  const importText = useStore((s) => s.importText);
  const importing = useStore((s) => s.importing);
  const importParsed = useStore((s) => s.importParsed);
  const doImport = useStore((s) => s.doImport);
  const showToast = useStore((s) => s.showToast);

  return (
    <Page
      title="简历导入与解析"
      sub="粘贴或上传你已有的简历，AI 会自动拆解出工作经历、项目、技能与成果——拆解结果需要你逐条确认，不会替你编造。"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>原始简历</div>
            <div onClick={() => useStore.setState({ importText: sample })} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec" }}>填入示例简历</div>
          </div>
          <textarea
            value={importText}
            onChange={(e) => useStore.setState({ importText: e.target.value })}
            placeholder="把简历内容粘贴到这里，或点击右上角填入示例…"
            style={{ width: "100%", height: 330, border: "1px solid #e6e8ee", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.7, resize: "vertical", background: "#fbfbfd", outline: "none" }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
            <Btn label={importing ? "AI 解析中…" : "AI 拆解简历 →"} onClick={() => doImport()} />
            <div style={{ fontSize: 12, color: "#a3a8b5" }}>支持粘贴 / .txt / .md</div>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, minHeight: 400 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>AI 拆解结果</div>
          {importing ? (
            <Spinner text="正在拆解经历、识别技能与可量化成果…" />
          ) : !importParsed ? (
            <div style={{ color: "#a3a8b5", fontSize: 13, padding: "50px 10px", textAlign: "center", lineHeight: 1.8, whiteSpace: "pre-line" }}>
              还没有拆解结果。{"\n"}左侧粘贴简历后点击「AI 拆解简历」，{"\n"}结果会显示在这里供你确认。
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12.5, color: "#12805c", background: "#e6f5ee", borderRadius: 10, padding: "10px 12px", marginBottom: 14, lineHeight: 1.6 }}>
                ✓ 已识别 {importParsed.length} 段经历。点击「转为证据卡」进入证据库，AI 会在访谈中继续帮你深挖。
              </div>
              {importParsed.map((p, i) => (
                <div key={i} style={{ border: "1px solid #eef0f4", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#8a919e", marginTop: 2 }}>{p.company} · {p.period}</div>
                    </div>
                    <Btn label="转为证据卡" kind="soft" onClick={() => showToast("已加入证据库，去访谈补充细节")} />
                  </div>
                  <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "#4b5060", fontSize: 12.5, lineHeight: 1.8 }}>
                    {(p.bullets || []).map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
