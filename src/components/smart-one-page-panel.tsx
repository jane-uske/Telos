"use client";

import { useState } from "react";
import { useResumeStore } from "@/lib/store";

type Phase = "idle" | "compressing-layout" | "compressing-ai" | "done" | "failed";

export function SmartOnePagePanel({
  overflowing,
  pageCount,
  onClose,
}: {
  overflowing: boolean;
  pageCount: number;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [changes, setChanges] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme, resume, setResume, saveOnePageSnapshot, revertOnePage, clearOnePageSnapshot } = useResumeStore();

  const waitForRender = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 400)));

  const checkOverflow = () => {
    const el = document.getElementById("resume-sheet");
    return el ? el.scrollHeight > 1123 : false;
  };

  const run = async () => {
    saveOnePageSnapshot();
    const log: string[] = [];

    setPhase("compressing-layout");
    setError(null);

    const spacingOrder = ["loose", "normal", "compact"] as const;
    const currentIdx = spacingOrder.indexOf(theme.spacing);
    for (let i = currentIdx + 1; i < spacingOrder.length; i++) {
      setTheme({ spacing: spacingOrder[i] });
      log.push(`间距: ${theme.spacing} → ${spacingOrder[i]}`);
      await waitForRender();
      if (!checkOverflow()) {
        setChanges(log);
        setPhase("done");
        return;
      }
    }

    setPhase("compressing-ai");
    try {
      const res = await fetch("/api/condense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "AI 精简失败");
      }
      const condensed = await res.json();
      setResume(condensed.resume ?? condensed);
      log.push("AI 精简了经历描述");
      await waitForRender();

      if (!checkOverflow()) {
        setChanges(log);
        setPhase("done");
      } else {
        setChanges(log);
        setPhase("failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 精简失败");
      setChanges(log);
      setPhase("failed");
    }
  };

  const handleAccept = () => {
    clearOnePageSnapshot();
    onClose();
  };

  const handleRevert = () => {
    revertOnePage();
    onClose();
  };

  return (
    <div className="mb-4 rounded-card border border-line bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold">智能一页</p>
        <button onClick={onClose} className="text-xs text-muted hover:text-ink">✕</button>
      </div>

      {phase === "idle" && (
        <>
          <p className="mb-3 text-xs text-ink-2">
            {overflowing
              ? `当前简历约 ${pageCount > 1 ? pageCount.toFixed(1) : "1+"} 页，超出 A4 单页范围。`
              : "当前简历已在一页以内。"}
          </p>
          {overflowing ? (
            <>
              <p className="mb-3 text-[0.68rem] text-muted">
                将先尝试调整排版间距，如仍超出则由 AI 精简内容。操作可一键撤销。
              </p>
              <button
                onClick={run}
                className="rounded-[9px] bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-deep"
              >
                开始压缩
              </button>
            </>
          ) : (
            <p className="text-[0.68rem] text-muted">无需压缩 ✓</p>
          )}
        </>
      )}

      {phase === "compressing-layout" && (
        <div className="space-y-2 py-2">
          <StepRow label="第 1 步: 调整间距…" status="loading" />
        </div>
      )}

      {phase === "compressing-ai" && (
        <div className="space-y-2 py-2">
          <StepRow label="第 1 步: 间距已调整" status="done" />
          <StepRow label="第 2 步: AI 精简内容中…" status="loading" />
        </div>
      )}

      {(phase === "done" || phase === "failed") && (
        <div className="space-y-3">
          {phase === "done" && (
            <p className="text-xs font-semibold text-brand">✓ 已压缩至一页</p>
          )}
          {phase === "failed" && (
            <p className="text-xs font-semibold text-clay">
              {error ?? "内容仍超出一页，建议手动删减部分经历"}
            </p>
          )}
          {changes.length > 0 && (
            <div className="rounded-lg border border-line bg-bg-2/50 p-3">
              <p className="mb-1.5 text-[0.68rem] font-medium text-muted">变更摘要</p>
              <ul className="space-y-0.5">
                {changes.map((c, i) => (
                  <li key={i} className="text-[0.7rem] text-ink-2">· {c}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="rounded-[9px] bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-deep"
            >
              {phase === "done" ? "接受更改" : "保留当前更改"}
            </button>
            <button
              onClick={handleRevert}
              className="rounded-[9px] border border-line px-4 py-1.5 text-xs font-medium transition hover:bg-bg-2"
            >
              撤销还原
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepRow({ label, status }: { label: string; status: "loading" | "done" }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {status === "loading" ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      ) : (
        <span className="text-brand">✓</span>
      )}
      <span className={status === "done" ? "text-muted" : "text-ink"}>{label}</span>
    </div>
  );
}
