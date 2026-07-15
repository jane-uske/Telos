"use client";

import React, { useEffect, useRef, useState } from "react";
import { useStore, snapshot } from "@/lib/store";
import type { PersistedState } from "@/lib/store";
import { useAiConfig, aiConfigured, DEFAULT_MODEL, type AiProtocol } from "@/lib/aiConfig";
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
      setTest({ ok: false, text: "无法连接本机服务 /api/ai" });
    }
    setTesting(false);
  };

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={cardTitle}>AI 接入</div>
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
          {live ? "已接入真实 AI" : "Mock 演示模式"}
        </span>
      </div>
      <div style={cardSub}>
        用你自己的 API Key 和服务地址，填好即自动启用真实 AI；留空则保持 Mock 演示模式
        （所有「AI」结果都是本地确定性生成的演示内容，不调用任何外部服务）。
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
        隐私说明：Key 只保存在你自己的浏览器里，请求时经由你本机运行的 ProofCV 服务原样转发给上面填写的 AI
        服务商——不落盘、不记日志。ProofCV 没有服务端数据库，不上传、不托管你的任何资料。
      </div>
    </div>
  );
}

const COUNT_ROWS: { key: keyof BackupCounts; label: string }[] = [
  { key: "evidence", label: "职业证据" },
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
  const resetToSeed = useStore((s) => s.resetToSeed);
  const fileRef = useRef<HTMLInputElement>(null);
  const [usage, setUsage] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ data: PersistedState; counts: BackupCounts; cur: BackupCounts; fileName: string; exportedAt?: string } | null>(null);
  const [resetArmed, setResetArmed] = useState(false);

  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((e) => {
        if (typeof e.usage === "number") setUsage(fmtBytes(e.usage));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!resetArmed) return;
    const t = setTimeout(() => setResetArmed(false), 4000);
    return () => clearTimeout(t);
  }, [resetArmed]);

  const doExport = () => {
    const json = buildBackup(snapshot(useStore.getState()));
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "proofcv-backup-" + new Date().toISOString().slice(0, 10) + ".json";
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
      <div style={cardTitle}>数据与迁移</div>
      <div style={cardSub}>
        所有资料（证据、岗位、简历、QA、模拟、复盘）都存在本机浏览器的 IndexedDB 里
        {usage ? "（当前站点存储约 " + usage + "）" : ""}，不上云。清除浏览器站点数据会把它们一起清掉——
        重要节点请导出备份；换设备迁移 = 旧设备导出 + 新设备导入。
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn label="导出备份 JSON" onClick={doExport} />
        <Btn kind="ghost" label="导入备份…" onClick={() => fileRef.current?.click()} />
        <Btn
          kind="ghost"
          label={
            resetArmed ? (
              <span style={{ color: "#d64545" }}>再点一次确认清空</span>
            ) : (
              "恢复演示数据（清空本机数据）"
            )
          }
          onClick={() => {
            if (!resetArmed) {
              setResetArmed(true);
              return;
            }
            setResetArmed(false);
            setPreview(null);
            resetToSeed();
          }}
        />
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
            确认后将<b>整体覆盖</b>当前本机数据（左边是现在的数量，右边是导入后的数量）。不放心可先「导出备份 JSON」留底。
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
    </div>
  );
}

export default function Settings() {
  return (
    <Page title="设置" sub="AI 接入与本机数据管理。Key 和资料都只存在你自己的设备上，ProofCV 不托管任何用户数据。">
      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
        <AiSection />
        <DataSection />
      </div>
    </Page>
  );
}
