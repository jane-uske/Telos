"use client";

import React from "react";
import { useStore } from "@/lib/store";

export default function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 26,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#16181d",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 11,
        fontSize: 14,
        boxShadow: "0 12px 30px rgba(0,0,0,.25)",
        zIndex: 100,
        animation: "pcvFade .25s ease both",
      }}
    >
      {toast}
    </div>
  );
}
