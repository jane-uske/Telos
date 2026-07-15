"use client";

// AI 接入配置：用户自己的 API URL + Key，全部存在用户本机浏览器（localStorage），
// 平台不托管。填好 URL + Key 即自动切换到真实 AI，否则保持 mock 演示模式。
// 与主数据分开存：配置很小、需要同步读取（模块加载即可用），localStorage 足够。

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AiProtocol = "anthropic" | "openai";

export interface AiConfigState {
  /** anthropic = Anthropic 原生协议；openai = OpenAI 兼容协议（各类中转站基本都是它） */
  protocol: AiProtocol;
  url: string;
  key: string;
  model: string;
  /** true = Key 明文存本机 localStorage；false = 仅本次使用（刷新即忘） */
  remember: boolean;
  /** 最近一次调用失败的原因（成功后清空），设置页展示用 */
  lastError: string | null;
  patchAi: (p: Partial<Pick<AiConfigState, "protocol" | "url" | "key" | "model" | "remember">>) => void;
}

export const DEFAULT_MODEL: Record<AiProtocol, string> = {
  anthropic: "claude-sonnet-5",
  openai: "",
};

export const useAiConfig = create<AiConfigState>()(
  persist(
    (set) => ({
      protocol: "anthropic",
      url: "https://api.anthropic.com",
      key: "",
      model: DEFAULT_MODEL.anthropic,
      remember: true,
      lastError: null,
      patchAi: (p) => set(p),
    }),
    {
      name: "proofcv-ai",
      version: 1,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") throw new Error("ssr");
        return localStorage;
      }),
      // remember=false 时 Key 不落盘（刷新即忘）；lastError 是运行时状态，不持久化
      partialize: (s) => ({
        protocol: s.protocol,
        url: s.url,
        key: s.remember ? s.key : "",
        model: s.model,
        remember: s.remember,
      }),
    }
  )
);

/** 是否已配置真实 AI（URL + Key 都填了） */
export function aiConfigured(s?: Pick<AiConfigState, "url" | "key">): boolean {
  const c = s || useAiConfig.getState();
  return !!(c.url.trim() && c.key.trim());
}
