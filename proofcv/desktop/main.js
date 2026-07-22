// Telos 桌面壳 —— 主进程。
// 设计原则：渲染层零改动。Web 应用静态导出后由 app://telos 协议伺服，
// 原来的三个 Next API 路由在这里原生实现：
//   /api/ai          → 主进程 net.fetch 透传（见 api/ai.js，与 web 路由同构）
//   /api/export/pdf  → Electron 自带 printToPDF，不再依赖本地 Chrome（api/pdf.js）
//   /api/health      → 直接应答
// 托管后端 api.remi.run 走 /rr-api 同源代理（构建时 NEXT_PUBLIC_RR_API_BASE 指过来），
// 主进程转发即无 CORS；SSE 流原样透传。

const { app, BrowserWindow, protocol, net, shell } = require("electron");
const path = require("node:path");
const os = require("node:os");
const { serveStatic } = require("./lib/static");
const { handleAi } = require("./api/ai");
const { handlePdf, servePrintDoc } = require("./api/pdf");

const APP_SCHEME = "app";
const APP_HOST = "telos";
const ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
const RR_UPSTREAM = "https://api.remi.run";
// 网关 GitHub OAuth 只认白名单里的 Web 源——桌面版把回跳指到白名单源，再把 token 接回来。
// 打包版：系统浏览器完成 OAuth（复用浏览器里已登录的 GitHub 会话），回跳到 Web 版的
// /desktop-auth 中转页，由它弹 telos:// 深链唤起本 App（scheme 在 electron-builder
// protocols 里注册，仅打包后生效）。开发壳：保留应用内弹窗 + 导航层截 token。
const WEB_ORIGINS = ["https://telos.remi.run", "https://roleready.remi.run"];
const REDIRECT_TARGET = "https://roleready.remi.run";
const DESKTOP_AUTH_URL = "https://telos.remi.run/desktop-auth";
const DEEP_LINK_SCHEME = "telos";
const GH_START = RR_UPSTREAM + "/roleready/v1/auth/github/start";

const SMOKE = process.argv.includes("--smoke");
// 冒烟走独立临时 profile：会注入假登录态，不能弄脏真实用户数据。
// 每次先清空——上一轮持久化的页面位置/假 token 会让流程检查不可复现。
if (SMOKE) {
  const smokeDir = path.join(os.tmpdir(), "telos-desktop-smoke");
  try {
    require("node:fs").rmSync(smokeDir, { recursive: true, force: true });
  } catch {}
  app.setPath("userData", smokeDir);
}

// standard+secure 才有 localStorage / IndexedDB（本应用的数据全在里面）
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

async function route(request) {
  const url = new URL(request.url);
  if (url.host !== APP_HOST) return new Response("not found", { status: 404 });
  const p = url.pathname;

  if (p === "/api/health") return Response.json({ ok: true, desktop: true, version: app.getVersion() });
  if (p === "/api/ai" && request.method === "POST") return handleAi(request);
  if (p === "/api/export/pdf" && request.method === "POST") return handlePdf(request, ORIGIN);
  if (p.startsWith("/__print/")) return servePrintDoc(p.slice("/__print/".length));

  if (p.startsWith("/rr-api/")) {
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("origin");
    headers.delete("referer");
    const init = { method: request.method, headers };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
      init.duplex = "half";
    }
    try {
      return await net.fetch(RR_UPSTREAM + p.slice("/rr-api".length) + url.search, init);
    } catch {
      // 错误体形状与网关契约一致，apiClient 能读出 message
      return Response.json({ error: { message: "无法连接 " + RR_UPSTREAM } }, { status: 502 });
    }
  }

  return serveStatic(p);
}

// GitHub 登录入口：打包版跳系统浏览器（telos:// 深链回程）；开发壳走应用内弹窗。
function startGithubLogin(parentWin, startUrl) {
  if (app.isPackaged) {
    const u = new URL(startUrl);
    u.searchParams.set("redirect", DESKTOP_AUTH_URL);
    shell.openExternal(u.toString());
    return;
  }
  openGithubLogin(parentWin, startUrl);
}

// telos:// 深链：/desktop-auth 中转页弹回来的 #rr_token=
let pendingDeepLinkToken = null;
function handleDeepLink(url) {
  const m = String(url || "").match(/rr_token=([A-Za-z0-9._~-]+)/);
  if (!m) return;
  const win = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
  if (win) {
    deliverToken(win, m[1]);
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  } else {
    pendingDeepLinkToken = m[1]; // 冷启动：等窗口加载完再注入
  }
}
app.on("open-url", (e, url) => {
  e.preventDefault();
  handleDeepLink(url);
});

