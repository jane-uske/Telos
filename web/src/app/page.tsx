"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import Home from "@/components/Home";
import Auth from "@/components/Auth";
import AppShell from "@/components/AppShell";
import Toast from "@/components/Toast";

export default function Page() {
  const screen = useStore((s) => s.screen);

  // 本机 IndexedDB 数据在挂载后恢复（store 配了 skipHydration，避免与 React 注水竞争）
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {screen === "home" && <Home />}
      {screen === "auth" && <Auth />}
      {screen === "app" && <AppShell />}
      <Toast />
    </div>
  );
}
