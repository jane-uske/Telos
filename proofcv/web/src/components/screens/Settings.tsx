"use client";

import React, { useEffect, useRef, useState } from "react";
import { useStore, snapshot } from "@/lib/store";
import type { PersistedState } from "@/lib/store";
import { useAiConfig, aiConfigured, DEFAULT_MODEL, type AiProtocol } from "@/lib/aiConfig";
import { useAuth, serverLogout, deleteAccount, fetchMyUsage, API_BASE } from "@/lib/apiClient";
import { buildBackup, parseBackup, backupCounts, type BackupCounts } from "@/lib/backup";
import { Page, Btn } from "../ui";

const card: React.CSSProperties = { background: "#fff", border: "1px solid #ececf2", borderRadius: 16, padding: 22 };
const cardTitle: React.CSSProperties = { fontWeight: 800, fontSize: 15 };
const cardSub: React.CSSProperties = { fontSize: 12.5, color: "#8a919e", lineHeight: 1.7, marginTop: 4, marginBottom: 16 };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#4b5060", marginBottom: 6 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e6e8ee",
  borderRadius: 9,
  padding: "9px 11px",
  fontSize: 13,
  outline: "none",
  background: "#fbfbfd",
  fontFamily: "inherit",
};
const noteStyle: React.CSSProperties = { fontSize: 12, color: "#8a919e", lineHeight: 1.7, background: "#fafafc", border: "1px solid #f0f0f5", borderRadius: 10, padding: "10px 12px" };

const PROTOCOLS: { id: AiProtocol; name: string; desc: string }[] = [
  { id: "anthropic", name: "Anthropic 原生", desc: "api.anthropic.com 或同协议服务" },
  { id: "openai", name: "OpenAI 兼容", desc: "各类中转站 / DeepSeek / 本地推理等" },
];

function fmtBytes(n: number) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

/** 两击确认按钮：危险操作先武装、4 秒内再点一次才执行 */
function ArmedBtn({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Btn
      kind="ghost"
      label={armed ? <span style={{ color: "#d64545" }}>{confirmLabel}</span> : label}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        setArmed(false);
        onConfirm();
      }}
    />
  );
}

/** 账号与在线 AI：登录状态、用量额度、退出、删除账号（与本机数据完全无关） */
function AccountSection() {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const quota = useAuth((s) => s.quota);
  const showToast = useStore((s) => s.showToast);
  const [usage, setUsage] = useState<Awaited<ReturnType<typeof fetchMyUsage>> | null>(null);
  const [usageOpen, setUsageOpen] = useState(false);

  const loadUsage = async () => {
    setUsageOpen(true);
    setUsage(await fetchMyUsage());
  };

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={cardTitle}>账号与在线 AI</div>
        <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: token ? "#e6f5ee" : "#f2f3f5", color: token ? "#12805c" : "#8a919e" }}>
          {token ? "已登录" : "未登录 · 基础模式"}
        </span>
      </div>
      <div style={cardSub}>
        登录只用于在线 AI 的身份、额度与限流（服务端：{API_BASE}）。登录、退出都不影响本机数据。
      </div>

      {!token ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Btn label="登录（GitHub / 邮箱验证码）" onClick={() => useStore.setState({ loginOpen: true })} />
          <span style={{ fontSize: 12, color: "#8a919e" }}>未登录也可使用全部本地功能（基础模式，不调用在线 AI）</span>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{user?.name || user?.email || "已登录用户"}</div>
            {user?.email && user?.name ? <span style={{ fontSize: 12, color: "#8a919e" }}>{user.email}</span> : null}
            {user?.provider ? <span style={{ fontSize: 11, color: "#8a919e", background: "#f2f3f5", padding: "2px 8px", borderRadius: 99 }}>{user.provider === "github" ? "GitHub" : "邮箱"}</span> : null}
          </div>
          {quota ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8a919e", marginBottom: 4 }}>
                <span>本周期 AI 额度{quota.resetAt ? "（" + quota.resetAt.slice(0, 10) + " 重置）" : ""}</span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: "#16181d" }}>
                  {quota.used} / {quota.limit} {quota.unit || ""}
                </span>
              </div>
              <div style={{ height: 6, background: "#eee", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: Math.min(100, (quota.used / Math.max(1, quota.limit)) * 100) + "%", height: "100%", background: quota.used / Math.max(1, quota.limit) > 0.9 ? "#d64545" : "#5850ec" }} />
              </div>
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: usageOpen ? 14 : 0 }}>
            <Btn kind="ghost" label="查看我的 AI 用量" onClick={loadUsage} />
            <Btn
              kind="ghost"
              label="退出登录"
              onClick={async () => {
                await serverLogout();
                showToast("已退出登录 · 本机数据原样保留");
              }}
            />
            <ArmedBtn
              label="删除账号…"
              confirmLabel="再点一次确认删除账号"
              onConfirm={async () => {
                const r = await deleteAccount();
                showToast(r.ok ? "账号已删除（服务端身份与用量记录）· 本机数据未受影响" : "删除失败：" + r.error);
              }}
            />
          </div>
          {usageOpen ? (
            <div style={{ border: "1px solid #f0f0f5", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#4b5060", lineHeight: 1.8, maxHeight: 220, overflow: "auto" }}>
              {!usage ? (
                "加载中…"
              ) : !usage.ok ? (
                <span style={{ color: "#d64545" }}>用量获取失败：{usage.error}</span>
              ) : usage.data.recent.length ? (
                usage.data.recent.map((u, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span>{u.createdAt.slice(0, 16).replace("T", " ")} · {u.feature} · {u.model}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'" }}>{u.inputTokens}+{u.outputTokens} tok · {u.status}</span>
                  </div>
                ))
              ) : (
                "还没有调用记录。"
              )}
            </div>
          ) : null}
          <div style={{ ...noteStyle, marginTop: 14 }}>
            「删除账号」只删除服务端的身份与用量元数据，<b>不会</b>删除本机浏览器里的任何求职资料——清空本机数据请用下方「数据与隐私」里的独立按钮。
          </div>
        </>
      )}
    </div>
  );
}

