"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

/** 工具栏下拉选择器:点击 trigger 弹出面板,点外面关闭 */
export function ToolbarDropdown({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-[9px] border px-3 py-1.5 text-xs font-medium transition ${
          open
            ? "border-brand bg-brand-soft text-brand-deep"
            : "border-line bg-white text-ink-2 hover:border-brand-line hover:text-brand-deep"
        }`}
      >
        {label}
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1.5 2.5L4 5.5L6.5 2.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] rounded-lg border border-line bg-white p-1.5 shadow-pop">
          {children}
        </div>
      )}
    </div>
  );
}

/** 下拉项 */
export function DropdownItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition ${
        active ? "bg-brand-soft font-medium text-brand-deep" : "text-ink-2 hover:bg-bg-2"
      }`}
    >
      {children}
    </button>
  );
}
