"use client";

// Home v3 —— 连续叙事首页。
// 情绪线：立刻理解产品 → 意识到经历被埋没 → 经历被找回 → 方向清晰 → 风险被提前处理 → 持续变强 → 可以开始行动。
// 动效原则：低速、就位式（fade + 上移 + 高亮扫过），毛玻璃只用于浮层卡；
// 全部动画支持 prefers-reduced-motion（静态终态），移动端关闭 scrollytelling 改为整段渐显。

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import BrandMark from "./BrandMark";

/* ============================== hooks ============================== */

function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setMatch(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [query]);
  return match;
}

const usePRM = () => useMedia("(prefers-reduced-motion: reduce)");
const useMobile = () => useMedia("(max-width: 880px)");

function useInView<T extends HTMLElement>(threshold = 0.25, once = true) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          if (once) ob.disconnect();
        } else if (!once) setInView(false);
      },
      { threshold }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [threshold, once]);
  return [ref, inView] as const;
}

/** 高段落 + sticky pin 的滚动进度（0..1）。disabled 时直接返回 1（移动端 / 减少动态）。 */
function useScrollProgress<T extends HTMLElement>(disabled: boolean) {
  const ref = useRef<T | null>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    if (disabled) return;
    let raf = 0;
    const calc = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 4) {
        setP(1);
        return;
      }
      const passed = Math.min(Math.max(-r.top, 0), total);
      setP(passed / total);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };
    raf = requestAnimationFrame(calc);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [disabled]);
  return [ref, disabled ? 1 : p] as const;
}

/** 进入视区后按固定节奏推进 step（0..last）。reduced motion / 未入视区时保持终态或 0。 */
function useSequence(durations: number[], active: boolean, jumpToEnd: boolean) {
  const last = durations.length;
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (jumpToEnd || !active || step >= last) return;
    const t = setTimeout(() => setStep((s) => s + 1), durations[step]);
    return () => clearTimeout(t);
  }, [active, step, jumpToEnd, last, durations]);
  return jumpToEnd ? last : step;
}

/* ============================== atoms ============================== */

const serif: React.CSSProperties = { fontFamily: "'Noto Serif SC', serif", fontWeight: 900, letterSpacing: "-.01em" };
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.18);
  return (
    <div ref={ref} className={"hv-reveal" + (inView ? " in" : "")} style={{ transitionDelay: delay + "ms", ...style }}>
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ width: 22, height: 1, background: "#5850ec", display: "inline-block" }} />
      <span style={{ ...mono, fontSize: 12.5, color: "#5850ec", letterSpacing: ".12em", fontWeight: 500 }}>{children}</span>
    </div>
  );
}

function StageTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ ...serif, fontSize: "clamp(26px, 3.4vw, 36px)", lineHeight: 1.3, margin: "0 0 14px" }}>{children}</h2>;
}

function StagePara({ children, maxWidth = 460 }: { children: React.ReactNode; maxWidth?: number }) {
  return <p style={{ fontSize: 15.5, lineHeight: 1.85, color: "#4b5060", margin: 0, maxWidth }}>{children}</p>;
}

