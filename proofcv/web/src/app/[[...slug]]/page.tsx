import PageClient from "./PageClient";

// 服务端薄壳：只为静态导出（桌面壳 TELOS_DESKTOP 构建）枚举可预渲染的路径。
// slug 列表与 routing.ts 的 TAB_TO_SEG 保持一致（routing.ts 引着 store，不能进服务端组件）。
// Web 部署行为不变：dynamicParams 默认 true，未列出的路径照旧动态渲染同一个单页。
export function generateStaticParams() {
  const tabs = [
    "dashboard",
    "evidence",
    "jobs",
    "pkg",
    "resume",
    "qa",
    "mock",
    "records",
    "import",
    "interview",
    "settings",
  ];
  return [{ slug: [] }, ...tabs.map((t) => ({ slug: [t] }))];
}

export default function Page() {
  return <PageClient />;
}
