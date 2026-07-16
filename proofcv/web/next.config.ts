import type { NextConfig } from "next";

// 基础安全响应头。语音输入需要麦克风权限（self），其余能力一律关闭。
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
];

const nextConfig: NextConfig = {
  // monorepo 里固定 Turbopack 编译根为本应用目录，防止把仓库根（Telos 简历生成器本体）卷进编译
  turbopack: { root: import.meta.dirname },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // API 响应一律不缓存（透传 AI / 健康检查 / 导出）
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
