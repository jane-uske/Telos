"use client";

import React from "react";

/**
 * RoleReady 品牌标识：深色圆角方块 + 白色 R + 紫蓝渐变上行箭头。
 * 扁平 SVG 版（原始 3D 位图的同构简化），任意尺寸清晰。
 */
export default function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={{ flexShrink: 0, display: "block" }} aria-hidden>
      <defs>
        <linearGradient id="rrArrow" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#3f6df6" />
          <stop offset="1" stopColor="#7c58f6" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="22" fill="#16181d" stroke="rgba(255,255,255,.09)" strokeWidth="1.5" />
      <path
        fill="#f5f4ef"
        fillRule="evenodd"
        d="M30 20h29c12 0 20 6.8 20 17 0 8.6-5.2 14.3-13.6 16l16 23H66.2L51.5 54.6h-8.9V76H30V20Zm12.6 11.4v12.3h15.2c5.3 0 8.5-2.3 8.5-6.2 0-3.9-3.2-6.1-8.5-6.1H42.6Z"
      />
      <path
        fill="url(#rrArrow)"
        d="M23.45 73.45 52.45 44.45 50.05 42.05 66.5 36.5 59.95 51.95 57.55 49.55 28.55 78.55Z"
      />
    </svg>
  );
}
