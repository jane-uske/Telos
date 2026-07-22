// 简历 PDF 导出 —— proofcv/web/src/app/api/export/pdf/route.ts 的主进程移植。
// 区别：不再用 puppeteer 找本地 Chrome，Electron 自己就是 Chromium——
// 隐藏窗口加载纸面 DOM，webContents.printToPDF 直接出 A4。
// 纸面文档经 app://telos/__print/<id> 一次性伺服（绕开 data: URL 的体积限制）。

const { BrowserWindow } = require("electron");
const crypto = require("node:crypto");

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=Noto+Serif+SC:wght@600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap";

const MAX_HTML = 2_000_000;

// id → 待打印文档；handlePdf 放入，servePrintDoc 取用，finally 清理
const docs = new Map();

function buildDoc(html) {
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
    /* 桌面版可能离线：Noto 拉不到时回落 PingFang，中文照常成字 */
    font-family: 'Noto Sans SC', 'PingFang SC', system-ui, sans-serif;
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
  /* 内部准备标注（已核验/待确认/细节不足/★钩子）绝不出现在给企业的 PDF 里 */
  [data-pcv-annot] { display: none !important; }
</style>
</head>
<body><div class="pcv-print-root">${html}</div></body>
</html>`;
}

function servePrintDoc(id) {
  const doc = docs.get(id);
  if (!doc) return new Response("gone", { status: 410 });
  return new Response(doc, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handlePdf(request, origin) {
  let html = "";
  let fileName = "resume.pdf";
  try {
    const body = await request.json();
    html = typeof body?.html === "string" ? body.html : "";
    if (typeof body?.fileName === "string" && body.fileName.trim()) fileName = body.fileName.trim();
  } catch {
    return Response.json({ error: "请求体不是有效 JSON" }, { status: 400 });
  }
  if (!html) return Response.json({ error: "缺少简历内容（html）" }, { status: 400 });
  if (html.length > MAX_HTML) return Response.json({ error: "简历内容过大" }, { status: 413 });

  const id = crypto.randomUUID();
  docs.set(id, buildDoc(html));
  const win = new BrowserWindow({
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  try {
    // 离线/字体源不可达时子资源可能拖住 load——最多等 10 秒，照常出 PDF
    await Promise.race([
      win.loadURL(`${origin}/__print/${id}`),
      new Promise((r) => setTimeout(r, 10_000)),
    ]);
    // 等 Web 字体就绪，最多 4 秒（失败回落系统字体）
    await win.webContents
      .executeJavaScript(
        "document.fonts ? Promise.race([document.fonts.ready.then(() => true), new Promise(r => setTimeout(() => r(false), 4000))]) : true",
        true
      )
      .catch(() => {});
    const pdf = await win.webContents.printToPDF({
      pageSize: "A4",
      printBackground: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });
    return new Response(pdf, {
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
    docs.delete(id);
    if (!win.isDestroyed()) win.destroy();
  }
}

module.exports = { handlePdf, servePrintDoc };
