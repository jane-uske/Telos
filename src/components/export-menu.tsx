"use client";

import { useEffect, useRef, useState } from "react";
import { exportResumeServer } from "@/lib/export-pdf-server";
import type { Resume } from "@/lib/schema";
import type { ResumeTheme, SectionKey } from "@/lib/store";

/** 导出下拉：品牌色主按钮 + PDF / HTML 两种格式，服务端生成。 */
export function ExportMenu({
  resume,
  theme,
  sectionOrder,
}: {
  resume: Resume;
  theme: ResumeTheme;
  sectionOrder: SectionKey[];
}) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<null | "pdf" | "html">(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function run(format: "pdf" | "html") {
    setOpen(false);
    if (exporting) return;
    setExporting(format);
    try {
      await exportResumeServer(resume, theme, sectionOrder, format);
    } catch (e) {
      alert(e instanceof Error ? e.message : "导出失败,请重试");
      console.error(e);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={exporting !== null}
        className="flex items-center gap-1.5 rounded-[9px] bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-deep disabled:opacity-60"
      >
        {exporting ? "生成中…" : "导出"}
        {!exporting && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M1.5 2.5L4 5.5L6.5 2.5" />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[150px] rounded-lg border border-line bg-white p-1.5 shadow-pop">
          <MenuItem onClick={() => run("pdf")} title="PDF" desc="文字版 · ATS 友好" />
          <MenuItem onClick={() => run("html")} title="HTML" desc="自包含网页" />
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, title, desc }: { onClick: () => void; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col rounded-md px-2.5 py-1.5 text-left transition hover:bg-bg-2"
    >
      <span className="text-xs font-medium text-ink">导出 {title}</span>
      <span className="text-[0.66rem] text-muted">{desc}</span>
    </button>
  );
}
