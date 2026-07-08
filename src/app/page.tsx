import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteNav />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, var(--color-brand-soft) 0%, transparent 60%)",
          }}
        />
        <div className="mx-auto grid max-w-[1280px] grid-cols-12 items-center gap-10 px-5 pb-12 pt-16 md:px-8 md:pt-24">
          {/* 文案 */}
          <div className="col-span-12 lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-brand-deep shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              新 · AI 一键匹配 JD 关键词
            </div>
            <h1 className="mt-5 font-cn text-[clamp(2.2rem,5vw,3.6rem)] font-bold leading-[1.15] tracking-tight">
              做一份 <span className="text-brand">HR 一眼相中</span>
              <br />
              的专业简历
            </h1>
            <p className="mt-5 max-w-[30rem] font-cn text-[1.05rem] leading-[1.85] text-ink-2">
              100+ 专业模板覆盖全行业,AI 帮你润色每段经历、命中职位关键词。ATS 友好,导出即用。
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 rounded-[9px] bg-brand px-7 py-3.5 text-[0.95rem] font-semibold text-white shadow-[inset_0_-1px_0_var(--color-brand-deep)] transition hover:-translate-y-px hover:bg-brand-deep"
              >
                免费制作简历 <span>→</span>
              </Link>
              <Link
                href="/templates"
                className="rounded-[9px] border border-line bg-white px-6 py-3.5 text-[0.95rem] font-semibold transition hover:border-brand-line hover:bg-brand-soft hover:text-brand-deep"
              >
                挑选模板
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-5 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-brand">✓</span> 无需注册即可使用
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-brand">✓</span> 数据本地保存
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-brand">✓</span> 中英双语
              </span>
            </div>
          </div>

          {/* 预览卡 */}
          <div className="relative col-span-12 lg:col-span-6">
            <div className="relative mx-auto max-w-[420px]">
              <div className="sheet rounded-md p-7" style={{ aspectRatio: "1 / 1.414" }}>
                <div className="slide-in flex items-start justify-between border-b-2 border-brand pb-3" style={{ animationDelay: "0.1s" }}>
                  <div>
                    <p className="font-cn text-2xl font-bold">陈墨白</p>
                    <p className="mt-0.5 font-sans text-xs text-muted">高级前端工程师</p>
                  </div>
                  <div className="text-right font-sans text-[0.6rem] leading-snug text-faint">
                    mobai@telos.cv
                    <br />
                    138 0000 0000
                  </div>
                </div>
                <p className="slide-in mt-3.5 text-[0.62rem] font-bold tracking-wider text-brand" style={{ animationDelay: "0.25s" }}>经 历</p>
                <div className="mt-2 space-y-2">
                  <div className="slide-in" style={{ animationDelay: "0.35s" }}>
                    <div className="flex justify-between text-[0.66rem]">
                      <span className="font-semibold">某里巴巴 · 高级前端</span>
                      <span className="text-faint">2021—至今</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      <div className="ln" />
                      <div className="ln w-5/6" />
                      <div className="ln w-2/3" />
                    </div>
                  </div>
                  <div className="slide-in" style={{ animationDelay: "0.48s" }}>
                    <div className="flex justify-between text-[0.66rem]">
                      <span className="font-semibold">某节跳动 · 前端</span>
                      <span className="text-faint">2018—2021</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      <div className="ln" />
                      <div className="ln w-3/4" />
                    </div>
                  </div>
                </div>
                <p className="slide-in mt-3.5 text-[0.62rem] font-bold tracking-wider text-brand" style={{ animationDelay: "0.6s" }}>项 目</p>
                <div className="slide-in mt-2 space-y-1" style={{ animationDelay: "0.7s" }}>
                  <div className="flex justify-between text-[0.66rem]">
                    <span className="font-semibold">Telos 智能简历</span>
                    <span className="text-faint">全栈开发</span>
                  </div>
                  <div className="space-y-1">
                    <div className="ln w-4/5" />
                    <div className="ln w-3/5" />
                  </div>
                </div>
                <p className="slide-in mt-3.5 text-[0.62rem] font-bold tracking-wider text-brand" style={{ animationDelay: "0.82s" }}>教 育</p>
                <div className="slide-in mt-2 flex justify-between text-[0.66rem]" style={{ animationDelay: "0.92s" }}>
                  <span className="font-semibold">浙江大学</span>
                  <span className="text-faint">2014—2018</span>
                </div>
                <p className="slide-in mt-3.5 text-[0.62rem] font-bold tracking-wider text-brand" style={{ animationDelay: "1.02s" }}>技 能</p>
                <div className="slide-in mt-2 flex flex-wrap gap-1" style={{ animationDelay: "1.12s" }}>
                  {["React", "Next.js", "TypeScript", "Node.js"].map((s) => (
                    <span
                      key={s}
                      className="rounded bg-bg-2 px-1.5 py-0.5 text-[0.58rem] text-ink-2"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="slide-in mt-3.5 text-[0.62rem] font-bold tracking-wider text-brand" style={{ animationDelay: "1.24s" }}>证 书</p>
                <div className="slide-in mt-2 flex justify-between text-[0.66rem]" style={{ animationDelay: "1.32s" }}>
                  <span className="font-semibold">PMP 项目管理认证</span>
                  <span className="text-faint">2022</span>
                </div>
                <p className="slide-in mt-3.5 text-[0.62rem] font-bold tracking-wider text-brand" style={{ animationDelay: "1.42s" }}>语 言</p>
                <div className="slide-in mt-2 flex gap-3 text-[0.66rem]" style={{ animationDelay: "1.5s" }}>
                  <span className="font-semibold">英语 <span className="font-normal text-faint">CET-6</span></span>
                  <span className="font-semibold">普通话 <span className="font-normal text-faint">母语</span></span>
                </div>
                <p className="slide-in mt-3.5 text-[0.62rem] font-bold tracking-wider text-brand" style={{ animationDelay: "1.6s" }}>奖 项</p>
                <div className="slide-in mt-2 flex justify-between text-[0.66rem]" style={{ animationDelay: "1.68s" }}>
                  <span className="font-semibold">年度技术之星</span>
                  <span className="text-faint">2023</span>
                </div>
              </div>

              {/* 浮卡:AI 评分 — 右侧,弹入动画 */}
              <div className="pop-in absolute -right-5 top-10 hidden w-32 rounded-xl border border-line bg-white p-3 shadow-pop sm:block" style={{ animationDelay: "1.8s" }}>
                <p className="text-[0.62rem] text-muted">AI 简历评分</p>
                <p className="mt-1 text-2xl font-bold leading-none text-brand">
                  98<span className="text-sm text-muted">/100</span>
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-2">
                  <div className="fill-bar h-full w-[98%] rounded-full bg-brand" style={{ animationDelay: "2s" }} />
                </div>
              </div>

              {/* 浮卡:模板切换 — 左侧,弹入动画 */}
              <div className="pop-in absolute -left-3 bottom-8 hidden items-center gap-2 rounded-xl border border-line bg-white p-2.5 shadow-pop sm:flex" style={{ animationDelay: "2.1s" }}>
                <div className="h-9 w-7 rounded border border-line bg-bg-2" />
                <div className="h-9 w-7 rounded border border-brand-line bg-brand-soft" />
                <div className="h-9 w-7 rounded border border-line bg-bg-2" />
                <span className="pr-1 text-[0.62rem] text-muted">100+ 模板</span>
              </div>
            </div>
          </div>
        </div>

        {/* 数据条 */}
        <div className="mx-auto max-w-[1280px] px-5 pb-10 md:px-8">
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-white shadow-card md:grid-cols-4">
            {[
              ["100+", "专业模板"],
              ["98%", "ATS 通过率"],
              ["500强", "HR 推荐工具"],
              ["800万+", "用户的选择"],
            ].map(([n, label], i) => (
              <div
                key={label}
                className={`border-line p-6 text-center ${
                  i < 2 ? "border-b md:border-b-0" : ""
                } ${i % 2 === 0 ? "md:border-r" : ""}`}
              >
                <p className="text-2xl font-bold">
                  {n.replace(/[+%强]/g, "")}
                  <span className="text-brand">{n.match(/[+%强]/g)?.join("") ?? ""}</span>
                </p>
                <p className="mt-1 text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI 智写 ===== */}
      <section id="ai" className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold text-brand">AI 智写</p>
          <h2 className="font-cn text-[clamp(1.7rem,3.4vw,2.6rem)] font-bold tracking-tight">
            让 AI 把你的经历,<span className="text-brand">写得更有分量</span>
          </h2>
          <p className="mt-2 font-cn text-ink-2">
            润色、JD 匹配、双语翻译,把平淡的句子变成 HR 想约面试的那种。
          </p>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              title: "AI 智能润色",
              desc: "选中一段经历,AI 自动改写为「动词开头 + 量化结果」的专业表达。",
              icon: (
                <path d="M12 3l1.9 5.8L20 10l-5 3.6L16.5 20 12 16.5 7.5 20 9 13.6 4 10l6.1-1.2L12 3z" />
              ),
            },
            {
              title: "JD 职位匹配",
              desc: "粘贴职位描述,自动抽取关键词,标出命中与缺失,一键补全。",
              icon: (
                <>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </>
              ),
            },
            {
              title: "中英双语翻译",
              desc: "一份内容生成地道的中英两版,海外/外企投递无缝切换。",
              icon: <path d="M3 5h12M9 3v2c0 4-3 7-6 8M5 19c3-1 6-4 6-9" />,
            },
          ].map((c) => (
            <div key={c.title} className="rounded-card border border-line bg-white p-6 shadow-card">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {c.icon}
                </svg>
              </div>
              <p className="text-[1.05rem] font-semibold">{c.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* before / after */}
        <div className="rounded-card border border-line bg-white p-6 shadow-card md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-[0.66rem] font-semibold text-white">
              AI 润色
            </span>
            <span className="text-xs text-muted">演示</span>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted">原句</p>
              <p className="text-sm leading-relaxed text-ink-2 line-through decoration-faint">
                负责电商网站前端开发,优化了页面加载速度。
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-brand">AI 润色后</p>
              <p className="text-sm leading-relaxed text-ink">
                主导电商平台<span className="font-medium text-brand">前端架构</span>重构,首屏加载{" "}
                <span className="font-medium text-brand">3.8s → 1.1s</span>,转化率提升{" "}
                <span className="font-medium text-brand">14%</span>,支撑日均千万级 UV。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-[1280px] px-5 pb-20 md:px-8">
        <div
          className="relative overflow-hidden rounded-3xl p-10 text-center md:p-16"
          style={{
            background:
              "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-deep) 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #fff 0, transparent 40%), radial-gradient(circle at 80% 70%, #fff 0, transparent 35%)",
            }}
          />
          <div className="relative">
            <h2 className="font-cn text-[clamp(1.8rem,3.6vw,2.8rem)] font-bold tracking-tight text-white">
              现在就开始,做你的<span className="opacity-90">下一份简历</span>
            </h2>
            <p className="mt-3 font-cn text-white/85">
              免费使用,100+ 模板,AI 全程助力。也许,它就是你最后一份。
            </p>
            <Link
              href="/editor"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-[0.95rem] font-semibold text-brand-deep transition hover:bg-bg"
            >
              免费制作简历 →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