function AiSection() {
  const ai = useAiConfig();
  const live = aiConfigured(ai);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);

  const switchProtocol = (p: AiProtocol) => {
    if (p === ai.protocol) return;
    const other: AiProtocol = p === "anthropic" ? "openai" : "anthropic";
    const patch: Parameters<typeof ai.patchAi>[0] = { protocol: p };
    if (!ai.model.trim() || ai.model === DEFAULT_MODEL[other]) patch.model = DEFAULT_MODEL[p];
    if (p === "anthropic" && !ai.url.trim()) patch.url = "https://api.anthropic.com";
    if (p === "openai" && ai.url.trim() === "https://api.anthropic.com") patch.url = "";
    ai.patchAi(patch);
    setTest(null);
  };

  const testConn = async () => {
    if (!live) {
      setTest({ ok: false, text: "请先填写 API URL 和 API Key" });
      return;
    }
    if (!ai.model.trim()) {
      setTest({ ok: false, text: "请先填写模型名" });
      return;
    }
    setTesting(true);
    setTest(null);
    const t0 = performance.now();
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol: ai.protocol,
          url: ai.url,
          key: ai.key,
          model: ai.model,
          max_tokens: 16,
          system: "请只回复两个字符：OK",
          messages: [{ role: "user", content: "OK" }],
        }),
      });
      const data = await res.json().catch(() => null);
      const ms = Math.round(performance.now() - t0);
      if (res.ok && typeof data?.text === "string") {
        setTest({ ok: true, text: "连接成功（" + ms + "ms）· 模型回复：" + data.text.trim().slice(0, 60) });
      } else {
        setTest({ ok: false, text: data?.error || "HTTP " + res.status });
      }
    } catch {
      setTest({ ok: false, text: "无法连接 /api/ai" });
    }
    setTesting(false);
  };

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={cardTitle}>高级：自带 API Key（BYOK）</div>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 99,
            background: live ? "#e6f5ee" : "#f2f3f5",
            color: live ? "#12805c" : "#8a919e",
          }}
        >
          {live ? "已启用 · 优先于登录额度" : "未启用"}
        </span>
      </div>
      <div style={cardSub}>
        有自己 API Key 的用户可以不走平台额度：填好 URL + Key 后，AI 请求经本应用透传直连你填的服务商，无需登录。
        留空则使用登录后的在线 AI。
      </div>

      <div style={lbl}>接口协议</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {PROTOCOLS.map((p) => {
          const on = ai.protocol === p.id;
          return (
            <div
              key={p.id}
              onClick={() => switchProtocol(p.id)}
              style={{
                cursor: "pointer",
                padding: "9px 13px",
                borderRadius: 10,
                border: "1.5px solid " + (on ? "#5850ec" : "#e6e8ee"),
                background: on ? "#f1f0fb" : "#fff",
                minWidth: 210,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: on ? "#5850ec" : "#16181d" }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: "#8a919e", marginTop: 2 }}>{p.desc}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={lbl}>API URL</div>
          <input
            style={inputStyle}
            value={ai.url}
            placeholder={ai.protocol === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com 或中转站地址"}
            onChange={(e) => ai.patchAi({ url: e.target.value })}
          />
        </div>
        <div>
          <div style={lbl}>模型名</div>
          <input
            style={{ ...inputStyle, fontFamily: "'JetBrains Mono'" }}
            value={ai.model}
            placeholder={ai.protocol === "anthropic" ? "claude-sonnet-5" : "例如 gpt-4o / deepseek-chat"}
            onChange={(e) => ai.patchAi({ model: e.target.value })}
          />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ ...lbl, display: "flex", justifyContent: "space-between" }}>
          <span>API Key</span>
          <span style={{ display: "flex", gap: 12 }}>
            <span style={{ cursor: "pointer", color: "#5850ec", fontWeight: 600 }} onClick={() => setShowKey(!showKey)}>
              {showKey ? "隐藏" : "显示"}
            </span>
            {ai.key ? (
              <span
                style={{ cursor: "pointer", color: "#d64545", fontWeight: 600 }}
                onClick={() => {
                  ai.patchAi({ key: "" });
                  setTest(null);
                }}
              >
                清除 Key
              </span>
            ) : null}
          </span>
        </div>
        <input
          style={{ ...inputStyle, fontFamily: "'JetBrains Mono'" }}
          type={showKey ? "text" : "password"}
          value={ai.key}
          placeholder="sk-…（只保存在你自己的浏览器里）"
          onChange={(e) => ai.patchAi({ key: e.target.value })}
        />
        <label style={{ display: "flex", alignItems: "flex-start", gap: 7, marginTop: 9, fontSize: 12, color: "#6b7280", cursor: "pointer", lineHeight: 1.6 }}>
          <input
            type="checkbox"
            checked={ai.remember}
            onChange={(e) => ai.patchAi({ remember: e.target.checked })}
            style={{ marginTop: 2 }}
          />
          <span>
            在本机浏览器记住 Key（明文存于 localStorage）。取消勾选则<b>仅本次使用</b>，刷新页面后需重新填写。
          </span>
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <Btn label={testing ? "测试中…" : "测试连接"} kind={testing ? "soft" : "primary"} onClick={testing ? undefined : testConn} />
        {test ? (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: test.ok ? "#12805c" : "#d64545" }}>{test.text}</span>
        ) : ai.lastError ? (
          <span style={{ fontSize: 12.5, color: "#d64545" }}>上次调用出错：{ai.lastError}</span>
        ) : null}
      </div>

      <div style={{ ...noteStyle, marginTop: 16 }}>
        Key 只保存在你自己的浏览器里，请求经本应用原样转发给上面填写的服务商——不落盘、不记日志。
      </div>
    </div>
  );
}

