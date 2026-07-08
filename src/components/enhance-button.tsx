"use client";

import { useState } from "react";
import { useStreamText } from "@/lib/use-stream-text";

/**
 * 经历「AI 润色」按钮 —— 把当前经历要点发给 /api/enhance,
 * 流式显示重写结果,确认后采用。
 */
export function EnhanceButton({
  bullets,
  onApply,
}: {
  bullets: string[];
  onApply: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { text, loading, error, run, reset } = useStreamText();
  const stripTags = (html: string) => html.replace(/<[^>]*>/g, "");
  const source = bullets.filter((b) => b.trim()).map(stripTags).join("\n");

  function handleRun() {
    setOpen(true);
    void run("/api/enhance", { bullet: source });
  }

  function cancel() {
    setOpen(false);
    reset();
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleRun}
        disabled={loading || !source}
        className="inline-flex items-center gap-1 rounded-md border border-brand-line bg-brand-soft px-2.5 py-1 text-[0.7rem] font-medium text-brand-deep transition hover:bg-brand hover:text-white disabled:opacity-50"
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        >
          <path d="M12 3l1.9 5.8L20 10l-5 3.6L16.5 20 12 16.5 7.5 20 9 13.6 4 10l6.1-1.2L12 3z" />
        </svg>
        {loading ? "AI 生成中…" : "AI 润色"}
      </button>

      {open && (text || error || loading) && (
        <div className="mt-2 rounded-md border border-line bg-white p-2.5">
          {error ? (
            <p className="text-[0.7rem] leading-relaxed text-clay-deep">{error}</p>
          ) : (
            <>
              <p className="text-[0.72rem] leading-relaxed text-ink">
                {text || "…"}
                {loading && (
                  <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-brand align-middle" />
                )}
              </p>
              {!loading && text && (
                <div className="mt-1.5 flex gap-2">
                  <button
                    onClick={() => {
                      onApply(text.trim());
                      cancel();
                    }}
                    className="rounded bg-brand px-2 py-0.5 text-[0.66rem] font-semibold text-white"
                  >
                    采用
                  </button>
                  <button
                    onClick={cancel}
                    className="rounded border border-line px-2 py-0.5 text-[0.66rem] text-ink-2"
                  >
                    取消
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