// GitHub OAuth（开发壳）：受控弹窗里走完网关→GitHub→回跳，全程不离开桌面壳。
// 回跳目标改写成 Web 源（网关白名单内），token 在导航层截获——Web 版页面根本不会加载。
function openGithubLogin(parentWin, startUrl) {
  const u = new URL(startUrl);
  u.searchParams.set("redirect", REDIRECT_TARGET + "/");
  const popup = new BrowserWindow({
    width: 980,
    height: 720,
    parent: parentWin,
    title: "GitHub 登录",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  const capture = (e, url) => {
    if (!url || !WEB_ORIGINS.some((o) => url.startsWith(o))) return;
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const m = url.match(/rr_token=([A-Za-z0-9._~-]+)/);
    if (m) deliverToken(parentWin, m[1]);
    popup.destroy();
  };
  popup.webContents.on("will-redirect", capture);
  popup.webContents.on("will-navigate", capture);
  // 兜底：个别流程用 JS 跳转，事件截不到时看落地 URL（此时 token 仍在 hash 里，可取）
  popup.webContents.on("did-navigate", () => capture(null, popup.webContents.getURL()));
  popup.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  popup.loadURL(u.toString());
}

// 与 Web 流程完全同构：带 #rr_token= 重载，PageClient 挂载时消费并续跑登录前被拦下的操作
function deliverToken(win, token) {
  win.webContents
    .executeJavaScript(`location.hash = ${JSON.stringify("rr_token=" + token)}; location.reload();`)
    .catch(() => {});
  win.focus();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    backgroundColor: "#ffffff",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.once("ready-to-show", () => win.show());
  // GitHub 登录走专属入口；其余外链一律交给系统浏览器，窗口内只留本应用源
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(GH_START)) startGithubLogin(win, url);
    else if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (url.startsWith(ORIGIN)) return;
    e.preventDefault();
    if (url.startsWith(GH_START)) startGithubLogin(win, url);
    else if (/^https?:/i.test(url)) shell.openExternal(url);
  });
  // 冷启动时深链先于窗口到达——首屏加载完再注入
  win.webContents.once("did-finish-load", () => {
    if (pendingDeepLinkToken) {
      const t = pendingDeepLinkToken;
      pendingDeepLinkToken = null;
      deliverToken(win, t);
    }
  });
  win.loadURL(ORIGIN + "/");
  return win;
}

