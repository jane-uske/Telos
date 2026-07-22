// app://telos 的静态文件伺服：根是 web-out/（构建脚本从 ../web/out 拷来；
// 打包后随 files 进 asar，fs 对 asar 内路径透明可读）。

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "web-out");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

async function tryFile(rel) {
  const abs = path.join(ROOT, rel);
  // 防目录穿越：解析后必须还在 ROOT 里
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) return null;
  try {
    const st = await fs.stat(abs);
    if (!st.isFile()) return null;
    const buf = await fs.readFile(abs);
    const type = MIME[path.extname(abs).toLowerCase()] || "application/octet-stream";
    return new Response(buf, { headers: { "Content-Type": type } });
  } catch {
    return null;
  }
}

// 导出产物是 trailingSlash:false 布局（/evidence → evidence.html）；
// 未知路径回落 index.html，路径→页面的解析交给应用自己的 installRouter（SPA）
async function serveStatic(pathname) {
  const p = decodeURIComponent(pathname).replace(/\/+$/, "") || "/";
  const rel = p === "/" ? "index.html" : p.replace(/^\//, "");
  return (
    (await tryFile(rel)) ||
    (p !== "/" ? await tryFile(rel + ".html") : null) ||
    (p !== "/" ? await tryFile(path.join(rel, "index.html")) : null) ||
    (await tryFile("index.html")) ||
    new Response("not found", { status: 404 })
  );
}

module.exports = { serveStatic };
