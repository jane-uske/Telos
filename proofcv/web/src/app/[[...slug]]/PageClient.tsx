"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { consumeTokenFromUrl, fetchMe, useAuth } from "@/lib/apiClient";
import { installRouter } from "@/lib/routing";
import Home from "@/components/Home";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";
import { AiGateDialog, LoginModal } from "@/components/AuthGate";

// 所有页面路径（/、/evidence、/jobs、/pkg…）都由这个 optional catch-all 渲染同一个单页；
// 具体展示哪一页由 store 的 screen/tab 决定，URL 与状态的双向同步见 installRouter。
export default function PageClient() {
  const screen = useStore((s) => s.screen);

  // 本机 IndexedDB 数据在挂载后恢复（store 配了 skipHydration，避免与 React 注水竞争）。
  // GitHub 登录回跳会带 #rr_token= —— 恢复完成后自动续跑登录前被拦下的 AI 操作。
  useEffect(() => {
    const tokenArrived = consumeTokenFromUrl();
    let cleanup = () => {};
    Promise.resolve(useStore.persist.rehydrate()).then(() => {
      if (tokenArrived) {
        useStore.getState().loginSucceeded();
      } else if (useAuth.getState().token) {
        fetchMe(); // 静默刷新用户与额度；401 时会自动清会话并提示
      }
      // rehydrate 之后再挂路由：首屏对齐才能用上恢复后的持久化位置
      cleanup = installRouter();
    });
    return () => cleanup();
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
