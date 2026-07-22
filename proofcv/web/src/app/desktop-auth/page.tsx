"use client";

// 桌面版 GitHub 登录的回跳中转页。
// 网关的回跳白名单只认 https 源，进不了桌面 App 的 app:// 世界——
// 于是浏览器先落到这里，再把 #rr_token= 原样弹给 telos:// 自定义协议唤起桌面版。
// 本页不消费 token、不写任何本地存储，浏览器端零痕迹。

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";

const DEEP_LINK_PREFIX = "telos://auth#rr_token=";

// hash 是 React 之外的外部状态：预渲染时给空串，客户端接管后读真值
const emptySubscribe = () => () => {};
const useHash = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => window.location.hash,
    () => ""
  );

export default function DesktopAuth() {
  const hash = useHash();
  const token = (hash.match(/rr_token=([A-Za-z0-9._~-]+)/) || [])[1] || "";

  useEffect(() => {
    if (token) window.location.replace(DEEP_LINK_PREFIX + token);
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbfbfd", padding: 24 }}>
      <div style={{ maxWidth: 460, background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: "32px 34px", textAlign: "center" }}>
        {token ? (
          <>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>正在打开 Telos 桌面版…</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8, marginBottom: 18 }}>
              浏览器可能会询问是否允许打开「Telos」，请点允许。
              没有反应的话，确认桌面版已安装并至少启动过一次，然后：
            </div>
            <div
              onClick={() => window.location.replace(DEEP_LINK_PREFIX + token)}
              style={{ cursor: "pointer", display: "inline-block", background: "#16181d", color: "#fff", borderRadius: 11, padding: "11px 22px", fontWeight: 700, fontSize: 14 }}
            >
              再试一次打开桌面版
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>这是桌面版登录的中转页</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8 }}>
              地址里没有携带登录凭证——请从 Telos 桌面版里点「用 GitHub 登录」进入这里。
            </div>
          </>
        )}
        <div style={{ marginTop: 20, fontSize: 12.5 }}>
          <Link href="/" style={{ color: "#5850ec", fontWeight: 600 }}>回到网页版 →</Link>
        </div>
      </div>
    </div>
  );
}
