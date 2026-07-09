import "server-only";

/**
 * 导出用的短时内存暂存：POST /api/export 把简历数据存进来拿到 token，
 * 打印页 /print?token= 再用 token 取回渲染。单进程有效，60s 过期自动清理。
 */
interface Stashed {
  data: unknown;
  exp: number;
}

const TTL_MS = 60_000;
const store = new Map<string, Stashed>();

function sweep() {
  const now = Date.now();
  for (const [k, v] of store) if (v.exp < now) store.delete(k);
}

export function putExport(data: unknown): string {
  sweep();
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  store.set(token, { data, exp: Date.now() + TTL_MS });
  return token;
}

export function getExport(token: string): unknown | null {
  sweep();
  return store.get(token)?.data ?? null;
}

export function dropExport(token: string): void {
  store.delete(token);
}
