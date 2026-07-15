"use client";

import React from "react";
import type { SpeechInput } from "@/lib/speech";

/** 语音输入开关按钮：放在聊天输入框旁边 */
export function VoiceButton({ sp }: { sp: SpeechInput }) {
  if (!sp.supported) {
    return (
      <div
        title="当前浏览器不支持语音识别（Chrome / Edge / Safari 可用），请打字输入"
        style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 600, fontSize: 13.5, background: "#f2f3f5", color: "#b6bcc7", whiteSpace: "nowrap", cursor: "not-allowed" }}
      >
        🎙 语音
      </div>
    );
  }
  return (
    <div
      onClick={sp.toggle}
      title={sp.listening ? "停止录音（识别结果可修改后再发送）" : "语音回答：识别由浏览器的语音服务完成（需联网），说完可修改再发送"}
      style={{
        cursor: "pointer",
        padding: "10px 14px",
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 13.5,
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        background: sp.listening ? "#fff0f0" : "#fff",
        border: "1px solid " + (sp.listening ? "#d64545" : "#e3e5ec"),
        color: sp.listening ? "#d64545" : "#16181d",
      }}
    >
      {sp.listening ? (
        <>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "#d64545", animation: "pcvPulse 1s ease-in-out infinite" }} />
          停止
        </>
      ) : (
        "🎙 语音"
      )}
    </div>
  );
}

/** 录音状态行：正在听 + 实时识别预览 / 错误提示。放在输入行上方，仅在需要时出现 */
export function VoiceStatus({ sp }: { sp: SpeechInput }) {
  if (sp.error) {
    return <div style={{ fontSize: 12, color: "#d64545", padding: "0 2px 8px" }}>{sp.error}</div>;
  }
  if (!sp.listening) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#8a919e", padding: "0 2px 8px" }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: "#d64545", animation: "pcvPulse 1s ease-in-out infinite", flexShrink: 0 }} />
      <span style={{ flexShrink: 0 }}>正在听（浏览器语音识别）…</span>
      {sp.interim ? <span style={{ color: "#4b5060", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sp.interim}</span> : null}
    </div>
  );
}
