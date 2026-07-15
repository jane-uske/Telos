"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn, Tags, Spinner } from "../ui";

export default function Github() {
  const ghUrl = useStore((s) => s.ghUrl);
  const ghLoading = useStore((s) => s.ghLoading);
  const ghResult = useStore((s) => s.ghResult);
  const analyzeGithub = useStore((s) => s.analyzeGithub);
  const showToast = useStore((s) => s.showToast);

  return (
    <Page
      title="GitHub 项目导入"
      sub="输入一个 GitHub 项目地址，AI 会从介绍、代码结构与提交记录中推断技术栈、复杂度与可用于简历的经历。所有推断都需要你确认——绝不会仅凭提交数量判断你的个人贡献。"
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 18, maxWidth: 640 }}>
        <input
          value={ghUrl}
          onChange={(e) => useStore.setState({ ghUrl: e.target.value })}
          placeholder="https://github.com/username/project"
          style={{ flex: 1, border: "1px solid #e6e8ee", borderRadius: 10, padding: "11px 13px", fontSize: 13.5, fontFamily: "'JetBrains Mono'", outline: "none" }}
        />
        <Btn label={ghLoading ? "分析中…" : "分析项目"} onClick={() => analyzeGithub()} />
      </div>
      {ghLoading ? (
        <Spinner text="正在读取 README、目录结构与提交记录…" />
      ) : !ghResult ? (
        <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 14, padding: "20px", fontSize: 13, color: "#6b7280", maxWidth: 640, lineHeight: 1.7 }}>
          试试你的开源项目地址。AI 会给出「推断」，你逐条确认后才会进入证据库——这样简历里的每一句都站得住脚。
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 12.5, color: "#c2810c", background: "#fdf7ec", borderRadius: 10, padding: "10px 13px", marginBottom: 16, maxWidth: 760, lineHeight: 1.6 }}>
            ⚠ 以下均为 AI 基于公开信息的推断，提交数量不代表个人贡献深度。请只确认你真正主导或参与的部分。
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 900 }}>
            <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>技术栈</div>
              <Tags arr={ghResult.stack} />
              <div style={{ fontWeight: 700, fontSize: 13.5, margin: "16px 0 8px" }}>项目复杂度</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 7, background: "#eee", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: ghResult.complexity + "%", height: "100%", background: "#5850ec" }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 700 }}>{ghResult.complexity}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, margin: "16px 0 8px" }}>解决的问题</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: "#4b5060", lineHeight: 1.8 }}>
                {ghResult.problems.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>可用于简历的经历（待确认）</div>
              {ghResult.experiences.map((e, i) => (
                <div key={i} style={{ border: "1px solid #eef0f4", borderRadius: 11, padding: "11px 13px", marginBottom: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                    <div onClick={() => showToast("已加入证据库（待确认）")} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec", whiteSpace: "nowrap", fontWeight: 700 }}>确认 ✓</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, lineHeight: 1.6 }}>{e.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
