// 简历 PDF 导出 —— 与 Telos 同构的 Puppeteer HTML→PDF 服务端导出。
// 客户端把 SpecRenderer 已渲染的纸面 DOM（全内联样式）POST 过来，
// 服务端用本地 Chrome 打印成 A4 PDF 返回，不重复实现任何渲染逻辑。

import type { NextRequest } from "next/server";
import puppeteer from "puppeteer-core";
import { findChrome } from "@/lib/chrome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=Noto+Serif+SC:wght@600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap";

const MAX_HTML = 2_000_000;

function buildDoc(html: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${FONT_URL}" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    font-family: 'Noto Sans SC', system-ui, sans-serif;
    color: #16181d;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* 屏幕预览的卡片装饰在纸面上去掉 */
  .pcv-print-root > div {
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    overflow: visible !important;
  }
  /* 内部准备标注（已核验/待确认/证据不足/★钩子）绝不出现在给企业的 PDF 里 */
  [data-pcv-annot] { display: none !important; }
</style>
</head>
<body><div class="pcv-print-root">${html}</div></body>
</html>`;
}

export async function POST(req: NextRequest) {
  let html = "";
  let fileName = "resume.pdf";
  try {
    const body = await req.json();
    html = typeof body?.html === "string" ? body.html : "";
    if (typeof body?.fileName === "string" && body.fileName.trim()) fileName = body.fileName.trim();
  } catch {
    return Response.json({ error: "请求体不是有效 JSON" }, { status: 400 });
  }
  if (!html) return Response.json({ error: "缺少简历内容（html）" }, { status: 400 });
  if (html.length > MAX_HTML) return Response.json({ error: "简历内容过大" }, { status: 413 });

  const executablePath = findChrome();
  if (!executablePath) {
    return Response.json(
      { error: "未找到本地 Chrome / Chromium。请安装 Chrome，或设置环境变量 CHROME_PATH 指向可执行文件后重启服务。" },
      { status: 501 }
    );
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
    });
    const page = await browser.newPage();
    // 内容随 setContent 立即写入；load 只是等字体样式表——离线/字体源不可达时超时照常出 PDF
    await page.setContent(buildDoc(html), { waitUntil: "load", timeout: 8_000 }).catch(() => {});
    // 等 Web 字体就绪，最多 4 秒（失败回落系统字体）
    await Promise.race([
      page.evaluate("document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true"),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume.pdf"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: "PDF 渲染失败：" + msg.slice(0, 300) }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