/** 转录/复盘用的状态小签 */
function FlagChip({ label, tone }: { label: string; tone: "ok" | "warn" | "iris" | "risk" | "coach" }) {
  const map = {
    ok: { fg: "#12805c", bg: "#e6f5ee" },
    warn: { fg: "#c2810c", bg: "#fdf3e0" },
    iris: { fg: "#5850ec", bg: "#f1f0fb" },
    risk: { fg: "#d64545", bg: "#fff5f5" },
    coach: { fg: "#c26445", bg: "#fdf1ec" },
  }[tone];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: map.fg, background: map.bg, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

/** 极浅的环境色斑，让毛玻璃有可模糊的层次；不做漂浮动画 */
function Ambient({ items }: { items: { top?: string; left?: string; right?: string; bottom?: string; size: number; color: string }[] }) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {items.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${b.color}, transparent)`,
          }}
        />
      ))}
    </div>
  );
}

/* ============================== header ============================== */

function HvHeader() {
  const enterDemo = () => useStore.setState({ screen: "app", tab: "dashboard" });
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const link: React.CSSProperties = { cursor: "pointer", color: "#4b5060", fontSize: 14 };
  return (
    <header
      className={scrolled ? "hv-glass" : undefined}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: scrolled ? undefined : "1px solid transparent",
        background: scrolled ? undefined : "transparent",
        transition: "background .4s ease",
      }}
    >
      <div className="hv-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900, fontSize: 20, letterSpacing: "-.02em" }}>
          <BrandMark size={30} />
          RoleReady
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <a href="#story" className="hv-desktop-only" style={link}>经历整理</a>
          <a href="#tailor" className="hv-desktop-only" style={link}>岗位定制</a>
          <a href="#prep" className="hv-desktop-only" style={link}>面试准备</a>
          <a href="#loop" className="hv-desktop-only" style={link}>复盘闭环</a>
          <span className="hv-btn hv-btn-dark" onClick={enterDemo}>进入演示</span>
        </nav>
      </div>
    </header>
  );
}

/* ============================== hero ============================== */

const HERO_QUESTIONS = ["具体优化了什么？", "性能前后差异是多少？", "你在项目中承担什么角色？"];
const HERO_PROBES = ["为什么选择这种冲突解决方案？", "延迟数据是如何测量的？", "高并发场景出现过什么问题？"];
// 微步骤：0 原文 → 1..3 追问 → 4 重写 → 5..7 追问预演 → 8 就绪停留
const HERO_DUR = [1600, 1900, 1900, 2100, 3000, 2100, 2100, 2400, 5200];
const HERO_LAST = HERO_DUR.length; // 9 = 终态

function HeroDemo() {
  const prm = usePRM();
  const [ref, inView] = useInView<HTMLDivElement>(0.3, false);
  const [rawStep, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const step = prm ? HERO_LAST - 1 : rawStep; // 减少动态时直接停在终态

  useEffect(() => {
    if (prm || !inView || fading) return;
    if (rawStep >= HERO_LAST - 1) {
      // 终态停留后柔和淡出并重来
      const t = setTimeout(() => setFading(true), HERO_DUR[HERO_LAST - 1]);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), HERO_DUR[rawStep]);
    return () => clearTimeout(t);
  }, [rawStep, inView, prm, fading]);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => {
      setStep(0);
      setFading(false);
    }, 700);
    return () => clearTimeout(t);
  }, [fading]);

  const phase = step >= 8 ? 4 : step >= 5 ? 3 : step >= 4 ? 2 : step >= 1 ? 1 : 0;
  const phases = ["旧简历原文", "AI 追问", "重写", "追问预演", "就绪"];
  const prepared = Math.min(Math.max(step - 4, 0), 3);
  const cls = (k: number) => "hv-step" + (step >= k ? " in" : "");
  const dim = step >= 4;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Ambient items={[{ top: "-8%", right: "-12%", size: 380, color: "rgba(88,80,236,.10)" }, { bottom: "-14%", left: "-10%", size: 320, color: "rgba(232,137,107,.08)" }]} />
      <div
        className="hv-glass"
        style={{ position: "relative", borderRadius: 20, padding: "22px 24px 20px", transition: "opacity .7s ease", opacity: fading ? 0 : 1 }}
      >
        {/* 阶段标尺 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ ...mono, fontSize: 11.5, color: "#8a919e" }}>案例演示 · 实时协作编辑器</div>
          <div className="hv-desktop-only" style={{ display: "flex", gap: 6 }}>
            {phases.map((label, i) => (
              <span
                key={label}
                style={{
                  ...mono,
                  fontSize: 10.5,
                  padding: "3px 8px",
                  borderRadius: 99,
                  transition: "all .5s ease",
                  background: i === phase ? "#16181d" : "transparent",
                  color: i === phase ? "#fff" : i < phase ? "#5850ec" : "#b9bec9",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* 1. 原文 */}
        <div className={cls(0)} style={{ transition: "opacity .65s ease", marginBottom: 14 }}>
          <div style={{ ...mono, fontSize: 10.5, color: "#a3a8b5", marginBottom: 6 }}>你的旧简历里写着</div>
          <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 12, padding: "13px 16px", fontSize: 13.5, lineHeight: 1.7, color: dim ? "#a3a8b5" : "#2f333d", transition: "color .8s ease", textDecoration: dim ? "line-through" : "none", textDecorationColor: "rgba(163,168,181,.5)" }}>
            “负责实时协作编辑器开发和性能优化。”
          </div>
        </div>

        {/* 2. AI 追问 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...mono, fontSize: 10.5, color: step >= 1 ? "#a3a8b5" : "#d6d2c6", marginBottom: 6, transition: "color .6s ease" }}>AI 追问</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {HERO_QUESTIONS.map((q, i) => {
              const on = step >= i + 1;
              return (
                <div key={q} style={{ display: "flex", gap: 9, alignItems: "center" }}>
                  <span className={"hv-step" + (on ? " in" : "")} style={{ width: 20, height: 20, borderRadius: 99, background: "#5850ec", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, ...mono, flexShrink: 0 }}>AI</span>
                  <span style={{ position: "relative", display: "inline-block" }}>
                    <span aria-hidden style={{ position: "absolute", inset: 0, border: "1px dashed #e6e2d8", borderRadius: 10, opacity: on ? 0 : 1, transition: "opacity .6s ease" }} />
                    <span className={"hv-glass hv-step" + (on ? " in" : "")} style={{ display: "inline-block", borderRadius: 10, padding: "7px 13px", fontSize: 13, color: "#2f333d" }}>{q}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 重写后 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...mono, fontSize: 10.5, color: step >= 4 ? "#a3a8b5" : "#d6d2c6", marginBottom: 6, transition: "color .6s ease" }}>整理后的写法</div>
          <div style={{ position: "relative" }}>
            <div aria-hidden style={{ position: "absolute", inset: 0, border: "1px dashed #e6e2d8", borderRadius: 12, opacity: step >= 4 ? 0 : 1, transition: "opacity .6s ease" }} />
            <div className={cls(4)} style={{ background: "#fff", borderLeft: "3px solid #5850ec", border: "1px solid #eceae4", borderLeftWidth: 3, borderLeftColor: "#5850ec", borderRadius: 12, padding: "13px 16px", fontSize: 13.5, lineHeight: 1.8, color: "#16181d" }}>
              “<span className={"hv-mark" + (step >= 4 ? " on" : "")} style={{ transitionDelay: ".5s" }}>主导协同冲突算法重构</span>，将多人编辑延迟由{" "}
              <b className={"hv-mark" + (step >= 4 ? " on" : "")} style={{ ...mono, fontSize: 12.5, transitionDelay: "1s" }}>800ms 降至 120ms</b>
              ，<span className={"hv-mark" + (step >= 4 ? " on" : "")} style={{ transitionDelay: "1.5s" }}>支撑日活 3 万用户稳定使用</span>。”
            </div>
          </div>
        </div>

        {/* 4. 面试官可能追问 */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...mono, fontSize: 10.5, color: step >= 5 ? "#a3a8b5" : "#d6d2c6", marginBottom: 6, transition: "color .6s ease" }}>面试官可能追问</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {HERO_PROBES.map((q, i) => {
              const on = step >= i + 5;
              return (
                <div key={q} style={{ position: "relative" }}>
                  <div aria-hidden style={{ position: "absolute", inset: 0, border: "1px dashed #e6e2d8", borderRadius: 10, opacity: on ? 0 : 1, transition: "opacity .6s ease" }} />
                  <div className={"hv-step" + (on ? " in" : "")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#fff", border: "1px solid #eceae4", borderRadius: 10, padding: "9px 13px" }}>
                    <span style={{ fontSize: 12.5, color: "#2f333d" }}>{q}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#12805c", flexShrink: 0 }}>
                      <span style={{ width: 15, height: 15, borderRadius: 99, background: "#e6f5ee", color: "#12805c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5 }}>✓</span>
                      答案已准备
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. 状态 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed #e4e1d8", paddingTop: 13 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: step >= 7 ? "#12805c" : step >= 5 ? "#4b5060" : "#c9c4b8", transition: "color .5s ease" }}>
            回答已准备 {prepared}/3
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 26, height: 4, borderRadius: 99, background: prepared > i ? "#12805c" : "#e8e5dc", transition: "background .6s ease" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const go = useStore((s) => s.go);
  const enterDemo = () => useStore.setState({ screen: "app", tab: "dashboard" });
  return (
    <section style={{ position: "relative" }}>
      <div className="hv-container" style={{ padding: "64px 32px 96px" }}>
        <div className="hv-hero-grid">
          <div style={{ animation: "pcvFade .6s ease both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 13px", borderRadius: 99, background: "#fff", border: "1px solid #eceae4", fontSize: 13, color: "#5850ec", fontWeight: 500, marginBottom: 26 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: "#5850ec" }} />
              从旧简历到面试准备，一次完成
            </div>
            <h1 style={{ ...serif, fontSize: "clamp(34px, 4.6vw, 52px)", lineHeight: 1.18, margin: "0 0 22px" }}>
              不只帮你写简历，
              <br />
              还帮你准备好<span style={{ color: "#5850ec", whiteSpace: "nowrap" }}>每一次追问</span>。
            </h1>
            <p style={{ fontSize: 16.5, lineHeight: 1.85, color: "#4b5060", margin: "0 0 34px", maxWidth: 520 }}>
              导入旧简历，AI 帮你找回遗漏的项目细节，针对目标岗位生成专属简历、面试 QA 和模拟面试。每参加一次面试，下一次准备都会更充分。
            </p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <span className="hv-btn hv-btn-primary" onClick={() => go("import")}>导入简历开始 →</span>
              <span className="hv-btn hv-btn-ghost" onClick={enterDemo}>查看完整演示</span>
            </div>
            <div style={{ marginTop: 30, fontSize: 13, color: "#8a8578", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 99, background: "#e6f5ee", color: "#12805c", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>✓</span>
              不编造数据——每一句都能追溯到你的真实经历
            </div>
          </div>
          <div style={{ animation: "pcvFade .6s ease .15s both" }}>
            <HeroDemo />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== 01 · 你不是没有经历 ============================== */

const BURIED_LINES = [
  { text: "负责项目开发", tail: "，参与协作编辑器相关工作", note: "缺少行动" },
  { text: "参与性能优化", tail: "，配合完成体验提升", note: "缺少结果" },
  { text: "配合产品完成需求", tail: "，按时上线", note: "缺少背景" },
];

function StageBuried() {
  const prm = usePRM();
  const mobile = useMobile();
  const [secRef, p] = useScrollProgress<HTMLElement>(prm || mobile);
  const marks = [p > 0.2, p > 0.42, p > 0.62];
  const hintOn = p > 0.8;

  return (
    <section id="story" ref={secRef} className="hv-scrolly" style={{ height: mobile ? "auto" : "240vh" }}>
      <div className="hv-pin">
        <div className="hv-container" style={{ padding: mobile ? "72px 20px" : undefined }}>
          <div className="hv-cols">
            <Reveal>
              <Kicker>01 · 你不是没有经历</Kicker>
              <StageTitle>三年做的事，<br />不该只剩三句话。</StageTitle>
              <StagePara>
                大多数旧简历不是经历太少，而是把真实做过的事写成了一笔带过。往下滚动，看看这些句子少了什么。
              </StagePara>
            </Reveal>

            <Reveal delay={120} style={{ position: "relative" }}>
              <Ambient items={[{ top: "-10%", left: "-14%", size: 340, color: "rgba(88,80,236,.08)" }]} />
              {/* 旧简历文档 */}
              <div style={{ position: "relative", background: "#fff", border: "1px solid #eceae4", borderRadius: 16, boxShadow: "0 24px 60px -36px rgba(30,30,60,.35)", overflow: "visible" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 18px", borderBottom: "1px solid #f0efe9" }}>
                  {["#e8e5dc", "#e8e5dc", "#e8e5dc"].map((c, i) => (
                    <span key={i} style={{ width: 8, height: 8, borderRadius: 99, background: c }} />
                  ))}
                  <span style={{ ...mono, fontSize: 11, color: "#a3a8b5", marginLeft: 8 }}>简历_最终版_v7.pdf</span>
                </div>
                <div style={{ padding: "22px 26px 26px" }}>
                  <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 3 }}>林深</div>
                  <div style={{ fontSize: 12, color: "#8a919e", marginBottom: 18 }}>前端开发工程师 · 5 年经验</div>
                  <div style={{ ...mono, fontSize: 10.5, color: "#a3a8b5", letterSpacing: ".1em", marginBottom: 10 }}>工作经历</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>某在线文档 SaaS · 高级前端 <span style={{ color: "#a3a8b5", fontWeight: 400, ...mono, fontSize: 11 }}>2022.06 - 至今</span></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13.5, lineHeight: 1.75, color: "#4b5060" }}>
                    {BURIED_LINES.map((l, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                        <span>
                          ·{" "}
                          <span className={"hv-mark warn" + (marks[i] ? " on" : "")}>{l.text}</span>
                          {l.tail}
                        </span>
                        <span
                          className={"hv-step" + (marks[i] ? " in" : "")}
                          style={{ ...mono, fontSize: 10.5, color: "#c2810c", background: "#fdf3e0", padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}
                        >
                          {l.note}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 浮层提示卡（毛玻璃） */}
              <div
                className={"hv-glass hv-step" + (hintOn ? " in" : "")}
                style={{ position: mobile ? "static" : "absolute", right: mobile ? undefined : -20, bottom: mobile ? undefined : -34, marginTop: mobile ? 16 : 0, maxWidth: 340, borderRadius: 14, padding: "15px 18px" }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.7, marginBottom: 4 }}>
                  这些经历不是没有价值——只是缺少背景、行动和结果。
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>AI 会针对每一句，把这三样东西问回来。</div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== 02 · AI 帮你把经历找回来 ============================== */

const IV_PAIRS = [
  { q: "当时为什么要做这个项目？", a: "多人同时编辑经常冲突丢字，投诉越来越多。" },
  { q: "最难的问题是什么？", a: "内存膨胀。CRDT 元数据涨得很快，后来用增量 GC 折中。" },
  { q: "哪部分是你决定的？", a: "放弃 OT 换 CRDT 是我拍板的，评估报告也是我写的。" },
  { q: "上线前后有什么变化？", a: "延迟从 800ms 降到 120ms，丢字投诉少了差不多九成。" },
  { q: "面试官继续追问时，你能讲清楚吗？", a: null as string | null },
];

const CARD_SLOTS = [
  { label: "背景", text: "多人同编频繁冲突丢字，日活增长后投诉激增" },
  { label: "我的职责", text: "独立负责协同层：冲突合并 + 同步协议" },
  { label: "关键决策", text: "放弃 OT 改用 CRDT——这个决定是我做的" },
  { label: "可验证结果", text: "延迟 800ms→120ms（500 并发压测）· 投诉约 -90%" },
  { label: "追问准备", text: "3 个高频追问已生成预案" },
];

// 未归位时的散落偏移：向左侧对话区方向轻微漂移，保持在各自行高附近
const SCATTER = [
  "translate(-120px, -26px) rotate(-3deg)",
  "translate(-170px, 14px) rotate(2.5deg)",
  "translate(-105px, -18px) rotate(-2deg)",
  "translate(-185px, 22px) rotate(3deg)",
  "translate(-135px, -12px) rotate(-2.5deg)",
];

function StageInterview() {
  const prm = usePRM();
  const mobile = useMobile();
  const [secRef, p] = useScrollProgress<HTMLElement>(prm || mobile);
  const starts = [0.06, 0.24, 0.42, 0.6, 0.78];
  const qOn = starts.map((s) => p > s);
  const aOn = starts.map((s) => p > s + 0.09);
  const done = p > 0.95;

  return (
    <section ref={secRef} className="hv-scrolly" style={{ height: mobile ? "auto" : "320vh" }}>
      <div className="hv-pin">
        <div className="hv-container" style={{ padding: mobile ? "72px 20px" : undefined }}>
          <Reveal style={{ marginBottom: 36 }}>
            <Kicker>02 · AI 访谈</Kicker>
            <StageTitle>AI 帮你把经历找回来。</StageTitle>
            <StagePara maxWidth={560}>
              不是问卷，是顺着你的回答继续追问。你说过的每一句话，都会沉淀进一张可追溯的职业证据卡。
            </StagePara>
          </Reveal>

          <div className="hv-cols" style={{ alignItems: "start" }}>
            {/* 左：访谈对话 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {IV_PAIRS.map((pair, i) => (
                <React.Fragment key={i}>
                  <div className={"hv-step" + (qOn[i] ? " in" : "")} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <span style={{ width: 22, height: 22, borderRadius: 99, background: "#5850ec", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, ...mono, flexShrink: 0, marginTop: 2 }}>AI</span>
                    <span className="hv-glass" style={{ borderRadius: 12, borderTopLeftRadius: 4, padding: "9px 14px", fontSize: 13.5, lineHeight: 1.65, color: "#2f333d" }}>{pair.q}</span>
                  </div>
                  {pair.a ? (
                    <div className={"hv-step" + (aOn[i] ? " in" : "")} style={{ display: "flex", justifyContent: "flex-end" }}>
                      <span style={{ background: "#16181d", color: "#f3f3f6", borderRadius: 12, borderBottomRightRadius: 4, padding: "9px 14px", fontSize: 13.5, lineHeight: 1.65, maxWidth: "82%" }}>{pair.a}</span>
                    </div>
                  ) : (
                    <div className={"hv-step" + (aOn[i] ? " in" : "")} style={{ display: "flex", justifyContent: "flex-end" }}>
                      <span style={{ border: "1px dashed #cfcbf5", color: "#5850ec", background: "#faf9ff", borderRadius: 12, padding: "9px 14px", fontSize: 12.5, lineHeight: 1.6 }}>
                        讲不清也没关系——讲不清的部分，就是下一步要准备的部分。
                      </span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* 右：证据卡，信息逐渐归位 */}
            <div style={{ position: "relative" }}>
              <Ambient items={[{ top: "-6%", right: "-10%", size: 320, color: "rgba(88,80,236,.09)" }]} />
              <div style={{ position: "relative", background: "#fff", border: "1px solid #eceae4", borderRadius: 18, padding: "20px 22px", boxShadow: "0 24px 60px -36px rgba(30,30,60,.35)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>职业证据卡 · 实时协作编辑器</div>
                  <span
                    className={"hv-step" + (done ? " in" : "")}
                    style={{ fontSize: 11, fontWeight: 700, color: "#12805c", background: "#e6f5ee", padding: "3px 10px", borderRadius: 99 }}
                  >
                    已确认
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {CARD_SLOTS.map((slot, i) => {
                    const collected = aOn[i];
                    return (
                      <div key={slot.label} style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 10, alignItems: "start" }}>
                        <span style={{ ...mono, fontSize: 10.5, color: "#a3a8b5", paddingTop: 5 }}>{slot.label}</span>
                        <div style={{ position: "relative", minHeight: 32 }}>
                          {/* 占位虚线槽 */}
                          <div style={{ position: "absolute", inset: 0, border: "1px dashed #e8e5dc", borderRadius: 8, opacity: collected ? 0 : 1, transition: "opacity .6s ease" }} />
                          {/* 信息块：从散落位置归位 */}
                          <div
                            className="hv-glass"
                            style={{
                              borderRadius: 8,
                              padding: "6px 11px",
                              fontSize: 12.5,
                              lineHeight: 1.65,
                              color: "#2f333d",
                              transform: collected || prm || mobile ? "none" : SCATTER[i],
                              opacity: collected || prm || mobile ? 1 : 0.28,
                              transition: "transform 1s cubic-bezier(.22,1,.36,1), opacity 1s ease",
                              pointerEvents: "none",
                            }}
                          >
                            {slot.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className={"hv-step" + (done ? " in" : "")} style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #e8e5dc", fontSize: 11.5, color: "#8a919e", display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 99, background: "#e6f5ee", color: "#12805c", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>✓</span>
                  每一条都来自你的原话，可随时溯源修改
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================== 03 · 同一段经历，不同岗位不同写法 ============================== */

type Seg = string | { h: string };

const ANGLES: { id: string; label: string; focus: string; bullets: Seg[][] }[] = [
  {
    id: "biz",
    label: "业务前端",
    focus: "用户遇到的问题 → 体验改善 → 业务反馈",
    bullets: [
      ["针对", { h: "多人协作频繁冲突丢字" }, "的问题，主导冲突处理链路重构，将编辑延迟从 800ms 降至 120ms"],
      [{ h: "冲突丢字类投诉下降约 90%" }, "，显著改善高频协作场景的编辑体验"],
      ["与产品共同设计", { h: "双写灰度方案" }, "，不停服完成平滑上线"],
    ],
  },
  {
    id: "infra",
    label: "前端基础设施",
    focus: "架构决策 → 协议设计 → 可验证的性能基线",
    bullets: [
      ["主导协同层架构重构，", { h: "以 CRDT 替换 OT" }, "，解决高并发下的最终一致性问题"],
      ["设计", { h: "WebSocket 增量同步与基于版本向量的断线补偿协议" }],
      [{ h: "建立 500 并发压测与延迟监控基线" }, "，将同步延迟从 800ms 降至 120ms"],
    ],
  },
  {
    id: "ai",
    label: "AI 应用工程",
    focus: "抽象问题本质 → 映射到新领域 → 用数据背书",
    bullets: [
      ["解决", { h: "多端实时状态一致性" }, "问题：增量同步、冲突合并与断线恢复"],
      ["该链路与 AI 应用中", { h: "流式渲染、多轮会话状态管理" }, "的工程挑战同构"],
      ["在", { h: "高并发写入" }, "下将同步延迟从 800ms 降至 120ms，验证方案上限"],
    ],
  },
];

function renderSegs(segs: Seg[]) {
  return segs.map((s, i) =>
    typeof s === "string" ? <span key={i}>{s}</span> : <span key={i} className="hv-mark on">{s.h}</span>
  );
}

function StageAngles() {
  const prm = usePRM();
  const [ref, inView] = useInView<HTMLDivElement>(0.35, false);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const go = useStore((s) => s.go);

  // 未交互时缓慢自动轮换；用户点击后交还控制权
  useEffect(() => {
    if (prm || touched || !inView) return;
    const t = setInterval(() => setActive((a) => (a + 1) % ANGLES.length), 5200);
    return () => clearInterval(t);
  }, [prm, touched, inView]);

  const angle = ANGLES[active];

  return (
    <section id="tailor" style={{ padding: "120px 0" }}>
      <div className="hv-container">
        <Reveal style={{ marginBottom: 36, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Kicker>03 · 岗位定制</Kicker>
          </div>
          <StageTitle>同一段经历，<br />对不同岗位讲不同的重点。</StageTitle>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <StagePara maxWidth={520}>不是换几个关键词，而是重新组织经历的价值。同一个协作编辑器项目，在三个方向下是三种讲法。</StagePara>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div ref={ref} style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
            <Ambient items={[{ top: "-12%", right: "-16%", size: 360, color: "rgba(88,80,236,.08)" }, { bottom: "-16%", left: "-14%", size: 300, color: "rgba(232,137,107,.07)" }]} />
            {/* 岗位切换 */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20, flexWrap: "wrap", position: "relative" }}>
              {ANGLES.map((a, i) => (
                <span
                  key={a.id}
                  className="hv-tab"
                  onClick={() => {
                    setActive(i);
                    setTouched(true);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: 600,
                    background: i === active ? "#16181d" : "#fff",
                    color: i === active ? "#fff" : "#4b5060",
                    border: "1px solid " + (i === active ? "#16181d" : "#e6e3db"),
                  }}
                >
                  {a.label}
                </span>
              ))}
            </div>

            {/* 简历经历卡 */}
            <div className="hv-glass" style={{ position: "relative", borderRadius: 18, padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>某在线文档 SaaS · 高级前端 <span style={{ ...mono, fontSize: 11, color: "#a3a8b5", fontWeight: 400 }}>2022.06 - 至今</span></div>
                <span key={angle.id + "-focus"} className="hv-swap" style={{ ...mono, fontSize: 11, color: "#5850ec", background: "#f1f0fb", padding: "4px 11px", borderRadius: 99 }}>
                  {angle.focus}
                </span>
              </div>
              <div key={angle.id} className="hv-swap" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {angle.bullets.map((b, i) => (
                  <div key={i} style={{ fontSize: 14, lineHeight: 1.8, color: "#2f333d", display: "flex", gap: 9 }}>
                    <span style={{ color: "#c9c4b8" }}>·</span>
                    <span>{renderSegs(b)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 12.5, color: "#8a8578" }}>
              高亮部分是为该岗位重新组织的叙事——事实与数据保持不变。
              <span onClick={() => go("jobs")} style={{ color: "#5850ec", cursor: "pointer", marginLeft: 8, fontWeight: 600 }}>用我的岗位试试 →</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================== 04 · 简历不是终点 ============================== */

const HOOKS = [
  {
    bullet: "主导实时协作编辑器冲突算法重构，用 CRDT 替换原 OT 实现，将多人同编延迟从 800ms 降至 120ms",
    cards: {
      predict: "为什么放弃 OT 改用 CRDT？当时怎么权衡的？",
      dig: "120ms 是在什么环境测出来的？CRDT 内存膨胀怎么控制？",
      answer: "OT 需要中心化转换、扩展性差；CRDT 无中心、收敛性好，代价是内存——用增量 GC + 墓碑压缩折中。120ms 为本地 500 并发压测口径，主动说明。",
      risk: "「日活 3 万」缺少数据来源——已建议改为稳妥表述，或补上出处。",
    },
  },
  {
    bullet: "负责商家中台前端性能治理，首屏由 5.1s 优化至 1.6s，LCP 达标率 62%→94%",
    cards: {
      predict: "5.1s 到 1.6s，每项手段的收益是怎么归因的？",
      dig: "为什么看 P75/P95 而不是平均值？灰度样本量怎么保证置信？",
      answer: "先建监控看板定口径，再分批灰度：路由级分包 -1.8s、虚拟滚动 -1.1s、资源预取 -0.6s，用灰度组对照组的分位数差归因。",
      risk: "暂无业务指标（转化/留存）数据——面试中如实说明，并准备「如果重来怎么设指标」。",
    },
  },
];

const PLAIN_BULLETS = ["设计 WebSocket 增量同步与断线补偿机制，显著降低协同丢字问题", "精通 React / TypeScript，熟悉 Node.js / Go 与前端工程化"];

function StageHooks() {
  const mobile = useMobile();
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bulletRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const [path, setPath] = useState("");
  const [wrapRef, inView] = useInView<HTMLDivElement>(0.25);

  const measure = useCallback(() => {
    const c = containerRef.current;
    const b = bulletRefs.current[active];
    const t = stackRef.current;
    if (!c || !b || !t || mobile) {
      setPath("");
      return;
    }
    const cr = c.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const tr = t.getBoundingClientRect();
    const x1 = br.right - cr.left + 4;
    const y1 = br.top + br.height / 2 - cr.top;
    const x2 = tr.left - cr.left - 4;
    const y2 = tr.top + 26 - cr.top;
    const mx = (x1 + x2) / 2;
    setPath(`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
  }, [active, mobile]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, inView]);

  const hook = HOOKS[active];
  const rows = [
    { label: "预测问题", text: hook.cards.predict, dot: "#5850ec" },
    { label: "深挖追问", text: hook.cards.dig, dot: "#5850ec" },
    { label: "准备好的答案", text: hook.cards.answer, dot: "#12805c" },
    { label: "风险提示", text: hook.cards.risk, dot: "#c2810c" },
  ];

  return (
    <section id="prep" style={{ padding: "40px 0 120px" }}>
      <div className="hv-container" ref={wrapRef}>
        <Reveal style={{ marginBottom: 40 }}>
          <Kicker>04 · 面试准备</Kicker>
          <StageTitle>简历不是终点，<br />是面试的开场白。</StageTitle>
          <StagePara maxWidth={560}>
            写进简历的每一句都可能被追问。被标记为「面试钩子」的句子，系统会提前替你准备好后续回答——点击带 ✦ 的句子看看。
          </StagePara>
        </Reveal>

        <Reveal delay={120}>
          <div ref={containerRef} style={{ position: "relative" }}>
            {/* 连接线（桌面端） */}
            {path && (
              <svg key={active} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, animation: "pcvFade .7s ease both" }}>
                <path d={path} fill="none" stroke="#5850ec" strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="5 5" />
                <circle cx={path ? Number(path.split(" ")[1]) : 0} cy={path ? Number(path.split(" ")[2]) : 0} r="3.5" fill="#5850ec" />
              </svg>
            )}
            <div className="hv-cols" style={{ alignItems: "start", gridTemplateColumns: mobile ? undefined : "1.1fr .9fr" }}>
              {/* 左：完成的简历 */}
              <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, boxShadow: "0 24px 60px -36px rgba(30,30,60,.35)", padding: "24px 26px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ fontWeight: 900, fontSize: 17 }}>林深 · 高级前端工程师</div>
                  <span style={{ ...mono, fontSize: 10.5, color: "#5850ec", background: "#f1f0fb", padding: "3px 9px", borderRadius: 99 }}>面向：字节跳动 · 抖音电商</span>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7, marginBottom: 16, borderBottom: "1px solid #f0efe9", paddingBottom: 14 }}>
                  5 年经验，擅长大型协同系统与前端性能优化，能独立负责核心链路并对稳定性负责。
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {HOOKS.map((h, i) => (
                    <div
                      key={i}
                      ref={(el) => {
                        bulletRefs.current[i] = el;
                      }}
                      className="hv-hook"
                      onClick={() => setActive(i)}
                      style={{
                        padding: "10px 13px",
                        border: "1px solid " + (active === i ? "#cfcbf5" : "transparent"),
                        background: active === i ? "#faf9ff" : undefined,
                        fontSize: 13, lineHeight: 1.75, color: "#2f333d",
                        display: "flex", gap: 9, alignItems: "flex-start",
                      }}
                    >
                      <span style={{ color: "#5850ec", flexShrink: 0, fontSize: 12, marginTop: 2 }}>✦</span>
                      <span>
                        <span className={"hv-mark" + (inView ? " on" : "")} style={{ transitionDelay: 0.3 + i * 0.5 + "s" }}>{h.bullet}</span>
                        <span style={{ ...mono, fontSize: 10, color: "#5850ec", marginLeft: 8, whiteSpace: "nowrap" }}>面试钩子</span>
                      </span>
                    </div>
                  ))}
                  {PLAIN_BULLETS.map((b, i) => (
                    <div key={i} style={{ padding: "4px 13px", fontSize: 13, lineHeight: 1.75, color: "#6b7280", display: "flex", gap: 9 }}>
                      <span style={{ color: "#c9c4b8", flexShrink: 0 }}>·</span>
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              {/* 右：该句对应的准备浮层 */}
              <div ref={stackRef} style={{ position: "relative", zIndex: 2 }}>
                <div key={active} className="hv-swap" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {rows.map((r) => (
                    <div key={r.label} className="hv-glass" style={{ borderRadius: 13, padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 99, background: r.dot }} />
                        <span style={{ ...mono, fontSize: 10.5, color: "#8a919e", letterSpacing: ".08em" }}>{r.label}</span>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.75, color: "#2f333d" }}>{r.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, fontSize: 12.5, color: "#8a8578", lineHeight: 1.7 }}>
                  简历里的每一句，系统都提前帮你准备了后续回答。
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================== 05 · 真实面试后继续变强 ============================== */

const WAVE_HEIGHTS = [8, 14, 22, 12, 26, 18, 30, 24, 12, 20, 28, 14, 22, 32, 16, 24, 10, 18, 26, 12, 20, 28, 22, 14, 24, 16, 10, 18];

const TRANSCRIPT = [
  { who: "我", text: "主导过协作编辑器的冲突算法重构，同编延迟从 800ms 降到 120ms。", flag: { label: "回答清楚", tone: "ok" as const } },
  { who: "面试官", text: "CRDT 和 OT 当时是怎么对比的？", flag: null },
  { who: "我", text: "呃……对比数据我记不太清了。", flag: { label: "回答含糊", tone: "warn" as const } },
  { who: "面试官", text: "那内存最后降到了多少？", flag: { label: "被连续追问", tone: "iris" as const } },
  { who: "我", text: "具体数字我需要回去看一下监控。", flag: { label: "缺少证据", tone: "risk" as const } },
  { who: "面试官", text: "如果放到亿级流量，你会怎么设计？", flag: { label: "新出现的问题", tone: "coach" as const } },
];

const NEXT_ROUND = [
  { text: "OT → CRDT 的对比数据与决策依据", tag: "已加入 QA" },
  { text: "内存优化的量化结果与监控口径", tag: "已加入 QA" },
  { text: "亿级流量协同架构题", tag: "新增高优准备项" },
];

const LOOP_NODES = ["真实面试", "复盘", "更新答案", "下一次准备"];
// 转录节奏：0 波形 → 1..6 转录行 → 7..9 进入下一轮条目
const REPLAY_DUR = [1400, 1300, 1300, 1300, 1300, 1300, 1500, 900, 900, 900];

function StageReplay() {
  const prm = usePRM();
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const step = useSequence(REPLAY_DUR, inView, prm);
  const transcribing = inView && !prm && step < 7;

  // 闭环图：慢速循环高亮
  const [loopIdx, setLoopIdx] = useState(0);
  useEffect(() => {
    if (!inView || prm) return;
    const t = setInterval(() => setLoopIdx((i) => (i + 1) % LOOP_NODES.length), 1800);
    return () => clearInterval(t);
  }, [inView, prm]);

  const cls = (k: number) => "hv-step" + (step >= k ? " in" : "");

  return (
    <section id="loop" style={{ padding: "40px 0 120px", position: "relative" }}>
      <Ambient items={[{ top: "10%", left: "-8%", size: 420, color: "rgba(88,80,236,.07)" }]} />
      <div className="hv-container" style={{ position: "relative" }}>
        <Reveal style={{ marginBottom: 40 }}>
          <Kicker>05 · 复盘闭环</Kicker>
          <StageTitle>真实面试之后，<br />下一次准备更充分。</StageTitle>
          <StagePara maxWidth={560}>
            上传面试录音，系统转录并标记每一个回答的状态。含糊的、被追问的、缺证据的，都会自动进入下一轮准备。
          </StagePara>
        </Reveal>

        <div ref={ref} className="hv-cols" style={{ alignItems: "start" }}>
          {/* 左：录音 → 转录 */}
          <Reveal>
            <div style={{ background: "#fff", border: "1px solid #eceae4", borderRadius: 16, boxShadow: "0 24px 60px -36px rgba(30,30,60,.35)", padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: "#f1f0fb", color: "#5850ec", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>▲</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, ...mono }}>一面_字节_0709.m4a</div>
                    <div style={{ fontSize: 11, color: "#8a919e" }}>{transcribing ? "转录中…" : "转录完成 · 已按说话人区分"}</div>
                  </div>
                </div>
                <FlagChip label={transcribing ? "处理中" : "复盘完成"} tone={transcribing ? "iris" : "ok"} />
              </div>
              {/* 波形 */}
              <div className={cls(0)} style={{ display: "flex", alignItems: "center", gap: 3, height: 40, marginBottom: 16, padding: "0 4px" }}>
                {WAVE_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className={"hv-wave-bar" + (transcribing ? " live" : "")}
                    style={{ flex: 1, height: h, borderRadius: 99, background: i % 4 === 0 ? "#5850ec" : "#dcd9ff", animationDelay: (i % 7) * 0.18 + "s" }}
                  />
                ))}
              </div>
              {/* 转录内容 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {TRANSCRIPT.map((t, i) => (
                  <div key={i} className={cls(i + 1)} style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "#2f333d", display: "flex", gap: 8 }}>
                      <span style={{ ...mono, fontSize: 10.5, color: t.who === "我" ? "#5850ec" : "#a3a8b5", flexShrink: 0, paddingTop: 3 }}>{t.who}</span>
                      <span>{t.text}</span>
                    </div>
                    {t.flag && <FlagChip label={t.flag.label} tone={t.flag.tone} />}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 右：进入下一轮 + 闭环 */}
          <Reveal delay={120}>
            <div className="hv-glass" style={{ borderRadius: 16, padding: "20px 22px", marginBottom: 18 }}>
              <div style={{ ...mono, fontSize: 11, color: "#8a919e", letterSpacing: ".08em", marginBottom: 12 }}>自动进入下一轮准备</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {NEXT_ROUND.map((n, i) => (
                  <div key={i} className={cls(i + 7)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#fff", border: "1px solid #eceae4", borderRadius: 10, padding: "10px 13px" }}>
                    <span style={{ fontSize: 12.5, color: "#2f333d", lineHeight: 1.6 }}>{n.text}</span>
                    <span style={{ ...mono, fontSize: 10, color: "#5850ec", background: "#f1f0fb", padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>{n.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 闭环 */}
            <div style={{ border: "1px solid #eceae4", background: "#fff", borderRadius: 16, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                {LOOP_NODES.map((n, i) => (
                  <React.Fragment key={n}>
                    <span
                      style={{
                        padding: "7px 13px",
                        borderRadius: 99,
                        fontSize: 12.5,
                        fontWeight: 600,
                        transition: "all .6s ease",
                        background: loopIdx === i ? "#16181d" : "#faf9f7",
                        color: loopIdx === i ? "#fff" : "#4b5060",
                        border: "1px solid " + (loopIdx === i ? "#16181d" : "#e8e5dc"),
                      }}
                    >
                      {n}
                    </span>
                    <span style={{ color: "#c9c4b8", fontSize: 12 }}>{i < LOOP_NODES.length - 1 ? "→" : "↻"}</span>
                  </React.Fragment>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#8a8578" }}>
                每参加一次面试，下一次准备都会更充分。
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================== 最终 · 进入可执行状态 ============================== */

const PKG_ITEMS = ["岗位分析完成", "专属简历完成", "核心问题已准备", "模拟面试已完成", "高风险问题已处理"];

function FinalCta() {
  const go = useStore((s) => s.go);
  const openPackage = useStore((s) => s.openPackage);
  const [ref, inView] = useInView<HTMLDivElement>(0.35);

  return (
    <section style={{ padding: "60px 0 140px", position: "relative" }}>
      <Ambient items={[{ top: "0%", left: "30%", size: 520, color: "rgba(88,80,236,.09)" }, { bottom: "-10%", right: "8%", size: 380, color: "rgba(232,137,107,.07)" }]} />
      <div className="hv-container" style={{ position: "relative" }}>
        <div ref={ref} className="hv-cols" style={{ maxWidth: 980, margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ ...serif, fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.3, margin: "0 0 18px" }}>
              机会无法保证，
              <br />
              <span style={{ color: "#5850ec" }}>准备可以。</span>
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.9, color: "#4b5060", margin: "0 0 32px", maxWidth: 440 }}>
              你不需要等到完全不紧张，只需要比上一次更清楚自己做过什么，也更清楚该怎么回答。
            </p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <span className="hv-btn hv-btn-primary" onClick={() => go("jobs")}>创建我的岗位申请包 →</span>
              <span className="hv-btn hv-btn-ghost" onClick={() => openPackage("j1")}>先看一份准备完成的演示包</span>
            </div>
          </Reveal>

          {/* 已准备完成的申请包状态卡 */}
          <Reveal delay={150}>
            <div className="hv-glass" style={{ borderRadius: 20, padding: "24px 26px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 10 }}>
                <div>
                  <div style={{ ...mono, fontSize: 10.5, color: "#a3a8b5", marginBottom: 4 }}>岗位申请包</div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>字节跳动 · 高级前端工程师</div>
                </div>
                <span
                  className={"hv-step" + (inView ? " in" : "")}
                  style={{ transitionDelay: "2.2s", fontSize: 12, fontWeight: 700, color: "#12805c", background: "#e6f5ee", padding: "5px 13px", borderRadius: 99, whiteSpace: "nowrap" }}
                >
                  可以投递
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {PKG_ITEMS.map((item, i) => (
                  <div
                    key={item}
                    className={"hv-step" + (inView ? " in" : "")}
                    style={{ transitionDelay: 0.25 + i * 0.35 + "s", display: "flex", alignItems: "center", gap: 11, padding: "9px 4px", borderBottom: i < PKG_ITEMS.length - 1 ? "1px dashed #e8e5dc" : "none" }}
                  >
                    <span style={{ width: 19, height: 19, borderRadius: 99, background: "#e6f5ee", color: "#12805c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13.5, color: "#2f333d", fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div
                className={"hv-step" + (inView ? " in" : "")}
                style={{ transitionDelay: "2.2s", marginTop: 16, background: "#16181d", color: "#fff", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>当前状态：可以投递</span>
                <span style={{ ...mono, fontSize: 10.5, color: "#9aa0b0" }}>下一步 · 投出这份准备</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================== footer ============================== */

function HvFooter() {
  const enterDemo = () => useStore.setState({ screen: "app", tab: "dashboard" });
  return (
    <footer style={{ borderTop: "1px solid #eceae4" }}>
      <div className="hv-container" style={{ padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 900, fontSize: 15 }}>
          <BrandMark size={24} />
          RoleReady
          <span style={{ fontSize: 12.5, color: "#8a8578", fontWeight: 400, marginLeft: 6 }}>从旧简历到面试准备，一次完成。</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 12.5, color: "#8a8578" }}>
          <span onClick={enterDemo} style={{ cursor: "pointer", color: "#5850ec", fontWeight: 600 }}>进入演示</span>
          <span>© 2026 RoleReady</span>
        </div>
      </div>
    </footer>
  );
}

/* ============================== page ============================== */

export default function Home() {
  return (
    <div className="hv" style={{ minHeight: "100vh" }}>
      <HvHeader />
      <Hero />
      <StageBuried />
      <StageInterview />
      <StageAngles />
      <StageHooks />
      <StageReplay />
      <FinalCta />
      <HvFooter />
    </div>
  );
}
