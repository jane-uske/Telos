"use client";

import { useState } from "react";
import type { Resume } from "@/lib/schema";
import type { AnalysisResult, GeneralAnalysisResult, JdMatchAnalysisResult } from "@/lib/analysis-types";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

export function AiAnalysisPanel({ resume, onClose }: { resume: Resume; onClose: () => void }) {
  const [mode, setMode] = useState<"general" | "jd">("general");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jd: mode === "jd" ? jdText : undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "分析失败");
      }
      const data = await res.json();
      setResult(data as AnalysisResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 rounded-card border border-line bg-white shadow-card">
      {/* header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold">AI 分析</p>
          <div className="flex rounded-lg bg-bg-2 p-0.5 text-xs">
            <button
              onClick={() => { setMode("general"); setResult(null); }}
              className={`rounded-md px-3 py-1 font-medium transition ${focusRing} ${mode === "general" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              通用分析
            </button>
            <button
              onClick={() => { setMode("jd"); setResult(null); }}
              className={`rounded-md px-3 py-1 font-medium transition ${focusRing} ${mode === "jd" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              JD 匹配
            </button>
          </div>
        </div>
        <button onClick={onClose} aria-label="关闭" className={`rounded-md px-1.5 py-0.5 text-xs text-muted transition hover:bg-bg-2 hover:text-ink ${focusRing}`}>✕</button>
      </div>

      {/* body */}
      <div className="p-5">
        {mode === "jd" && !result && (
          <textarea
            className={`mb-3 w-full rounded-lg border border-line bg-bg-2/50 px-3 py-2 text-xs leading-relaxed transition ${focusRing} focus:border-brand focus:bg-white focus:outline-none`}
            rows={4}
            placeholder="粘贴目标职位的 JD 描述…"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
        )}

        {!result && !loading && (
          <button
            onClick={analyze}
            disabled={mode === "jd" && !jdText.trim()}
            className={`rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-deep disabled:opacity-50 ${focusRing}`}
          >
            {mode === "general" ? "开始分析" : "分析匹配度"}
          </button>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <span className="text-xs text-muted">AI 正在分析你的简历…</span>
          </div>
        )}

        {error && <p className="text-xs text-clay">{error}</p>}

        {result && (
          <div className="fade-in">
            {result.type === "general" && <GeneralResult data={result} />}
            {result.type === "jd" && <JdResult data={result} />}
            <button
              onClick={() => setResult(null)}
              className={`mt-4 rounded-md px-2 py-1 text-xs text-muted transition hover:bg-bg-2 hover:text-ink ${focusRing}`}
            >
              重新分析
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== 环形分数 ===== */
function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--color-brand)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-brand">{score}</span>
        <span className="text-[0.6rem] text-muted">/100</span>
      </div>
    </div>
  );
}

/* ===== 水平分数条 ===== */
function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-[0.7rem] font-medium text-ink-2">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-2">
        <div
          className="fill-bar h-full rounded-full"
          style={{ width: `${score}%`, background: score >= 80 ? "var(--color-brand)" : score >= 60 ? "var(--color-ink-2)" : "var(--color-clay)" }}
        />
      </div>
      <span className="w-6 text-right text-xs font-bold tabular-nums text-ink">{score}</span>
    </div>
  );
}

/* ===== 通用分析结果 ===== */
function GeneralResult({ data }: { data: GeneralAnalysisResult }) {
  return (
    <div className="space-y-5">
      {/* 核心分数 */}
      <div className="flex items-center gap-5 rounded-xl bg-bg-2/60 px-5 py-4">
        <ScoreRing score={data.overall} />
        <div className="min-w-0 flex-1 space-y-2">
          {data.dimensions.map((d) => (
            <ScoreBar key={d.name} score={d.score} label={d.name} />
          ))}
        </div>
      </div>

      {/* 维度建议 */}
      <div className="space-y-2">
        {data.dimensions.map((d) => (
          <div key={d.name} className="flex gap-3 rounded-lg border border-line px-3.5 py-2.5">
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-[0.6rem] font-bold text-white ${d.score >= 80 ? "bg-brand" : d.score >= 60 ? "bg-ink-2" : "bg-clay"}`}>
              {d.score}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium">{d.name}</p>
              <p className="mt-0.5 text-[0.7rem] leading-relaxed text-ink-2">{d.advice}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 亮点 & 建议 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {data.highlights.length > 0 && (
          <div className="rounded-lg border border-brand-line/40 bg-brand-soft/30 px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-brand-deep">✦ 亮点</p>
            <ul className="space-y-1.5">
              {data.highlights.map((h, i) => (
                <li key={i} className="text-[0.7rem] leading-relaxed text-ink-2">{h}</li>
              ))}
            </ul>
          </div>
        )}
        {data.improvements.length > 0 && (
          <div className="rounded-lg border border-line bg-bg-2/40 px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-ink-2">💡 改进建议</p>
            <ul className="space-y-1.5">
              {data.improvements.map((im, i) => (
                <li key={i} className="text-[0.7rem] leading-relaxed text-ink-2">{im}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== JD 匹配结果 ===== */
function JdResult({ data }: { data: JdMatchAnalysisResult }) {
  return (
    <div className="space-y-5">
      {/* 核心匹配度 */}
      <div className="flex flex-col items-center gap-2 rounded-xl bg-bg-2/60 py-5">
        <ScoreRing score={data.matchScore} size={112} />
        <span className="text-xs font-medium text-muted">JD 匹配度</span>
      </div>

      {/* 关键词匹配 */}
      <div>
        <p className="mb-2.5 text-xs font-semibold">关键词匹配</p>
        <div className="flex flex-wrap gap-1.5">
          {data.keywords.map((kw) => (
            <span
              key={kw.term}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-medium transition ${
                kw.hit ? "bg-brand-soft text-brand-deep" : "bg-bg-2 text-muted line-through decoration-muted/30"
              }`}
            >
              {kw.hit ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5.5L4 7.5L8 3" /></svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" /></svg>
              )}
              {kw.term}
            </span>
          ))}
        </div>
      </div>

      {/* 缺失 & 建议 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {data.missing.length > 0 && (
          <div className="rounded-lg border border-clay/20 bg-clay/5 px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-clay-deep">缺失能力</p>
            <ul className="space-y-1.5">
              {data.missing.map((m, i) => (
                <li key={i} className="text-[0.7rem] leading-relaxed text-ink-2">{m}</li>
              ))}
            </ul>
          </div>
        )}
        {data.suggestions.length > 0 && (
          <div className="rounded-lg border border-brand-line/40 bg-brand-soft/30 px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-brand-deep">💡 修改建议</p>
            <ul className="space-y-1.5">
              {data.suggestions.map((s, i) => (
                <li key={i} className="text-[0.7rem] leading-relaxed text-ink-2">{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
