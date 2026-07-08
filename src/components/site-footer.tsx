const cols = [
  {
    title: "产品",
    items: ["模板中心", "在线编辑", "AI 智写"],
  },
  {
    title: "场景",
    items: ["互联网求职", "校园招聘", "海外留学"],
  },
  {
    title: "帮助",
    items: ["使用教程", "简历范例", "联系我们"],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 px-5 py-10 md:grid-cols-5 md:px-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-lg font-bold text-white">
              T
            </span>
            <span className="text-[1.05rem] font-bold">
              Telos<span className="text-brand"> 简历</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            专业简历,智能生成。让 AI 帮你写出能上岸的那一份。
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="mb-3 text-sm font-semibold">{c.title}</p>
            <ul className="space-y-2 text-sm text-muted">
              {c.items.map((i) => (
                <li key={i}>
                  <a href="#" className="transition-colors hover:text-brand">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-muted sm:flex-row md:px-8">
          <p>© 2026 Telos 简历 · 也许,这是你的最后一份简历。</p>
          <p>浙ICP备XXXXXXXX号</p>
        </div>
      </div>
    </footer>
  );
}
