"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { consumeTokenFromUrl, fetchMe, useAuth } from "@/lib/apiClient";
import Home from "@/components/Home";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import { AiGateDialog, LoginModal } from "@/components/AuthGate";

export default function Page() {
  const screen = useStore((s) => s.screen);

  // 本机 IndexedDB 数据在挂载后恢复（store 配了 skipHydration，避免与 React 注水竞争）。
  // GitHub 登录回跳会带 #rr_token= —— 恢复完成后自动续跑登录前被拦下的 AI 操作。
  useEffect(() => {
    const tokenArrived = consumeTokenFromUrl();
    Promise.resolve(useStore.persist.rehydrate()).then(() => {
      if (tokenArrived) {
        useStore.getState().loginSucceeded();
      } else if (useAuth.getState().token) {
        fetchMe(); // 静默刷新用户与额度；401 时会自动清会话并提示
      }
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {screen === "home" ? <Home /> : <AppShell />}
      <Toast />
      <AiGateDialog />
      <LoginModal />
    </div>
  );
}
