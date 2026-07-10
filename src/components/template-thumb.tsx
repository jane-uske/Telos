import type { Template, TemplateLayout } from "@/lib/templates";

/**
 * 模板缩略图 —— 按 layout 渲染不同的迷你简历骨架。
 * 纯视觉示意,用「灰色行 + 强调色块」模拟真实排版。
 */
export function TemplateThumb({ template: t }: { template: Template }) {
  return (
    <div
      className="sheet mx-auto overflow-hidden"
      style={{ aspectRatio: "1 / 1.414" }}
    >
      <div className="h-full">{renderLayout(t.layout, t.accent)}</div>
    </div>
  );
}

/** 强调色的「小节标题」条 */
function Sec({ accent }: { accent: string }) {
  return <div className="mt-2 h-1 w-8 rounded" style={{ background: accent }} />;
}

function renderLayout(layout: TemplateLayout, accent: string) {
  switch (layout) {
    case "classic":
      return (
        <div className="h-full p-3">
          <div
            className="flex items-start justify-between border-b-2 pb-1.5"
            style={{ borderColor: accent }}
          >
            <div className="h-2.5 w-16 rounded-sm bg-ink" />
            <div className="h-1.5 w-8 rounded-sm" style={{ background: accent }} />
          </div>
          <Sec accent={accent} />
          <div className="mt-1.5 space-y-1">
            <div className="ln-d w-3/4" />
            <div className="ln" />
            <div className="ln w-5/6" />
            <div className="ln w-2/3" />
          </div>
          <Sec accent={accent} />
          <div className="mt-1.5 space-y-1">
            <div className="ln-d w-2/3" />
            <div className="ln" />
            <div className="ln w-3/4" />
          </div>
          <Sec accent={accent} />
          <div className="mt-1.5 space-y-1">
            <div className="ln w-5/6" />
            <div className="ln w-1/2" />
          </div>
        </div>
      );

    case "sidebar":
      return (
        <div className="flex h-full">
          <div className="w-[36%] p-2.5" style={{ background: accent }}>
            <div className="mx-auto h-8 w-8 rounded-full bg-white/90" />
            <div className="mt-2.5 h-1 w-3/4 rounded bg-white/80" />
            <div className="mt-1 h-1 w-1/2 rounded bg-white/60" />
            <div className="mt-2.5 h-1 w-6 rounded bg-white/80" />
            <div className="mt-1 space-y-1">
              <div className="h-[3px] w-full rounded bg-white/50" />
              <div className="h-[3px] w-2/3 rounded bg-white/50" />
              <div className="h-[3px] w-5/6 rounded bg-white/50" />
            </div>
          </div>
          <div className="flex-1 p-2.5">
            <div className="h-2.5 w-14 rounded-sm bg-ink" />
            <div className="mt-1 h-1.5 w-16 rounded-sm bg-muted/60" />
            <Sec accent={accent} />
            <div className="mt-1.5 space-y-1">
              <div className="ln-d w-3/4" />
              <div className="ln" />
              <div className="ln w-2/3" />
            </div>
            <Sec accent={accent} />
            <div className="mt-1.5 space-y-1">
              <div className="ln-d w-1/2" />
              <div className="ln w-3/4" />
            </div>
          </div>
        </div>
      );

    case "banner":
      return (
        <div className="h-full">
          <div className="p-2.5" style={{ background: accent }}>
            <div className="h-2.5 w-16 rounded-sm bg-white" />
            <div className="mt-1 h-1.5 w-20 rounded-sm bg-white/70" />
          </div>
          <div className="p-2.5">
            <div className="flex gap-2">
              <div className="flex-1">
                <Sec accent={accent} />
                <div className="mt-1.5 space-y-1">
                  <div className="ln-d w-3/4" />
                  <div className="ln" />
                  <div className="ln w-2/3" />
                </div>
              </div>
              <div className="flex-1">
                <Sec accent={accent} />
                <div className="mt-1.5 space-y-1">
                  <div className="ln-d w-2/3" />
                  <div className="ln w-3/4" />
                </div>
              </div>
            </div>
            <Sec accent={accent} />
            <div className="mt-1.5 space-y-1">
              <div className="ln" />
              <div className="ln w-5/6" />
              <div className="ln w-1/2" />
            </div>
          </div>
        </div>
      );

    case "serif":
      return (
        <div className="h-full p-3 text-center">
          <div className="font-serif text-[0.7rem] font-semibold text-ink">陈墨白</div>
          <div className="mt-0.5 text-[0.5rem] text-muted">高级前端工程师</div>
          <div
            className="mt-1.5 flex items-center justify-center gap-1.5"
          >
            <div className="h-px w-6" style={{ background: accent }} />
            <div className="h-1 w-1 rounded-full" style={{ background: accent }} />
            <div className="h-px w-6" style={{ background: accent }} />
          </div>
          <div
            className="mt-2.5 text-[0.55rem] font-bold tracking-widest"
            style={{ color: accent }}
          >
            EXPERIENCE
          </div>
          <div className="mt-1 space-y-1">
            <div className="ln mx-auto w-2/3" />
            <div className="ln mx-auto w-5/6" />
            <div className="ln mx-auto w-1/2" />
          </div>
          <div
            className="mt-2 text-[0.55rem] font-bold tracking-widest"
            style={{ color: accent }}
          >
            EDUCATION
          </div>
          <div className="mt-1 space-y-1">
            <div className="ln mx-auto w-3/4" />
            <div className="ln mx-auto w-2/3" />
          </div>
        </div>
      );

    case "minimal":
      return (
        <div className="h-full p-4">
          <div className="text-[0.75rem] font-light tracking-wide text-ink">
            CHEN MOBAI
          </div>
          <div className="mt-0.5 text-[0.5rem] tracking-widest text-muted">
            FRONTEND ENGINEER
          </div>
          <div className="mt-2.5 h-px bg-line" />
          <div className="mt-3 space-y-2">
            {[
              ["EXPERIENCE", "3/4"],
              ["PROJECTS", "5/6"],
              ["SKILLS", "2/3"],
            ].map(([label, w]) => (
              <div key={label}>
                <div className="text-[0.52rem] uppercase tracking-widest text-muted">
                  {label}
                </div>
                <div className="mt-1 space-y-1">
                  <div className="ln" style={{ width: `${w.includes("3") ? 75 : w.includes("5") ? 83 : 66}%` }} />
                  <div className="ln w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "timeline":
      return (
        <div className="h-full p-3">
          <div className="h-2.5 w-16 rounded-sm bg-ink" />
          <div className="mt-1 h-1.5 w-20 rounded-sm bg-muted/60" />
          <div className="relative mt-3 pl-3">
            <div
              className="absolute bottom-0 left-[3px] top-1 w-px"
              style={{ background: accent }}
            />
            <div className="relative space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="relative">
                  <div
                    className="absolute -left-[7px] top-0.5 h-1.5 w-1.5 rounded-full"
                    style={{ background: accent }}
                  />
                  <div className="ln-d w-2/3" />
                  <div className="mt-1 space-y-1">
                    <div className="ln w-5/6" />
                    <div className="ln w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "photo":
      return (
        <div className="h-full p-3">
          <div className="flex items-start gap-2.5">
            <div className="h-12 w-10 shrink-0 rounded border border-line bg-bg-2" />
            <div className="flex-1">
              <div className="h-2.5 w-14 rounded-sm bg-ink" />
              <div className="mt-1 h-1.5 w-16 rounded-sm bg-muted/60" />
              <div className="mt-1.5 space-y-1">
                <div className="ln w-3/4" />
                <div className="ln w-1/2" />
              </div>
            </div>
          </div>
          <div className="my-2.5 h-px bg-line" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Sec accent={accent} />
              <div className="mt-1.5 space-y-1">
                <div className="ln-d w-3/4" />
                <div className="ln" />
                <div className="ln w-1/2" />
              </div>
            </div>
            <div>
              <Sec accent={accent} />
              <div className="mt-1.5 space-y-1">
                <div className="ln-d w-2/3" />
                <div className="ln w-3/4" />
              </div>
            </div>
          </div>
          <Sec accent={accent} />
          <div className="mt-1.5 space-y-1">
            <div className="ln w-5/6" />
            <div className="ln w-2/3" />
          </div>
        </div>
      );

    case "two-col":
      return (
        <div className="h-full p-3">
          <div className="flex items-end justify-between border-b border-line pb-1.5">
            <div className="h-2.5 w-16 rounded-sm bg-ink" />
            <div className="space-y-1">
              <div className="ln w-12" />
              <div className="ln w-10" />
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-3">
            <div>
              <Sec accent={accent} />
              <div className="mt-1.5 space-y-1">
                <div className="ln-d w-3/4" />
                <div className="ln" />
                <div className="ln w-2/3" />
              </div>
              <Sec accent={accent} />
              <div className="mt-1.5 space-y-1">
                <div className="ln-d w-1/2" />
                <div className="ln w-3/4" />
              </div>
            </div>
            <div>
              <Sec accent={accent} />
              <div className="mt-1.5 space-y-1">
                <div className="ln-d w-2/3" />
                <div className="ln w-5/6" />
                <div className="ln w-1/2" />
              </div>
              <Sec accent={accent} />
              <div className="mt-1.5 space-y-1">
                <div className="ln-d w-3/4" />
                <div className="ln w-2/3" />
              </div>
            </div>
          </div>
        </div>
      );

    case "dark":
      return (
        <div className="h-full">
          <div className="p-2.5" style={{ background: "#1a2330" }}>
            <div className="h-2.5 w-14 rounded-sm bg-white" />
            <div className="mt-1 h-1.5 w-16 rounded-sm bg-white/60" />
          </div>
          <div className="p-2.5">
            <Sec accent={accent} />
            <div className="mt-1.5 space-y-1">
              <div className="ln-d w-3/4" />
              <div className="ln" />
              <div className="ln w-5/6" />
              <div className="ln w-1/2" />
            </div>
            <Sec accent={accent} />
            <div className="mt-1.5 space-y-1">
              <div className="ln-d w-2/3" />
              <div className="ln w-3/4" />
              <div className="ln w-1/2" />
            </div>
            <Sec accent={accent} />
            <div className="mt-1.5 space-y-1">
              <div className="ln w-5/6" />
              <div className="ln w-2/3" />
            </div>
          </div>
        </div>
      );

    case "metro":
      return (
        <div className="h-full p-2.5">
          <div className="rounded border border-line p-2" style={{ borderTopColor: accent, borderTopWidth: 2 }}>
            <div className="h-2 w-12 rounded-sm bg-ink" />
            <div className="mt-1 h-1 w-16 rounded-sm bg-muted/60" />
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <div className="col-span-2 rounded border border-line p-1.5">
              <div className="h-1 w-6 rounded" style={{ background: accent }} />
              <div className="mt-1 space-y-0.5">
                <div className="ln-d w-2/3" />
                <div className="ln" />
                <div className="ln w-3/4" />
              </div>
            </div>
            <div className="rounded border border-line p-1.5">
              <div className="h-1 w-5 rounded" style={{ background: accent }} />
              <div className="mt-1 space-y-0.5">
                <div className="ln" />
                <div className="ln w-2/3" />
              </div>
            </div>
            <div className="rounded border border-line p-1.5">
              <div className="h-1 w-5 rounded" style={{ background: accent }} />
              <div className="mt-1 space-y-0.5">
                <div className="ln w-3/4" />
                <div className="ln w-1/2" />
              </div>
            </div>
            <div className="rounded border border-line p-1.5">
              <div className="h-1 w-5 rounded" style={{ background: accent }} />
              <div className="mt-1 space-y-0.5">
                <div className="ln" />
                <div className="ln w-1/2" />
              </div>
            </div>
            <div className="rounded border border-line p-1.5">
              <div className="h-1 w-5 rounded" style={{ background: accent }} />
              <div className="mt-1 space-y-0.5">
                <div className="ln w-2/3" />
                <div className="ln w-3/4" />
              </div>
            </div>
          </div>
        </div>
      );

    case "elegant":
      return (
        <div className="h-full p-3 text-center">
          <div className="font-serif text-[0.7rem] font-semibold text-ink">陈墨白</div>
          <div className="mt-0.5 text-[0.45rem] text-muted">高级前端工程师</div>
          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            <div className="h-px w-6" style={{ background: accent }} />
            <div className="h-1 w-1 rotate-45" style={{ background: accent }} />
            <div className="h-px w-6" style={{ background: accent }} />
          </div>
          <div className="mt-1 flex items-center justify-center gap-1 text-[0.4rem] text-faint">
            <span>email</span>
            <span style={{ color: accent }}>·</span>
            <span>phone</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1">
            <div className="h-px flex-1 bg-line" />
            <div className="h-1 w-1 rotate-45" style={{ background: accent }} />
            <div className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-1 text-[0.45rem] font-bold tracking-widest" style={{ color: accent }}>EXPERIENCE</div>
          <div className="mt-1 space-y-0.5">
            <div className="ln mx-auto w-5/6" />
            <div className="ln mx-auto w-2/3" />
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-1">
            <div className="h-px flex-1 bg-line" />
            <div className="h-1 w-1 rotate-45" style={{ background: accent }} />
            <div className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-1 text-[0.45rem] font-bold tracking-widest" style={{ color: accent }}>PROJECTS</div>
          <div className="mt-1 space-y-0.5">
            <div className="ln mx-auto w-3/4" />
            <div className="ln mx-auto w-1/2" />
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-1">
            <div className="h-px flex-1 bg-line" />
            <div className="h-1 w-1 rotate-45" style={{ background: accent }} />
            <div className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-1 text-[0.45rem] font-bold tracking-widest" style={{ color: accent }}>SKILLS</div>
          <div className="mt-1 space-y-0.5">
            <div className="ln mx-auto w-2/3" />
            <div className="ln mx-auto w-1/2" />
          </div>
        </div>
      );

    case "compact":
      return (
        <div className="h-full">
          <div className="border-b-2 px-2.5 py-1.5" style={{ borderColor: accent }}>
            <div className="flex items-end justify-between">
              <div>
                <div className="h-2 w-10 rounded-sm bg-ink" />
                <div className="mt-0.5 h-1 w-14 rounded-sm bg-muted/60" />
              </div>
              <div className="space-y-0.5">
                <div className="ln w-10" />
                <div className="ln w-8" />
              </div>
            </div>
          </div>
          <div className="flex">
            <div className="flex-1 p-2.5">
              <Sec accent={accent} />
              <div className="mt-1 space-y-0.5">
                <div className="ln-d w-2/3" />
                <div className="ln" />
                <div className="ln w-3/4" />
              </div>
              <Sec accent={accent} />
              <div className="mt-1 space-y-0.5">
                <div className="ln-d w-1/2" />
                <div className="ln w-5/6" />
                <div className="ln w-2/3" />
              </div>
              <Sec accent={accent} />
              <div className="mt-1 space-y-0.5">
                <div className="ln-d w-3/4" />
                <div className="ln w-1/2" />
              </div>
            </div>
            <div className="w-[30%] border-l border-line p-2">
              <Sec accent={accent} />
              <div className="mt-1 space-y-0.5">
                <div className="ln" />
                <div className="ln w-2/3" />
              </div>
              <Sec accent={accent} />
              <div className="mt-1 space-y-0.5">
                <div className="ln w-3/4" />
                <div className="ln w-1/2" />
              </div>
              <Sec accent={accent} />
              <div className="mt-1 space-y-0.5">
                <div className="ln" />
              </div>
            </div>
          </div>
        </div>
      );

    case "right-rail":
      return (
        <div className="flex h-full">
          <div className="flex-1 p-2.5">
            <div className="h-2.5 w-14 rounded-sm bg-ink" />
            <div className="mt-1 h-1.5 w-16 rounded-sm" style={{ background: accent }} />
            <Sec accent={accent} />
            <div className="mt-1.5 space-y-1">
              <div className="ln-d w-3/4" />
              <div className="ln" />
              <div className="ln w-2/3" />
            </div>
            <Sec accent={accent} />
            <div className="mt-1.5 space-y-1">
              <div className="ln-d w-1/2" />
              <div className="ln w-5/6" />
              <div className="ln w-3/4" />
            </div>
          </div>
          <div className="w-[31%] bg-bg-2/70 p-2">
            <div className="ln w-3/4" />
            <div className="mt-0.5 space-y-0.5">
              <div className="ln w-full" />
              <div className="ln w-2/3" />
            </div>
            <Sec accent={accent} />
            <div className="mt-1 space-y-0.5">
              <div className="ln" />
              <div className="ln w-3/4" />
            </div>
            <Sec accent={accent} />
            <div className="mt-1 space-y-0.5">
              <div className="ln w-5/6" />
            </div>
          </div>
        </div>
      );

    case "statement":
      return (
        <div className="h-full p-3">
          <div className="h-4 w-20 rounded-sm bg-ink" />
          <div className="mt-1 h-1.5 w-8 rounded" style={{ background: accent }} />
          <div className="mt-2 flex items-baseline justify-between">
            <div className="h-1.5 w-14 rounded-sm bg-muted/60" />
            <div className="ln w-10" />
          </div>
          <Sec accent={accent} />
          <div className="mt-1.5 space-y-1">
            <div className="ln-d w-3/4" />
            <div className="ln" />
            <div className="ln w-5/6" />
          </div>
          <Sec accent={accent} />
          <div className="mt-1.5 space-y-1">
            <div className="ln-d w-2/3" />
            <div className="ln w-3/4" />
          </div>
        </div>
      );

    default:
      return null;
  }
}
