"use client";

// 备份文件的生成与校验。资料只存用户本机（IndexedDB），迁移路径：
// 换设备 = 旧设备导出 JSON + 新设备导入；应用升级 = persist 的 version/migrate。
// 导入永远先校验、再由用户在设置页确认覆盖，不会自动执行。

import type { PersistedState } from "./store";
import { migrateV1toV2 } from "./store";
import { emptyProfile } from "./types";

export const BACKUP_VERSION = 2;

type Dict = Record<string, unknown>;
const isObj = (v: unknown): v is Dict => !!v && typeof v === "object" && !Array.isArray(v);
const rec = <T,>(v: unknown): Record<string, T> => (isObj(v) ? (v as Record<string, T>) : {});
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function buildBackup(data: PersistedState): string {
  return JSON.stringify(
    { app: "roleready", version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data },
    null,
    2
  );
}

export interface BackupCounts {
  evidence: number;
  jobs: number;
  resumes: number;
  versions: number;
  qa: number;
  mocks: number;
  records: number;
}

export function backupCounts(d: PersistedState): BackupCounts {
  const sum = (m: Record<string, unknown[]>) => Object.values(m).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0);
  return {
    evidence: d.evidence.length,
    jobs: d.jobs.length,
    resumes: Object.keys(d.resumes).length,
    versions: sum(d.resumeVersions),
    qa: sum(d.qa),
    mocks: sum(d.mocks),
    records: d.records.length,
  };
}

export function parseBackup(
  text: string
): { ok: true; data: PersistedState } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "文件不是有效 JSON" };
  }
  // 兼容改名前（ProofCV 时期）导出的备份
  if (!isObj(raw) || (raw.app !== "roleready" && raw.app !== "proofcv") || !isObj(raw.data)) {
    return { ok: false, error: "这不是 RoleReady 导出的备份文件" };
  }
  if (typeof raw.version === "number" && raw.version > BACKUP_VERSION) {
    return { ok: false, error: "备份来自更新版本的 RoleReady，请先升级应用再导入" };
  }
  // v1 备份（标题字符串关联）→ 迁移为稳定 ID 关联
  const d = (typeof raw.version === "number" && raw.version >= 2 ? (raw.data as Dict) : migrateV1toV2({ ...(raw.data as Dict) })) as Dict;
  const jobs = arr<PersistedState["jobs"][number]>(d.jobs).filter(
    (j) => isObj(j) && typeof (j as unknown as Dict).id === "string" && typeof (j as unknown as Dict).company === "string"
  );
  const evidence = arr<PersistedState["evidence"][number]>(d.evidence);
  if (!jobs.length && !evidence.length) {
    return { ok: false, error: "备份里没有任何经历或岗位数据，无法导入" };
  }
  const firstJob = jobs[0]?.id || "";
  const data: PersistedState = {
    screen: "app",
    tab: "settings",
    guideDismissed: !!d.guideDismissed,
    demoMode: !!d.demoMode,
    profile: isObj(d.profile) ? { ...emptyProfile(), ...(d.profile as Partial<PersistedState["profile"]>) } : emptyProfile(),
    genSource: rec(d.genSource),
    aiConsented: !!d.aiConsented,
    lastWorkTab: null,
    evidence,
    jobs,
    activeJobId: typeof d.activeJobId === "string" && jobs.some((j) => j.id === d.activeJobId) ? (d.activeJobId as string) : firstJob,
    jobsView: d.jobsView === "track" ? "track" : "find",
    analyses: rec(d.analyses),
    matches: rec(d.matches),
    resumes: rec(d.resumes),
    resumeVersions: rec(d.resumeVersions),
    resumeTpl: typeof d.resumeTpl === "string" ? d.resumeTpl : "classic",
    resumeSpec: isObj(d.resumeSpec) ? (d.resumeSpec as unknown as PersistedState["resumeSpec"]) : null,
    resumeScope: d.resumeScope === "base" ? "base" : "job",
    qa: rec(d.qa),
    qaStale: rec(d.qaStale),
    mocks: rec(d.mocks),
    mockStale: rec(d.mockStale),
    mockActive: false,
    mockMsgs: [],
    mockBasic: false,
    ivProject: null,
    ivMsgs: [],
    ivDraft: null,
    ivBasic: false,
    records: arr(d.records),
    recJobId: typeof d.recJobId === "string" && jobs.some((j) => j.id === d.recJobId) ? (d.recJobId as string) : firstJob,
    activeRecordId: null,
  };
  return { ok: true, data };
}
