"use client";

import React from "react";

/**
 * Telos 品牌标识：深色圆角方块 + 白色 T（右端斜切）+ 靛紫竖笔。
 * 扁平 SVG 版（原始 3D 位图的同构简化），任意尺寸清晰。
 */
export default function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={{ flexShrink: 0, display: "block" }} aria-hidden>
      <rect width="96" height="96" rx="22" fill="#16181d" stroke="rgba(255,255,255,.09)" strokeWidth="1.5" />
      <path fill="#f5f4ef" d="M25 23h48L64.5 34.5H51.5V73h-10V34.5H25Z" />
      <path fill="#6353f0" d="M55.5 42.5 65.5 36.5v31q0 5.5-5 5.5t-5-5.5Z" />
    </svg>
  );
}
