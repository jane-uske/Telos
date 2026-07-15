"use client";

// 浏览器语音输入（Web Speech API）：模拟面试 / AI 访谈里边说边转文字，
// 免打字。零配置零成本，Chrome / Edge / Safari 可用；Firefox 不支持时
// 降级回打字输入。如实说明：识别由浏览器厂商的语音服务完成（Chrome 会把
// 音频发给 Google 语音服务处理），不是本地推理——界面与文档均已标注。
// 识别结果只进输入框，用户改完自己发送，不自动提交。

import { useEffect, useRef, useState } from "react";

// SpeechRecognition 仍是带前缀的实验 API，不在 lib.dom 里，这里声明最小类型
interface SRAlternative {
  transcript: string;
}
interface SRResult {
  isFinal: boolean;
  0: SRAlternative;
}
interface SRResultList {
  length: number;
  [i: number]: SRResult;
}
interface SREvent {
  resultIndex: number;
  results: SRResultList;
}
interface SRErrorEvent {
  error: string;
}
interface SpeechRec {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SRCtor = new () => SpeechRec;

function getCtor(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface SpeechInput {
  /** 当前浏览器是否支持语音识别 */
  supported: boolean;
  listening: boolean;
  /** 实时的未定稿识别文本（说话过程中持续变化） */
  interim: string;
  error: string | null;
  toggle: () => void;
  stop: () => void;
}

/** onFinal 在每段话定稿时回调（通常是一次停顿一段），由调用方追加进输入框 */
export function useSpeechInput(onFinal: (text: string) => void): SpeechInput {
  // 这些聊天屏只在客户端交互后挂载，惰性初始化不会造成注水不一致
  const [supported] = useState(() => !!getCtor());
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  // 用户是否想保持录音（Chrome 会在停顿后自动结束会话，需要区分“用户停止”和“超时结束”）
  const wantRef = useRef(false);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  useEffect(() => {
    return () => {
      wantRef.current = false;
      try {
        recRef.current?.abort();
      } catch {}
    };
  }, []);

  const start = () => {
    const Ctor = getCtor();
    if (!Ctor || wantRef.current) return;
    setError(null);
    const rec = new Ctor();
    rec.lang = "zh-CN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript || "";
        if (r.isFinal) {
          if (t.trim()) onFinalRef.current(t.trim());
        } else {
          live += t;
        }
      }
      setInterim(live);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantRef.current = false;
        setListening(false);
        setError("麦克风权限被拒绝——请在浏览器地址栏允许麦克风后重试");
      } else if (e.error === "network") {
        wantRef.current = false;
        setListening(false);
        setError("语音服务不可达（浏览器的识别服务需要联网）· 可先打字输入");
      }
      // no-speech / aborted 等交给 onend 的自动续录处理
    };
    rec.onend = () => {
      setInterim("");
      if (wantRef.current) {
        // 停顿导致的自动结束：无缝续上，直到用户主动停止
        try {
          rec.start();
        } catch {
          wantRef.current = false;
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };
    recRef.current = rec;
    wantRef.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {
      wantRef.current = false;
      setError("语音识别启动失败，请改用打字输入");
    }
  };

  const stop = () => {
    wantRef.current = false;
    setInterim("");
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  };

  return { supported, listening, interim, error, toggle: () => (listening ? stop() : start()), stop };
}
