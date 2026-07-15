"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn } from "../ui";

const cities = ["上海", "北京", "深圳", "杭州", "广州", "成都", "南京", "赣州"];

function Bar({ items, color }: { items: [string, number][]; color?: string }) {
  const max = Math.max(...items.map((x) => x[1])) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((x, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 76, fontSize: 11.5, color: "#4b5060", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x[0]}</div>
          <div style={{ flex: 1, height: 14, background: "#f2f3f6", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: (x[1] / max) * 100 + "%", height: "100%", background: color || "#5850ec", borderRadius: 4 }} />
          </div>
          <div style={{ width: 22, fontSize: 11, fontFamily: "'JetBrains Mono'", color: "#8a919e" }}>{x[1]}</div>
        </div>
      ))}
    </div>
  );
}

function Dim({ title, items, color }: { title: string; items: [string, number][]; color?: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 11 }}>{title}</div>
      <Bar items={items} color={color} />
    </div>
  );
}

export default function Market() {
  const s = useStore();
  const m = s.marketData;

  const userSkills = Array.from(new Set(s.evidence.flatMap((e) => e.skills).map((x) => x.toLowerCase())));
  const marketSkills = m.skill_tags.concat(m.jd_terms.filter((t) => !m.skill_tags.some((k) => k[0].toLowerCase() === t[0].toLowerCase())));
  const covered = marketSkills.filter((x) => userSkills.some((u) => u === x[0].toLowerCase() || u.indexOf(x[0].toLowerCase()) >= 0 || x[0].toLowerCase().indexOf(u) >= 0));
  const missing = marketSkills.filter((x) => !covered.includes(x)).slice(0, 8);

  return (
    <Page title="岗位市场分析">
      <div style={{ maxWidth: 1020 }}>
        <div style={{ fontSize: 12, color: "#8a919e", background: "#f7f8fb", border: "1px solid #ececf2", borderRadius: 10, padding: "9px 13px", marginBottom: 16, lineHeight: 1.6 }}>
          数据来自 boss-zhipin-scraper：通过本地已登录 Chrome 的 DevTools Protocol 复用登录态调搜索 API，输出明文薪资。此处为演示抓取结果。
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          <input value={s.marketKeyword} onChange={(e) => useStore.setState({ marketKeyword: e.target.value })} placeholder="关键词" style={{ width: 150, border: "1px solid #e6e8ee", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, outline: "none" }} />
          <select value={s.marketCity} onChange={(e) => useStore.setState({ marketCity: e.target.value })} style={{ border: "1px solid #e6e8ee", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, outline: "none", background: "#fff" }}>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#8a919e" }}>
            页数
            <input type="number" value={s.marketPages} min={1} max={10} onChange={(e) => useStore.setState({ marketPages: +e.target.value })} style={{ width: 52, border: "1px solid #e6e8ee", borderRadius: 8, padding: "8px", fontSize: 13, fontFamily: "'JetBrains Mono'", textAlign: "center", outline: "none" }} />
          </div>
          <Btn label={s.marketLoading ? "抓取中…" : "🔌 连接 Chrome 抓取"} onClick={() => s.runMarket()} />
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
          <div style={{ background: "#16181d", color: "#fff", borderRadius: 14, padding: "14px 20px", flex: "0 0 auto" }}>
            <div style={{ fontSize: 11.5, color: "#9aa0b0" }}>样本</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 3 }}>{m.keyword} @ {m.city}</div>
            <div style={{ fontSize: 11.5, color: "#9aa0b0", marginTop: 2, fontFamily: "'JetBrains Mono'" }}>列表 {m.total_jobs} · 详情 {m.total_details}</div>
          </div>
          <div style={{ flex: 1, background: "#eef8f2", border: "1px solid #cfeadd", borderRadius: 14, padding: "14px 18px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#12805c", marginBottom: 8 }}>技能供需对照 · 你的证据 vs 市场需求</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {covered.slice(0, 6).map((x, i) => (
                <span key={"c" + i} style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono'", background: "#d6f0e2", color: "#12805c", padding: "3px 9px", borderRadius: 6 }}>✓ {x[0]}</span>
              ))}
              {missing.map((x, i) => (
                <span key={"m" + i} style={{ fontSize: 11.5, fontFamily: "'JetBrains Mono'", background: "#fdf0dd", color: "#c2810c", padding: "3px 9px", borderRadius: 6 }}>补 {x[0]}({x[1]})</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Dim title="薪资区间" items={m.salary_ranges} color="#5850ec" />
          <Dim title="技能标签（列表）" items={m.skill_tags} color="#12805c" />
          <Dim title="经验要求" items={m.experience} color="#3b5bdb" />
          <Dim title="JD 高频词（详情）" items={m.jd_terms} color="#0ea5a0" />
          <Dim title="学历要求" items={m.degrees} color="#c2810c" />
          <Dim title="地区分布" items={m.districts} color="#8a919e" />
          <Dim title="高频公司" items={m.companies} color="#d6603b" />
          <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>求职材料优化提示词</div>
            <div style={{ fontSize: 11.5, color: "#8a919e", lineHeight: 1.6, marginBottom: 12, flex: 1 }}>基于以上市场统计生成一段提示词，要求只把真实经历改写得更贴近这些岗位，不虚构。</div>
            {s.marketPrompt ? (
              <div>
                <div style={{ fontSize: 11.5, color: "#2f333d", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#fbfbfd", border: "1px solid #f0f0f5", borderRadius: 9, padding: "10px 12px", maxHeight: 120, overflow: "auto", marginBottom: 8 }}>{s.marketPrompt}</div>
                <div onClick={() => s.copyText(s.marketPrompt)} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec", fontWeight: 600 }}>复制提示词</div>
              </div>
            ) : (
              <Btn label={s.marketPromptLoading ? "生成中…" : "生成提示词"} kind="soft" onClick={() => s.genMarketPrompt()} />
            )}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>抓取到的岗位 · 明文薪资</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {m.jobs.map((jb, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", border: "1px solid #eef0f4", borderRadius: 11 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{jb.title} · {jb.company}</div>
                  <div style={{ fontSize: 11.5, color: "#8a919e", marginTop: 2 }}>{jb.location} · {jb.experience} · {jb.degree}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                    {jb.tags.map((t, k) => (
                      <span key={k} style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono'", background: "#f1f0fb", color: "#5850ec", padding: "2px 7px", borderRadius: 5 }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#12805c", fontFamily: "'JetBrains Mono'", whiteSpace: "nowrap" }}>{jb.salary}</div>
                <div onClick={() => { useStore.setState({ activeJobId: "j1" }); s.go("jd"); }} style={{ cursor: "pointer", fontSize: 12, color: "#5850ec", fontWeight: 600, whiteSpace: "nowrap" }}>对照证据 →</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
}