// --smoke：无头验收——健康检查 / localStorage / PDF 导出全链路，出 %PDF 才算过
async function runSmoke() {
  const killer = setTimeout(() => {
    console.error("[smoke] 超时（60s）");
    app.exit(2);
  }, 60_000);
  try {
    const win = new BrowserWindow({
      show: false,
      width: 1280,
      height: 900,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
    });
    await win.loadURL(ORIGIN + "/");
    const pdfBody = JSON.stringify({
      html: '<div style="font-size:14px">冒烟测试 Smoke OK — 中文字形检查</div>',
      fileName: "smoke.pdf",
    });
    const results = await win.webContents.executeJavaScript(`(async () => {
      const out = { title: document.title };
      // App Router 客户端就绪即挂 window.next —— 静态 HTML 渲染 ≠ React 活了，这一项才算
      await new Promise((r) => setTimeout(r, 1500));
      out.hydrated = !!(window.next && window.next.version);
      out.health = await fetch("/api/health").then((r) => r.json()).catch((e) => ({ error: String(e) }));
      // 子路由回落到静态导出的对应页（/evidence → evidence.html）
      out.subRoute = await fetch("/evidence").then((r) => r.ok).catch(() => false);
      // 桌面登录依赖的浏览器中转页必须在导出产物里
      out.desktopAuth = await fetch("/desktop-auth").then((r) => r.ok).catch(() => false);
      // 托管后端同源代理连通性（无网/网关挂了不算冒烟失败，只记录）
      out.rrApi = await fetch("/rr-api/roleready/v1/me").then((r) => r.status).catch((e) => String(e));
      try {
        localStorage.setItem("__smoke", "1");
        out.localStorage = localStorage.getItem("__smoke") === "1";
        localStorage.removeItem("__smoke");
      } catch { out.localStorage = false; }
      out.indexedDB = typeof indexedDB !== "undefined";
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: ${JSON.stringify(pdfBody)},
      });
      out.pdfStatus = res.status;
      const buf = new Uint8Array(await res.arrayBuffer());
      out.pdfBytes = buf.length;
      out.pdfMagic = String.fromCharCode(...buf.slice(0, 5));
      return out;
    })()`);
    console.log("[smoke]", JSON.stringify(results, null, 2));

    // —— UI 流程：演示数据 → 经历编辑器 → 智能生成按钮 → 无 AI 配置时应弹门控 ——
    // 必须先于 OAuth 注入：假 token 会让 fetchMe 401 异步弹出「登录已过期」，盖住页面。
    // JS 合成 click 对 React 合成事件不可靠，用 sendInputEvent 发真实受信鼠标输入。
    const exec = (js) => win.webContents.executeJavaScript(js);
    const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
    const FINDER = `((txt) => [...document.querySelectorAll("span,div,button,a")]
      .find((el) => el.childElementCount === 0 && (el.textContent || "").trim().includes(txt)))`;
    const realClick = async (specJs) => {
      const pt = await exec(`(() => {
        const el = ${specJs};
        if (!el) return null;
        el.scrollIntoView({ block: "center" });
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
      })()`);
      if (!pt) return false;
      // 预判命中：如果坐标点被别的元素盖住，日志里能直接看到罪魁
      const hit = await exec(
        `(document.elementFromPoint(${pt.x}, ${pt.y}) || {}).outerHTML?.slice(0, 100) || "(none)"`
      );
      if (process.env.SMOKE_DEBUG) console.log("[smoke] click", pt, hit);
      win.webContents.sendInputEvent({ type: "mouseDown", x: pt.x, y: pt.y, button: "left", clickCount: 1 });
      win.webContents.sendInputEvent({ type: "mouseUp", x: pt.x, y: pt.y, button: "left", clickCount: 1 });
      return true;
    };
    const ui = { demo: false, demoOn: false, evidencePage: false, editor: false, genBtn: false, gate: false };
    await exec(`window.confirm = () => true; true`); // 演示覆盖确认框自动通过
    ui.demo = await realClick(`${FINDER}("查看演示")`);
    await sleepMs(800);
    ui.demoOn = await exec(`!!${FINDER}("退出演示")`);
    await exec(`history.pushState(null, "", "/evidence"); window.dispatchEvent(new PopStateEvent("popstate")); true`);
    await sleepMs(500);
    ui.evidencePage = (await exec(`document.querySelectorAll('[title="编辑经历卡"]').length`)) > 0;
    await realClick(`document.querySelector('[title="编辑经历卡"]')`);
    await sleepMs(400);
    ui.editor = await exec(`!!document.querySelector("textarea")`);
    ui.genBtn = await realClick(`${FINDER}("智能生成")`);
    await sleepMs(600);
    ui.gate = await exec(`!!${FINDER}("用基础模式继续")`);
    console.log("[smoke] ui-flow", JSON.stringify(ui));

    // —— OAuth 令牌注入链路：模拟网关回跳（不走真 GitHub），放最后因为会整页重载 ——
    // consumeTokenFromUrl 只在解析出 token 时才 replaceState 清 hash，
    // 所以「hash 被清干净」即证明注入→挂载→消费整条链路走通。
    // tokenSeen 只作参考：假 token 会被 fetchMe 的 401 异步清掉，有竞态，不做门槛。
    const loaded = new Promise((resolve) => win.webContents.once("did-finish-load", resolve));
    deliverToken(win, "SMOKETOKEN");
    await loaded;
    const auth = await win.webContents.executeJavaScript(`(async () => {
      const out = { hashClean: false, tokenSeen: false };
      for (let i = 0; i < 30; i++) {
        if (!location.hash.includes("rr_token")) out.hashClean = true;
        try {
          const raw = localStorage.getItem("proofcv-auth");
          if (raw && (JSON.parse(raw).state || {}).token === "SMOKETOKEN") out.tokenSeen = true;
        } catch {}
        if (out.hashClean && out.tokenSeen) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      return out;
    })()`);
    console.log("[smoke] oauth-inject", JSON.stringify(auth));

    const ok =
      results &&
      /Telos/.test(results.title || "") &&
      results.hydrated === true &&
      results.subRoute === true &&
      results.desktopAuth === true &&
      results.health && results.health.ok === true && results.health.desktop === true &&
      results.localStorage === true &&
      results.indexedDB === true &&
      results.pdfStatus === 200 &&
      results.pdfMagic === "%PDF-" &&
      results.pdfBytes > 1000 &&
      auth.hashClean === true &&
      ui.demoOn && ui.evidencePage && ui.editor && ui.genBtn && ui.gate;
    console.log(ok ? "[smoke] ✓ 全部通过" : "[smoke] ✗ 有检查项失败");
    clearTimeout(killer);
    app.exit(ok ? 0 : 1);
  } catch (e) {
    console.error("[smoke] 失败:", e);
    clearTimeout(killer);
    app.exit(1);
  }
}

app.whenReady().then(() => {
  app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME);
  protocol.handle(APP_SCHEME, (req) =>
    route(req).catch((e) =>
      Response.json({ error: String((e && e.message) || e) }, { status: 500 })
    )
  );
  if (SMOKE) {
    runSmoke();
    return;
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" || SMOKE) app.quit();
});
