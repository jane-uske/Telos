"use client";

import { useStore } from "@/lib/store";
import Home from "@/components/Home";
import Auth from "@/components/Auth";
import AppShell from "@/components/AppShell";
import PublicProfile from "@/components/PublicProfile";
import PublicResume from "@/components/PublicResume";
import Toast from "@/components/Toast";

export default function Page() {
  const screen = useStore((s) => s.screen);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {screen === "home" && <Home />}
      {screen === "auth" && <Auth />}
      {screen === "app" && <AppShell />}
      {screen === "publicProfile" && <PublicProfile />}
      {screen === "publicResume" && <PublicResume />}
      <Toast />
    </div>
  );
}
