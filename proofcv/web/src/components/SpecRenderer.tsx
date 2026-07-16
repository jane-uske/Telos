"use client";

import React from "react";
import type { Resume, TemplateSpec, TplPreset, UserProfile } from "@/lib/types";
import { fontFam, densityCfg, nameSize, contactList } from "@/lib/templates";

// Faithful port of Telos SpecRenderer — four skeletons, header/title styles,
// density/font/accent all driven by the constrained TemplateSpec.

function SheetTitle({ spec, zh, en, onColor }: { spec: TemplateSpec; zh: string; en: string; onColor?: boolean }) {
  const ac = spec.colors.accent;
  const t = spec.section.titleLang === "en" ? en : zh;
  const c = onColor ? "#fff" : ac;
  const st = spec.section.titleStyle;
  const base: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: ".08em", marginBottom: 8 };
  if (st === "underline")
    return <div style={{ ...base, borderBottom: "1px solid " + (onColor ? "rgba(255,255,255,.3)" : "#e6e8ee"), paddingBottom: 4, color: c }}>{t}</div>;
  if (st === "leftbar")
    return <div style={{ ...base, borderLeft: "3px solid " + (onColor ? "#fff" : ac), paddingLeft: 8, color: c }}>{t}</div>;
  if (st === "band")
    return <div style={{ ...base, background: onColor ? "rgba(255,255,255,.15)" : ac + "1f", padding: "4px 9px", borderRadius: 5, color: c, display: "inline-block" }}>{t}</div>;
  return <div style={{ ...base, color: c }}>{t}</div>;
}

function SheetHeader({ spec, ctx, profile }: { spec: TemplateSpec; ctx?: "band"; profile: UserProfile }) {
  const ac = spec.colors.accent;
  const onBand = ctx === "band";
  const center = spec.header.align === "center";
  const nameC = onBand ? "#fff" : "#16181d";
  const subC = onBand ? "rgba(255,255,255,.85)" : "#6b7280";
  const metaC = onBand ? "rgba(255,255,255,.75)" : "#9098a6";
  const name = <div style={{ fontWeight: 800, fontSize: nameSize(spec.header.nameScale), lineHeight: 1.15, color: nameC, whiteSpace: "nowrap" }}>{profile.name || "（右侧「个人信息」填写姓名）"}</div>;
  const head = profile.headline ? <div style={{ marginTop: 3, fontSize: 12, color: subC }}>{profile.headline}</div> : null;
  const meta = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: center ? "0 14px" : "0", justifyContent: center ? "center" : "flex-start", flexDirection: center ? "row" : "column", fontSize: 10.5, color: metaC, lineHeight: 1.7, textAlign: center ? "center" : "right", flexShrink: 0 }}>
      {contactList(profile).map((c, i) => (
        <span key={i}>{c}</span>
      ))}
    </div>
  );
  const left = (
    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
      {name}
      {head}
      {center ? <div style={{ marginTop: 6 }}>{meta}</div> : null}
    </div>
  );
  const inner = center ? (
    <div style={{ textAlign: "center" }}>{left}</div>
  ) : (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      {left}
      {meta}
    </div>
  );
  const underline = spec.header.style === "underline" && !onBand;
  return <div style={underline ? { borderBottom: "2px solid " + ac, paddingBottom: 12 } : undefined}>{inner}</div>;
}

