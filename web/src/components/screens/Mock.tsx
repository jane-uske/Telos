"use client";

import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useSpeechInput } from "@/lib/speech";
import { Page, Btn, Empty, JobChips } from "../ui";
import { VoiceButton, VoiceStatus } from "../VoiceInput";
import type { InterviewMsg, MockReport, MockSession } from "@/lib/types";

function Bubble({ m }: { m: InterviewMsg }) {
  const me = m.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: me ? "flex-end" : "flex-start" }}>
      {/* Agent 工具调用透明记录：面试官查了什么，用户全程可见 */}
      {m.tools?.map((t, i) => (
        <div key={i} style={{ fontSize: 11, color: "#8a919e", fontFamily: "'JetBrains Mono'", background: "#f7f7fa", border: "1px solid #ececf2", borderRadius: 8, padding: "3px 9px" }}>
          ⚙ {t}
        </div>
      ))}
      <div style={{ maxWidth: "78%", background: me ? "#5850ec" : "#f4f4f8", color: me ? "#fff" : "#16181d", padding: "11px 14px", borderRadius: me ? "14px 14px 4px 14px" : "14px 14px 14px 4px", fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
        {m.content}
      </div>
    </div>
  );
}

function ReportView({ report }: { report: MockReport }) {
  const go = useStore((s) => s.go);
  const exitMock = useStore((s) => s.exitMock);
  const card = (title: string, items: string[], color: string, prefix: string) =>
    items.length ? (
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
    ) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "pcvFade .3s ease both" }}>
      <div style={{ background: "#16181d", color: "#fff", borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 12, color: "#9aa0b0", marginBottom: 6 }}>模拟面试报告 · 整体表现</div>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.7 }}>{report.overall}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {card("回答较好的部分", report.good, "#12805c", "✓")}
        {card("被问穿的内容", report.exposed, "#d64545", "✗")}
        {card("回答不完整的问题", report.incomplete, "#c2810c", "△")}
        {card("建议重新准备的答案", report.redo, "#5850ec", "↺")}
        {card("建议修改 / 删除的简历内容", report.resumeSuggestions, "#c8622a", "✎")}
        {card("下一次模拟重点", report.nextFocus, "#3b5bdb", "→")}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn label="去更新 QA 答案" kind="ghost" onClick={() => { exitMock(); go("qa"); }} />
        <Btn label="去修改简历" kind="ghost" onClick={() => { exitMock(); go("resume"); }} />
        <Btn label="再来一场" kind="dark" onClick={() => { exitMock(); useStore.getState().startMock(); }} />
        <Btn label="返回" kind="soft" onClick={() => exitMock()} />
      </div>
    </div>
  );
}

