import type { NextConfig } from "next";

// 基础安全响应头。语音输入需要麦克风权限（self），其余能力一律关闭。
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
];

// 桌面壳（Electron）构建：纯静态导出，API 路由由主进程原生实现（见 ../desktop）。
// headers() 在 export 模式下不支持，桌面版无对外服务面，不需要它。
const desktop = process.env.TELOS_DESKTOP === "1";

const nextConfig: NextConfig = {
  // monorepo 里固定 Turbopack 编译根为本应用目录，防止把仓库根（Telos 简历生成器本体）卷进编译
  turbopack: { root: import.meta.dirname },
  ...(desktop
    ? {
        output: "export" as const,
        // 与 Web 开发的 .next 互不踩缓存
        distDir: ".next-desktop",
      }
    : {
        async headers() {
          return [
            { source: "/(.*)", headers: securityHeaders },
            // API 响应一律不缓存（透传 AI / 健康检查 / 导出）
            { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
          ];
        },
      }),
};

export default nextConfig;