function SheetExp({ spec, r, dc, onColor, internal }: { spec: TemplateSpec; r: Resume; dc: ReturnType<typeof densityCfg>; onColor?: boolean; internal?: boolean }) {
  const ac = onColor ? "#fff" : spec.colors.accent;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: dc.gap }}>
      {r.exp.map((x, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: dc.body + 1, color: onColor ? "#fff" : "#16181d" }}>{x.company} · {x.role}</div>
            <div style={{ fontSize: dc.body - 1.5, color: onColor ? "rgba(255,255,255,.7)" : "#9098a6", fontFamily: "'JetBrains Mono'", whiteSpace: "nowrap" }}>{x.period}</div>
          </div>
          <div style={{ marginTop: 5, display: "flex", flexDirection: "column", gap: 5 }}>
            {/* 编辑器里「+ 添加一条」产生的空条目不上纸——否则打印/导出会出现只有圆点的空行 */}
            {x.bullets.filter((b) => b.text.trim()).map((b, k) => (
              <div key={k} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                <span style={{ color: ac, marginTop: 6, fontSize: 7, flexShrink: 0 }}>●</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: dc.body, color: onColor ? "rgba(255,255,255,.92)" : "#2f333d", lineHeight: dc.line }}>{b.text}</span>
                  {/* data-pcv-annot：内部准备标注，打印/导出（internal=false）时完全不渲染 */}
                  {internal ? (
                    <span data-pcv-annot="" style={{ marginLeft: 6, fontSize: dc.body - 2, color: b.evStatus === "pending" ? "#c2810c" : b.evStatus === "none" ? "#9098a6" : "#12805c", whiteSpace: "nowrap" }}>
                      {b.evStatus === "pending" ? "· 待确认" : b.evStatus === "none" ? "· 待补经历" : "· 已核验"}
                    </span>
                  ) : null}
                  {internal && b.hook ? <span data-pcv-annot="" style={{ marginLeft: 4, fontSize: dc.body - 2, color: "#c8622a", whiteSpace: "nowrap" }} title="面试钩子">★</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SheetSkills({ spec, r, onColor }: { spec: TemplateSpec; r: Resume; onColor?: boolean }) {
  const ac = spec.colors.accent;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {r.skills.map((x, i) => (
        <span key={i} style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono'", padding: "3px 8px", borderRadius: 5, background: onColor ? "rgba(255,255,255,.16)" : ac + "14", color: onColor ? "#fff" : ac }}>{x}</span>
      ))}
    </div>
  );
}

export function RenderSheet({ r, spec, profile, internal = true, print }: { r: Resume; spec: TemplateSpec; profile: UserProfile; internal?: boolean; print?: boolean }) {
  const dc = densityCfg(spec.section.density);
  const ac = spec.colors.accent;
  const fam = fontFam(spec.typography.font);
  const summary = <div style={{ fontSize: dc.body, color: "#4b5060", lineHeight: dc.line }}>{r.summary}</div>;
  const expBlock = (onColor?: boolean) => (
    <div>
      <SheetTitle spec={spec} zh="工作经历" en="EXPERIENCE" onColor={onColor} />
      <div style={{ marginTop: 2 }}>
        <SheetExp spec={spec} r={r} dc={dc} onColor={onColor} internal={internal} />
      </div>
    </div>
  );
  const skillBlock = (onColor?: boolean) => (
    <div>
      <SheetTitle spec={spec} zh="技能" en="SKILLS" onColor={onColor} />
      <div style={{ marginTop: 2 }}>
        <SheetSkills spec={spec} r={r} onColor={onColor} />
      </div>
    </div>
  );
  const sheet = (children: React.ReactNode) => (
    <div style={{ fontFamily: fam, background: "#fff", borderRadius: print ? 0 : 6, overflow: "hidden", boxShadow: print ? "none" : "0 10px 40px -18px rgba(30,30,60,.35)", border: print ? "none" : "1px solid #ececf2", color: "#16181d" }}>{children}</div>
  );

  if (spec.skeleton === "sidebar-left" || spec.skeleton === "sidebar-right") {
    const railDark = spec.colors.sidebarBg && spec.colors.sidebarBg.indexOf("#2") === 0;
    const railBg = spec.colors.sidebarBg || "#f7f8fb";
    const onC = !!railDark;
    const rail = (
      <div style={{ width: spec.sidebarRatio + "%", background: railBg, padding: "22px 18px", color: onC ? "#fff" : "#16181d", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", opacity: 0.7, marginBottom: 6, color: onC ? "#fff" : "#9098a6" }}>联系方式</div>
          <div style={{ fontSize: 10.5, lineHeight: 1.8, color: onC ? "rgba(255,255,255,.9)" : "#4b5060" }}>
            {contactList(profile).map((c, i) => (
              <div key={i}>{c}</div>
            ))}
          </div>
        </div>
        {skillBlock(onC)}
      </div>
    );
    const main = (
      <div style={{ flex: 1, padding: dc.pad, display: "flex", flexDirection: "column", gap: dc.gap + 2 }}>
        <SheetHeader spec={spec} profile={profile} />
        {summary}
        {expBlock(false)}
      </div>
    );
    return sheet(
      <div style={{ display: "flex", minHeight: 520 }}>
        {spec.skeleton === "sidebar-left" ? [<React.Fragment key="l">{rail}{main}</React.Fragment>] : [<React.Fragment key="r">{main}{rail}</React.Fragment>]}
      </div>
    );
  }
  if (spec.skeleton === "banner") {
    const bg = spec.colors.headerBg || ac;
    return sheet(
      <div>
        <div style={{ background: bg, padding: "24px 32px" }}>
          <SheetHeader spec={spec} ctx="band" profile={profile} />
        </div>
        <div style={{ padding: dc.pad, display: "flex", flexDirection: "column", gap: dc.gap + 3 }}>
          {summary}
          {expBlock(false)}
          {skillBlock(false)}
        </div>
      </div>
    );
  }
  return sheet(
    <div style={{ padding: dc.pad, display: "flex", flexDirection: "column", gap: dc.gap + 3 }}>
      <SheetHeader spec={spec} profile={profile} />
      {summary}
      {expBlock(false)}
      {skillBlock(false)}
    </div>
  );
}

export function TplThumb({ p }: { p: TplPreset }) {
  const sk = p.spec.skeleton;
  const ac = p.accent;
  const bar = (w: string, c?: string) => <div style={{ height: 3, width: w, background: c || "#d7dae3", borderRadius: 2 }} />;
  const lines = (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
      {bar("70%", ac)}
      {bar("100%")}
      {bar("90%")}
      {bar("95%")}
      {bar("60%")}
    </div>
  );
  const railDark = p.spec.colors.sidebarBg && p.spec.colors.sidebarBg.indexOf("#2") === 0;
  const inner =
    sk === "banner" ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, height: "100%" }}>
        <div style={{ height: 12, background: p.spec.colors.headerBg || ac, borderRadius: 2 }} />
        {lines}
      </div>
    ) : sk === "sidebar-left" ? (
      <div style={{ display: "flex", gap: 4, height: "100%" }}>
        <div style={{ width: "34%", background: railDark ? ac : "#eef0f6", borderRadius: 2 }} />
        {lines}
      </div>
    ) : sk === "sidebar-right" ? (
      <div style={{ display: "flex", gap: 4, height: "100%" }}>
        {lines}
        <div style={{ width: "34%", background: "#eef0f6", borderRadius: 2 }} />
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, height: "100%" }}>
        <div style={{ textAlign: p.spec.header.align === "center" ? "center" : "left" }}>
          <div style={{ height: 5, width: "45%", margin: p.spec.header.align === "center" ? "0 auto 3px" : "0 0 3px", background: ac, borderRadius: 2 }} />
        </div>
        {lines}
      </div>
    );
  return <div style={{ height: 66, background: "#fff", border: "1px solid #eef0f4", borderRadius: 6, padding: 6 }}>{inner}</div>;
}