function HistoryCard({ mk }: { mk: MockSession }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 4 }}>{mk.date} · {Math.floor(mk.msgs.length / 2)} 轮问答</div>
          <div style={{ fontSize: 13, color: "#2f333d", lineHeight: 1.55 }}>{mk.report ? mk.report.overall : "未生成报告"}</div>
        </div>
        <span style={{ color: "#c9ccd6", fontSize: 12, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && mk.report ? (
        <div style={{ marginTop: 10, borderTop: "1px solid #f2f2f6", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {mk.report.exposed.map((x, i) => (
            <div key={"e" + i} style={{ fontSize: 12, color: "#d64545", lineHeight: 1.5 }}>✗ 被问穿：{x}</div>
          ))}
          {mk.report.redo.map((x, i) => (
            <div key={"r" + i} style={{ fontSize: 12, color: "#5850ec", lineHeight: 1.5 }}>↺ 重新准备：{x}</div>
          ))}
          {mk.report.nextFocus.map((x, i) => (
            <div key={"n" + i} style={{ fontSize: 12, color: "#3b5bdb", lineHeight: 1.5 }}>→ 下次重点：{x}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Mock() {
  const s = useStore();
  const go = useStore((x) => x.go);
  const openPackage = useStore((x) => x.openPackage);
  const startMock = useStore((x) => x.startMock);
  const sendMock = useStore((x) => x.sendMock);
  const endMock = useStore((x) => x.endMock);
  const exitMock = useStore((x) => x.exitMock);

  const j = s.jobs.find((x) => x.id === s.activeJobId) || s.jobs[0];
  const r = s.resumes[j.id];
  const sessions = s.mocks[j.id] || [];
  const qa = s.qa[j.id] || [];
  const hooks = (r?.exp || []).flatMap((x) => x.bullets).filter((b) => b.hook);
  const weakQa = qa.filter((q) => q.prep === "risk" || (q.highRisk && q.prep !== "done"));
  const lastRec = s.records.filter((x) => x.jobId === j.id).slice(-1)[0];

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [s.mockMsgs, s.mockLoading]);

  // 语音回答：识别定稿一段就追加进输入框，用户改完再发送
  const sp = useSpeechInput((t) =>
    useStore.setState((st) => ({ mockInput: st.mockInput + t }))
  );

  // 进行中的模拟面试
  if (s.mockActive && !s.mockReport) {
    return (
      <div style={{ animation: "pcvFade .3s ease both", display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, height: "calc(100vh - 130px)" }}>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>模拟面试：{j.company} · {j.role}</div>
              <div style={{ fontSize: 11.5, color: "#8a919e" }}>面试官基于你的当前简历提问 · 会优先追问钩子与薄弱点</div>
            </div>
            <div onClick={() => exitMock()} style={{ cursor: "pointer", fontSize: 12, color: "#8a919e" }}>退出</div>
          </div>
          <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            {s.mockMsgs.map((m, i) => (
              <Bubble key={i} m={m} />
            ))}
            {s.mockLoading ? (
              <div style={{ display: "flex", gap: 6, padding: "4px 2px" }}>
                {[0, 1, 2].map((k) => (
                  <span key={k} style={{ width: 7, height: 7, borderRadius: 99, background: "#c9c4f5", animation: "pcvPulse 1s ease-in-out infinite", animationDelay: k * 0.2 + "s" }} />
                ))}
              </div>
            ) : null}
          </div>
          <div style={{ padding: 14, borderTop: "1px solid #f0f0f5" }}>
            <VoiceStatus sp={sp} />
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={s.mockInput}
                onChange={(e) => useStore.setState({ mockInput: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { sp.stop(); sendMock(); } }}
                placeholder={sp.listening ? "正在听……说完点「停止」，检查识别结果后再发送" : "像真实面试一样回答——点「语音」开口说，或直接打字"}
                style={{ flex: 1, border: "1px solid #e6e8ee", borderRadius: 10, padding: "11px 13px", fontSize: 13.5, outline: "none" }}
              />
              <VoiceButton sp={sp} />
              <Btn label="回答" onClick={() => { sp.stop(); sendMock(); }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>面试官会重点检查</div>
            {["回答是否具体（要数字和细节）", "是否有证据支撑", "是否自相矛盾", "钩子内容能不能接住追问"].map((x, i) => (
              <div key={i} style={{ fontSize: 12.5, color: "#4b5060", padding: "5px 0", lineHeight: 1.5, display: "flex", gap: 8 }}>
                <span style={{ color: "#c9c4f5" }}>◆</span>{x}
              </div>
            ))}
          </div>
          {hooks.length ? (
            <div style={{ background: "#fdf1e8", border: "1px solid #f5ddc9", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#c8622a", marginBottom: 7 }}>★ 你的面试钩子（会被优先追问）</div>
              {hooks.map((h, i) => (
                <div key={i} style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.55, marginBottom: 4 }}>{h.text.slice(0, 40)}…</div>
              ))}
            </div>
          ) : null}
          <Btn label={s.mockLoading ? "请稍候…" : "结束并生成报告"} kind="dark" onClick={() => endMock()} />
        </div>
      </div>
    );
  }

  // 刚结束：报告
  if (s.mockActive && s.mockReport) {
    return (
      <Page title="模拟面试报告">
        <ReportView report={s.mockReport} />
      </Page>
    );
  }

  // 入口页
  return (
    <Page title="模拟面试" sub="提前练习面试官最可能追问的问题——面试官读过你的简历、知道你的钩子和薄弱点，像真实面试一样连续追问。">
      <JobChips jobs={s.jobs} activeId={j.id} onPick={(id) => openPackage(id)} />
      {!r ? (
        <Empty
          title={j.company + " · " + j.role}
          desc="模拟面试基于当前岗位申请包（简历 + QA）。请先为这个岗位生成专属简历。"
          action={<Btn label="先去生成简历" onClick={() => go("resume")} />}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>本场面试官将会：</div>
            {[
              "基于你简历的 " + (r.exp.flatMap((x) => x.bullets).length) + " 条内容提问，顺着回答连续追问",
              hooks.length ? "优先追问你标记的 " + hooks.length + " 个面试钩子" : "（你还没标记面试钩子——去简历编辑器标 ★，主动设计面试）",
              weakQa.length ? "重点检验 " + weakQa.length + " 道历史薄弱 / 高风险题是否已补齐" : "检查回答是否具体、有证据、是否自相矛盾",
              lastRec ? "追问真实面试暴露的缺口：" + lastRec.gaps[0] : "检查回答是否具体、有证据、是否自相矛盾",
            ]
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .map((x, i) => (
                <div key={i} style={{ fontSize: 13, color: "#4b5060", lineHeight: 1.6, padding: "7px 0", display: "flex", gap: 9 }}>
                  <span style={{ color: "#5850ec", fontWeight: 700 }}>{i + 1}.</span>
                  {x}
                </div>
              ))}
            {s.mockStale[j.id] ? (
              <div style={{ fontSize: 12.5, color: "#c2810c", background: "#fdf7ec", borderRadius: 9, padding: "8px 11px", margin: "8px 0" }}>⚠ 简历在上次模拟后有更新——正好来检验新内容。</div>
            ) : null}
            <div style={{ marginTop: 12 }}>
              <Btn label="开始模拟面试 →" onClick={() => startMock()} />
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>历史模拟记录 · {sessions.length}</div>
            {sessions.length ? (
              sessions.slice().reverse().map((mk) => <HistoryCard key={mk.id} mk={mk} />)
            ) : (
              <div style={{ background: "#faf9ff", border: "1px dashed #d8d4ff", borderRadius: 14, padding: "26px 20px", textAlign: "center", fontSize: 12.5, color: "#8a919e", lineHeight: 1.7 }}>
                还没有模拟记录。第一场结束后，报告会告诉你哪些回答被问穿、哪些要重新准备。
              </div>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
