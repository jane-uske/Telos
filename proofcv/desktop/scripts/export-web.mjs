// 桌面壳的 Web 构建：把 ../web 静态导出到 ./web-out。
// API 路由是 force-dynamic，export 模式编不过——构建期间挪走，结束后无论成败都还原。
// ⚠️ 构建期间别开着 web 的 next dev（api 目录会短暂消失）。

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDir = path.resolve(desktopDir, "..", "web");
const apiDir = path.join(webDir, "src", "app", "api");
const apiTmp = path.join(webDir, ".desktop-api-hold");
// export 模式下 distDir 就是导出目录（见 web/next.config.ts 的 .next-desktop）
const outDir = path.join(webDir, ".next-desktop");
const destDir = path.join(desktopDir, "web-out");

// 上次构建如果中途被杀，先把 api 目录还原回去
if (fs.existsSync(apiTmp) && !fs.existsSync(apiDir)) fs.renameSync(apiTmp, apiDir);

fs.renameSync(apiDir, apiTmp);
let code = 1;
try {
  const r = spawnSync("npx", ["next", "build"], {
    cwd: webDir,
    stdio: "inherit",
    env: {
      ...process.env,
      TELOS_DESKTOP: "1",
      // 托管后端改走桌面壳的同源代理（见 desktop/main.js 的 /rr-api）
      NEXT_PUBLIC_RR_API_BASE: "app://telos/rr-api",
    },
  });
  code = r.status ?? 1;
} finally {
  fs.renameSync(apiTmp, apiDir);
}
if (code !== 0) process.exit(code);

fs.rmSync(destDir, { recursive: true, force: true });
fs.cpSync(outDir, destDir, { recursive: true });
console.log("✓ 静态导出完成 → " + destDir);