const COUNT_ROWS: { key: keyof BackupCounts; label: string }[] = [
  { key: "evidence", label: "经历" },
  { key: "jobs", label: "岗位" },
  { key: "resumes", label: "简历" },
  { key: "versions", label: "简历版本" },
  { key: "qa", label: "面试 QA" },
  { key: "mocks", label: "模拟面试" },
  { key: "records", label: "面试复盘" },
];

function DataSection() {
  const showToast = useStore((s) => s.showToast);
  const applyBackup = useStore((s) => s.applyBackup);
  const clearLocalData = useStore((s) => s.clearLocalData);
  const loadDemo = useStore((s) => s.loadDemo);
  const exitDemo = useStore((s) => s.exitDemo);
  const demoMode = useStore((s) => s.demoMode);
  const fileRef = useRef<HTMLInputElement>(null);
  const [usage, setUsage] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ data: PersistedState; counts: BackupCounts; cur: BackupCounts; fileName: string; exportedAt?: string } | null>(null);

  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((e) => {
        if (typeof e.usage === "number") setUsage(fmtBytes(e.usage));
      })
      .catch(() => {});
  }, []);

  const doExport = () => {
    const json = buildBackup(snapshot(useStore.getState()));
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "roleready-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("备份已导出 · 妥善保存，可用于换设备迁移");
  };

  const onPickFile = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const f = files[0];
    const text = await f.text();
    const r = parseBackup(text);
    if (!r.ok) {
      setImportErr(r.error);
      setPreview(null);
      return;
    }
    let exportedAt: string | undefined;
    try {
      const meta = JSON.parse(text) as { exportedAt?: string };
      exportedAt = typeof meta.exportedAt === "string" ? meta.exportedAt.slice(0, 10) : undefined;
    } catch {}
    setImportErr(null);
    setPreview({
      data: r.data,
      counts: backupCounts(r.data),
      cur: backupCounts(snapshot(useStore.getState())),
      fileName: f.name,
      exportedAt,
    });
  };

  return (
    <div style={card}>
      <div style={cardTitle}>数据与隐私</div>
      <div style={cardSub}>
        <b style={{ color: "#4b5060" }}>数据存储位置：</b>你的全部求职资料（经历、岗位、简历、QA、模拟、复盘）都保存在<b style={{ color: "#4b5060" }}>本机浏览器的 IndexedDB</b>
        {usage ? "（当前站点存储约 " + usage + "）" : ""}——不在任何服务器上。只有你主动使用 AI 时，完成该任务所需的内容才会被临时发送处理、用完即弃。
        清除浏览器站点数据会把资料一起清掉：重要节点请导出备份；换设备迁移 = 旧设备导出 + 新设备导入。
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn label="导出完整备份 JSON" onClick={doExport} />
        <Btn kind="ghost" label="导入备份…" onClick={() => fileRef.current?.click()} />
        <ArmedBtn
          label="清空本机数据…"
          confirmLabel="再点一次确认清空（建议先导出备份）"
          onConfirm={clearLocalData}
        />
      </div>

      <div style={{ marginTop: 14, borderTop: "1px solid #f2f2f6", paddingTop: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#4b5060" }}>演示数据</span>
        {demoMode ? (
          <>
            <span style={{ fontSize: 11.5, color: "#a3690f", background: "#fdf3e0", padding: "3px 10px", borderRadius: 99, fontWeight: 700 }}>演示模式进行中</span>
            <Btn kind="ghost" label="退出演示并清空示例数据" onClick={exitDemo} />
          </>
        ) : (
          <ArmedBtn label="加载演示数据…" confirmLabel="当前数据会自动备份并在退出演示时恢复，再点确认" onConfirm={loadDemo} />
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          onPickFile(e.target.files);
          e.target.value = "";
        }}
      />

      {importErr ? (
        <div style={{ marginTop: 14, fontSize: 12.5, color: "#d64545", background: "#fff0f0", border: "1px solid #ffd9d9", borderRadius: 10, padding: "10px 12px" }}>
          导入失败：{importErr}
        </div>
      ) : null}

      {preview ? (
        <div style={{ marginTop: 14, border: "1.5px solid #5850ec", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>
            备份预览：{preview.fileName}
            {preview.exportedAt ? <span style={{ color: "#8a919e", fontWeight: 400 }}>（导出于 {preview.exportedAt}）</span> : null}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", margin: "10px 0 4px", fontSize: 12.5, color: "#4b5060" }}>
            {COUNT_ROWS.map((r) => (
              <span key={r.key}>
                {r.label}{" "}
                <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
                  {preview.cur[r.key]} → {preview.counts[r.key]}
                </span>
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#c2810c", margin: "8px 0 12px" }}>
            确认后将<b>整体覆盖</b>当前本机数据（左边是现在的数量，右边是导入后的数量）。不放心可先「导出完整备份 JSON」留底。
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn
              label="确认导入，覆盖当前数据"
              onClick={() => {
                applyBackup(preview.data);
                setPreview(null);
              }}
            />
            <Btn kind="ghost" label="取消" onClick={() => setPreview(null)} />
          </div>
        </div>
      ) : null}

      <div style={{ ...noteStyle, marginTop: 16 }}>
        统一说明：正文本机保存；服务端只保存身份与用量元数据；AI 内容临时处理、不落库；登录不会自动同步本机数据；本机数据可随时导出与清空。
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <Page title="设置" sub="你的职业资料属于你，不属于平台。账号只管在线 AI 的身份与额度；资料全部保存在你自己的设备上。">
      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
        <AccountSection />
        <DataSection />
        <AiSection />
      </div>
    </Page>
  );
}
