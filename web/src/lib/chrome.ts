// 服务端专用：定位本地 Chrome / Chromium 可执行文件，供 PDF 导出（puppeteer-core）使用。
// 不自动下载浏览器——用户跑 boss-zhipin-scraper 本来就需要本地 Chrome，直接复用。
// 优先级：环境变量 > 系统安装 > Playwright / Puppeteer 缓存。

import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

function scanCache(root: string, sub: string[]): string[] {
  try {
    return readdirSync(root)
      .filter((d) => d.startsWith("chromium") || d.startsWith("chrome"))
      .sort()
      .reverse()
      .map((d) => join(root, d, ...sub));
  } catch {
    return [];
  }
}

export function findChrome(): string | null {
  const home = homedir();
  const candidates: string[] = [];

  for (const env of [process.env.PROOFCV_CHROME, process.env.CHROME_PATH, process.env.PUPPETEER_EXECUTABLE_PATH]) {
    if (env) candidates.push(env);
  }

  if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      join(home, "Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    );
  } else if (process.platform === "win32") {
    for (const base of [process.env["PROGRAMFILES"], process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA]) {
      if (!base) continue;
      candidates.push(join(base, "Google/Chrome/Application/chrome.exe"), join(base, "Microsoft/Edge/Application/msedge.exe"));
    }
  } else {
    candidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium",
      "/usr/bin/microsoft-edge"
    );
  }

  // Playwright 缓存（含本仓库 CI/沙箱环境的 /opt/pw-browsers）
  const pwRoots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers", join(home, ".cache/ms-playwright")].filter(Boolean) as string[];
  const pwSub =
    process.platform === "darwin"
      ? ["chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"]
      : process.platform === "win32"
        ? ["chrome-win", "chrome.exe"]
        : ["chrome-linux", "chrome"];
  for (const root of pwRoots) candidates.push(...scanCache(root, pwSub));

  // Puppeteer 缓存
  const ppSub =
    process.platform === "darwin"
      ? ["chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing"]
      : process.platform === "win32"
        ? ["chrome-win64", "chrome.exe"]
        : ["chrome-linux64", "chrome"];
  try {
    const ppRoot = join(home, ".cache/puppeteer/chrome");
    for (const v of readdirSync(ppRoot).sort().reverse()) candidates.push(join(ppRoot, v, ...ppSub));
  } catch {
    /* 没有 puppeteer 缓存 */
  }

  for (const c of candidates) {
    try {
      if (existsSync(c)) return c;
    } catch {
      /* 权限问题按不存在处理 */
    }
  }
  return null;
}
