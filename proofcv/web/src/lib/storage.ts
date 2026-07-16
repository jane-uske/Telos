"use client";

// zustand persist 的 IndexedDB 适配器。
// 不用 localStorage 的原因：主数据里有转写文本等大块内容，localStorage 的
// ~5MB 同步配额撑不久；IndexedDB 配额是百 MB 级且异步不阻塞主线程。
// IndexedDB 不可用时（隐私模式等）回落 localStorage。

import type { StateStorage } from "zustand/middleware";

const DB_NAME = "proofcv";
const STORE = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    // 打开失败时允许下次重试，而不是缓存住一个 rejected promise
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = op(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export const idbStorage: StateStorage = {
  getItem: async (name) => {
    try {
      const v = await run<unknown>("readonly", (s) => s.get(name) as IDBRequest<unknown>);
      return typeof v === "string" ? v : null;
    } catch {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
  },
  setItem: async (name, value) => {
    try {
      await run("readwrite", (s) => s.put(value, name));
    } catch {
      try {
        localStorage.setItem(name, value);
      } catch {}
    }
  },
  removeItem: async (name) => {
    try {
      await run("readwrite", (s) => s.delete(name));
    } catch {
      try {
        localStorage.removeItem(name);
      } catch {}
    }
  },
};
