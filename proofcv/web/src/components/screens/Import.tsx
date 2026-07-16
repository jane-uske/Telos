"use client";

import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { extractPdfText } from "@/lib/pdfText";
import { Page, Btn, Spinner } from "../ui";

/** 拆解等待反馈：网关暂不支持流式，只能一次性等完整结果，用计时告诉用户没卡死 */
function ImportingHint() {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <Spinner text={"正在拆解经历、识别技能与可量化成果… 已等待 " + sec + " 秒"} />
      <div style={{ fontSize: 12, color: "#8a919e", textAlign: "center", lineHeight: 1.7, marginTop: 6 }}>
        AI 需要读完整份简历后一次性输出，通常 30~60 秒，简历越长越慢。
        {sec >= 90 ? <><br />等得有点久了——超过 2 分钟仍无结果，可刷新页面重试或改用基础模式。</> : null}
      </div>
    </div>
  );
}

const sample =
  "林深｜全栈工程师\n杭州 · 5 年经验 · 985 计算机本科\n\n工作经历\n某在线文档 SaaS｜高级前端｜2022.06-至今\n- 负责协作编辑器核心，重构冲突算法\n- 优化实时同步性能\n某电商公司｜前端工程师｜2020.07-2022.05\n- 负责商家中台前端，做过性能优化\n- 参与埋点 SDK 建设\n\n技能：React / TypeScript / Node.js / Go / Webpack";

