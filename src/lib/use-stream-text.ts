"use client";

import { useState } from "react";

/** 消费纯文本流(toTextStreamResponse)的轻量 hook */
export function useStreamText() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(url: string, body: unknown) {
    setLoading(true);
    setError(null);
    setText("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `请求失败 (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((t) => t + decoder.decode(value));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "出错了");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setText("");
    setError(null);
    setLoading(false);
  }

  return { text, loading, error, run, reset };
}
