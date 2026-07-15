"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Page, Btn } from "../ui";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ cursor: "pointer", width: 42, height: 24, borderRadius: 99, background: on ? "#5850ec" : "#d5d8e3", position: "relative", transition: ".2s" }}>
      <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: 99, background: "#fff", transition: ".2s" }} />
    </div>
  );
}

export default function Settings() {
  const publicProfileOn = useStore((s) => s.publicProfileOn);
  const publicResumeOn = useStore((s) => s.publicResumeOn);
  const showToast = useStore((s) => s.showToast);
  const setScreen = useStore((s) => s.setScreen);

  const row = (label: string, val: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #f2f2f6", fontSize: 13.5 }}>
      <span style={{ color: "#8a919e" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{val}</span>
    </div>
  );

  return (
    <Page title="账号与隐私" sub="控制你的职业档案与简历里哪些内容对外公开。你的证据只属于你。">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 840 }}>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>账号信息</div>
          {row("姓名", "林深")}
          {row("邮箱", "lin.shen@demo.dev")}
          {row("求职方向", "大厂 高级前端 / 全栈")}
          {row("账号类型", "演示账号")}
          <div style={{ marginTop: 16 }}>
            <Btn label="编辑档案" kind="ghost" onClick={() => showToast("演示账号不可编辑")} />
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>公开与隐私</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>公开职业主页</div>
              <div style={{ fontSize: 11.5, color: "#8a919e" }}>展示档案与精选证据</div>
            </div>
            <Toggle on={publicProfileOn} onClick={() => useStore.setState({ publicProfileOn: !publicProfileOn })} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #f2f2f6" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>公开简历分享</div>
              <div style={{ fontSize: 11.5, color: "#8a919e" }}>生成岗位定制简历的分享链接</div>
            </div>
            <Toggle on={publicResumeOn} onClick={() => useStore.setState({ publicResumeOn: !publicResumeOn })} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#a3a8b5", margin: "14px 0 6px" }}>公开哪些内容</div>
          {["基础信息与求职方向", "技能标签", "已确认的职业证据", "联系方式"].map((x, i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" defaultChecked={i < 3} style={{ accentColor: "#5850ec", width: 15, height: 15 }} />
              {x}
            </label>
          ))}
          <div style={{ marginTop: 14 }}>
            <Btn label="查看公开主页 ↗" kind="soft" onClick={() => setScreen("publicProfile")} />
          </div>
        </div>
      </div>
    </Page>
  );
}
