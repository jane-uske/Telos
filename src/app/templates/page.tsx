"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { TemplateThumb } from "@/components/template-thumb";
import { templates, filters } from "@/lib/templates";

export default function TemplatesPage() {
  const [active, setActive] = useState("全部");

  const list =
    active === "全部"
      ? templates
      : templates.filter((t) => t.tags.includes(active));

  return (
    <>
      <SiteNav />

      <section className="mx-auto max-w-[1280px] px-5 pb-20 pt-14 md:px-8 md:pt-20">
        {/* header */}
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-semibold tracking-wide text-brand">
            模板中心
          </p>
          <h1 className="font-cn text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold leading-[1.2] tracking-tight">
            挑选一份适合你的<span className="text-brand">专业模板</span>
          </h1>
          <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-2">
            覆盖互联网、金融、校招、留学、创意等全场景,一键切换,ATS 友好。
          </p>
        </div>

        {/* filters */}
        <div className="mb-8 flex items-center gap-6">
          <div
            className="flex gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium transition ${
                  active === f
                    ? "bg-ink text-white"
                    : "text-ink-2 hover:bg-bg-2 hover:text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="hidden shrink-0 text-xs tabular-nums text-muted md:inline">
            {list.length} 套模板
          </span>
        </div>

        {/* grid */}
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4 xl:gap-6">
          {list.map((t) => (
            <Link
              key={t.id}
              href={`/editor?template=${t.id}`}
              className="group relative block overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-pop"
            >
              {/* thumbnail */}
              <div className="border-b border-line bg-bg-2/60 p-5">
                <TemplateThumb template={t} />
              </div>

              {/* info */}
              <div className="px-4 pb-4 pt-3.5">
                <div className="flex items-center gap-2">
                  <p className="text-[0.92rem] font-semibold leading-snug">
                    {t.name}
                  </p>
                  <span
                    className="rounded-[5px] px-1.5 py-[1px] text-[0.62rem] font-semibold leading-snug"
                    style={{ background: t.accentSoft, color: t.accent }}
                  >
                    {t.category}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {t.en} · {t.desc}
                </p>
              </div>

              {/* hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-colors group-hover:bg-ink/[0.03]">
                <span className="translate-y-1 rounded-[9px] bg-brand px-5 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  使用此模板 →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {list.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm text-muted">该分类下暂无模板</p>
            <button
              onClick={() => setActive("全部")}
              className="mt-3 text-sm font-medium text-brand hover:text-brand-deep"
            >
              查看全部模板 →
            </button>
          </div>
        )}
      </section>

      <SiteFooter />
    </>
  );
}