export default function Import() {
  const importText = useStore((s) => s.importText);
  const importing = useStore((s) => s.importing);
  const importParsed = useStore((s) => s.importParsed);
  const importedIdx = useStore((s) => s.importedIdx);
  const doImport = useStore((s) => s.doImport);
  const addEvidenceFromImport = useStore((s) => s.addEvidenceFromImport);
  const go = useStore((s) => s.go);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileNote, setFileNote] = useState<{ kind: "ok" | "warn" | "err"; text: string } | null>(null);
  const [reading, setReading] = useState(false);

  const onFile = async (f: File | null) => {
    if (!f) return;
    const name = f.name.toLowerCase();
    setFileNote(null);
    if (name.endsWith(".docx") || name.endsWith(".doc")) {
      setFileNote({ kind: "err", text: "暂不支持 Word（.docx / .doc）——请在 Word 里全选复制后粘贴到左侧，或导出为 PDF / 纯文本再上传。" });
      return;
    }
    if (name.endsWith(".pdf")) {
      setReading(true);
      const r = await extractPdfText(f);
      setReading(false);
      if (!r.ok) {
        setFileNote({ kind: "err", text: "PDF 解析失败：" + (r.error || "未知错误") + "。可以改为复制文字后粘贴。" });
        return;
      }
      if (r.scanned) {
        setFileNote({ kind: "err", text: "这份 PDF 没有文本层（可能是扫描版或纯图片导出），无法在本地抽取文字。请找带文本层的版本，或手动把内容粘贴到左侧。" });
        return;
      }
      useStore.setState({ importText: r.text, importParsed: null, importedIdx: [] });
      setFileNote({ kind: "ok", text: "已在浏览器本地读取「" + f.name + "」（" + r.pages + " 页），文件没有上传到任何服务器。核对左侧文本后点「拆解简历」。" });
      return;
    }
    if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".markdown") || f.type.startsWith("text/")) {
      const text = await f.text();
      useStore.setState({ importText: text, importParsed: null, importedIdx: [] });
      setFileNote({ kind: "ok", text: "已读取「" + f.name + "」。核对左侧文本后点「拆解简历」。" });
      return;
    }
    setFileNote({ kind: "err", text: "不支持这个格式。目前支持：粘贴文本、.txt、.md、带文本层的 .pdf（都在本地处理，不上传）。" });
  };

  return (
    <Page
      title="导入旧简历"
      sub="把过去做过的事情重新想清楚，从这份旧简历开始。粘贴或上传后自动拆解出经历段——拆解结果需要你逐条确认后才会保存，不会替你编造。"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>原始简历</div>
            <div onClick={() => useStore.setState({ importText: sample })} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec" }}>填入示例简历</div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              onFile(e.target.files?.[0] || null);
              e.target.value = "";
            }}
          />
          <div
            onClick={() => !reading && fileRef.current?.click()}
            style={{ cursor: reading ? "wait" : "pointer", border: "1.5px dashed #d8d4ff", borderRadius: 10, padding: "12px 14px", textAlign: "center", fontSize: 12.5, color: "#5850ec", background: "#faf9ff", marginBottom: 10, lineHeight: 1.6 }}
          >
            {reading ? "正在本地解析 PDF…" : "⇪ 上传文件（.txt / .md / 带文本层的 .pdf）"}
            <br />
            <span style={{ fontSize: 11.5, color: "#8a919e" }}>
              文件在你的浏览器里本地解析，不会上传服务器 · 暂不支持 Word（.docx），请粘贴文本
            </span>
          </div>
          {fileNote ? (
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.6,
                borderRadius: 9,
                padding: "8px 11px",
                marginBottom: 10,
                background: fileNote.kind === "ok" ? "#e6f5ee" : fileNote.kind === "warn" ? "#fdf7ec" : "#fff0f0",
                color: fileNote.kind === "ok" ? "#12805c" : fileNote.kind === "warn" ? "#c2810c" : "#d64545",
                border: "1px solid " + (fileNote.kind === "ok" ? "#bfe6d4" : fileNote.kind === "warn" ? "#f3e2bd" : "#f3d2d2"),
              }}
            >
              {fileNote.text}
            </div>
          ) : null}

          <textarea
            value={importText}
            onChange={(e) => useStore.setState({ importText: e.target.value })}
            placeholder="把简历内容粘贴到这里，或上方上传文件…"
            style={{ width: "100%", height: 280, border: "1px solid #e6e8ee", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.7, resize: "vertical", background: "#fbfbfd", outline: "none" }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
            <Btn label={importing ? "解析中…" : "拆解简历 →"} onClick={() => doImport()} />
            <div style={{ fontSize: 12, color: "#a3a8b5" }}>在线 AI 拆解更准；未登录可用基础模式（本地规则切分）</div>
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18, minHeight: 400 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>拆解结果 · 先预览再确认</div>
          {importing && !importParsed?.length ? (
            <ImportingHint />
          ) : !importParsed ? (
            <div style={{ color: "#a3a8b5", fontSize: 13, padding: "50px 10px", textAlign: "center", lineHeight: 1.8, whiteSpace: "pre-line" }}>
              还没有拆解结果。{"\n"}左侧粘贴或上传简历后点击「拆解简历」，{"\n"}结果会显示在这里供你逐条确认。
            </div>
          ) : (
            <div>
              {importing ? (
                <div style={{ fontSize: 12.5, color: "#5850ec", background: "#f2f0ff", borderRadius: 10, padding: "10px 12px", marginBottom: 14, lineHeight: 1.6 }}>
                  ⏳ AI 正在拆解，已拆出 {importParsed.length} 段——拆出即可核对，不用等它全部完成。
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: "#12805c", background: "#e6f5ee", borderRadius: 10, padding: "10px 12px", marginBottom: 14, lineHeight: 1.6 }}>
                  ✓ 已识别 {importParsed.length} 段经历。逐段核对内容，点「确认加入我的经历」（状态为待确认），之后可用 AI 访谈继续深挖。
                </div>
              )}
              {importParsed.map((p, i) => {
                const added = importedIdx.includes(i);
                return (
                  <div key={i} style={{ border: "1px solid #eef0f4", borderRadius: 12, padding: 14, marginBottom: 10, opacity: added ? 0.72 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: "#8a919e", marginTop: 2 }}>
                          {p.company}
                          {p.project && p.project !== p.company ? " · " + p.project : ""} · {p.period}
                        </div>
                      </div>
                      {added ? (
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#12805c", whiteSpace: "nowrap" }}>✓ 已加入</div>
                      ) : (
                        <Btn label="确认加入我的经历" kind="soft" onClick={() => addEvidenceFromImport(p, i)} />
                      )}
                    </div>
                    <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "#4b5060", fontSize: 12.5, lineHeight: 1.8 }}>
                      {(p.bullets || []).map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {importing ? (
                <div style={{ padding: "6px 0 2px" }}>
                  <Spinner text="正在继续拆解…" />
                </div>
              ) : null}
              {importedIdx.length ? (
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <Btn label="下一步：查看我的经历 →" kind="dark" onClick={() => go("evidence")} />
                  <Btn label="用 AI 访谈补全细节" kind="ghost" onClick={() => go("interview")} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
