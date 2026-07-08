"use client";

import { useState } from "react";
import type { Resume } from "@/lib/schema";
import type { AnalysisResult, GeneralAnalysisResult, JdMatchAnalysisResult } from "@/lib/analysis-types";

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
    <div className="mb-4 rounded-card border border-line bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">AI 分析</p>
          <div className="flex rounded-md border border-line text-xs">
            <button
              onClick={() => { setMode("general"); setResult(null); }}
              className={`rounded-l-md px-2.5 py-1 transition ${mode === "general" ? "bg-brand text-white" : "hover:bg-bg-2"}`}
            >
              通用分析
            </button>
            <button
              onClick={() => { setMode("jd"); setResult(null); }}
              className={`rounded-r-md px-2.5 py-1 transition ${mode === "jd" ? "bg-brand text-white" : "hover:bg-bg-2"}`}
            >
              JD 匹配
            </button>
          </div>
        </div>
        <button onClick={onClose} className="text-xs text-muted hover:text-ink">✕</button>
      </div>

      {mode === "jd" && (
        <textarea
          className="mb-3 w-full rounded-lg border border-line bg-bg-2/50 px-3 py-2 text-xs focus:border-brand focus:bg-white focus:outline-none"
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
          className="rounded-[9px] bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-deep disabled:opacity-50"
        >
          {mode === "general" ? "开始分析" : "分析匹配度"}
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-4 text-xs text-muted">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          AI 分析中…
        </div>
      )}

      {error && <p className="text-xs text-clay">{error}</p>}

      {result && result.type === "general" && <GeneralResult data={result} />}
      {result && result.type === "jd" && <JdResult data={result} />}

      {result && (
        <button onClick={() => setResult(null)} className="mt-3 text-xs text-muted hover:text-ink">
          重新分析
        </button>
      )}
    </div>
  );
}

function ScoreBar({ score, accent }: { score: number; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: accent ? "var(--color-brand)" : "var(--color-ink-2)" }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${accent ? "text-brand" : "text-ink"}`}>{score}</span>
    </div>
  );
}

function GeneralResult({ data }: { data: GeneralAnalysisResult }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs text-muted">综合评分</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-brand">{data.overall}</span>
          <span className="text-sm text-muted">/100</span>
        </div>
        <ScoreBar score={data.overall} accent />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {data.dimensions.map((d) => (
          <div key={d.name} className="rounded-lg border border-line p-2.5">
            <p className="mb-1 text-[0.68rem] font-medium">{d.name}</p>
            <ScoreBar score={d.score} />
            <p className="mt-1.5 text-[0.65rem] leading-relaxed text-ink-2">{d.advice}</p>
          </div>
        ))}
      </div>
      {data.highlights.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-brand">✦ 亮点</p>
          <ul className="space-y-1">
            {data.highlights.map((h, i) => (
              <li key={i} className="text-[0.72rem] leading-relaxed text-ink-2">· {h}</li>
            ))}
          </ul>
        </div>
      )}
      {data.improvements.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink-2">💡 改进建议</p>
          <ul className="space-y-1">
            {data.improvements.map((im, i) => (
              <li key={i} className="text-[0.72rem] leading-relaxed text-ink-2">· {im}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function JdResult({ data }: { data: JdMatchAnalysisResult }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs text-muted">JD 匹配度</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-brand">{data.matchScore}</span>
          <span className="text-sm text-muted">%</span>
        </div>
        <ScoreBar score={data.matchScore} accent />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold">关键词匹配</p>
        <div className="flex flex-wrap gap-1.5">
          {data.keywords.map((kw) => (
            <span
              key={kw.term}
              className={`rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${
                kw.hit ? "bg-brand-soft text-brand-deep" : "bg-bg-2 text-muted"
              }`}
            >
              {kw.hit ? "✓" : "✗"} {kw.term}
            </span>
          ))}
        </div>
      </div>
      {data.missing.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-clay">缺失能力</p>
          <ul className="space-y-1">
            {data.missing.map((m, i) => (
              <li key={i} className="text-[0.72rem] text-ink-2">· {m}</li>
            ))}
          </ul>
        </div>
      )}
      {data.suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-brand">💡 修改建议</p>
          <ul className="space-y-1">
            {data.suggestions.map((s, i) => (
              <li key={i} className="text-[0.72rem] leading-relaxed text-ink-2">· {s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
