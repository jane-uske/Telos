// 本地假 api.remi.run：按 docs/BACKEND-API.md 契约实现，用于 RoleReady 前端 E2E。
// node fake-remi-api.mjs  → http://localhost:8787
import http from "node:http";

const TOKEN = "tok_e2e_fixed";
const sessions = new Set();
const usage = [];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

function json(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify(body));
}

function aiText(payload) {
  const last = (payload.messages || []).map((m) => (typeof m.content === "string" ? m.content : "")).join("\n");
  const sys = payload.system || "";
  const all = sys + "\n" + last;
  if (last.includes("拆解 JD") || last.includes("请：1) 拆解 JD"))
    return JSON.stringify({
      analysis: { responsibilities: ["【AI】负责核心链路开发", "【AI】性能优化"], mustHave: ["React 深度经验", "性能优化"], niceToHave: ["协同经验"], hidden: ["独立扛核心链路"], interviewFocus: ["性能优化完整过程"] },
      match: {
        metrics: { coverage: 77, strength: 66, clarity: 80, risk: 1 },
        strong: [{ req: "React 深度经验", evId: extractEvId(last) || null, ev: extractEvTitle(last), note: "【AI】直接命中，重点写" }],
        weak: [], none: [{ req: "云原生", evId: null, ev: null, note: "【AI】无证据，禁止虚构" }],
        downplay: [], risks: [{ text: "【AI】『显著提升』缺少数字", fix: "补充可验证数字" }],
      },
    });
  if (last.includes("定制一份简历"))
    return JSON.stringify({
      summary: "【AI 生成】五年前端，" + (all.includes("【证据匹配分析——生成时必须遵守】") ? "已读取 match 输入。" : "（未见 match 输入！）"),
      exp: [{ company: "某在线文档 SaaS", role: "高级前端", period: "2022-至今", bullets: [
        { id: "ab1", text: "【AI】主导协同编辑器冲突算法重构（压测口径 800ms→120ms）", evId: extractEvId(last), ev: extractEvTitle(last), jdReq: "React 深度经验", reason: "命中强匹配项", hook: true, probe: "内存控制细节" },
      ] }],
      skills: ["React", "TypeScript"],
    });
  if (last.includes("生成面试 QA") || last.includes("为这份简历生成面试 QA"))
    return JSON.stringify([
      { cat: "intro", q: "【AI】30 秒自我介绍", answer: "……", jdReq: "整体匹配", prep: "todo", highRisk: false },
      { cat: "risk", q: "【AI】『显著提升』的数字依据是什么？", answer: "（针对风险表述生成）", jdReq: "可信度", prep: "todo", highRisk: true, followUps: ["数据口径？"] },
    ]);
  if (last.includes("真实面试转写") || last.includes("这是「"))
    return JSON.stringify({
      transcript: [{ t: "00:00", speaker: "interviewer", text: "【AI】自我介绍", flags: [] }, { t: "00:20", speaker: "me", text: "我是候选人，具体数字我记不太清了", flags: ["vague"] }],
      qas: [{ q: "【AI】自我介绍", a: "……", chain: 0, fromResume: null, hookHit: false, issue: "含糊", better: "补数字" }],
      hooks: [], notes: [{ section: "流程", content: "【AI】节奏快" }], score: 70, verdict: "【AI】数字接不住",
      highlights: ["表达清晰"], issues: ["数字含糊"], gaps: ["数据口径"], nextPrep: ["补口径"],
      suggestions: [{ target: "qa", title: "【AI】新增数字口径题", detail: "沉淀为准备答案" }],
    });
  if (last.includes("拆解成经历段") || last.includes("拆解成结构化 JSON"))
    return JSON.stringify([
      { title: "【AI】协作编辑器核心开发", kind: "work", company: "某在线文档 SaaS", project: "实时协作编辑器", period: "2022.06-至今", bullets: ["重构冲突算法", "优化同步性能", "冲突算法模块：CRDT 增量 GC"] },
      { title: "【AI】商家中台前端", kind: "work", company: "某电商公司", project: "商家中台", period: "2020.07-2022.05", bullets: ["性能优化：首屏 3.5s→1.2s", "埋点 SDK 建设"] },
    ]);
  if (last.includes("访谈记录"))
    return JSON.stringify({ summary: "【AI】候选人独立负责协同层。", abilities: ["CRDT 落地"], missing: ["线上 P95 数字"] });
  if (last.includes("复盘报告"))
    return JSON.stringify({ overall: "【AI】整体清晰但数字弱", good: ["结构清楚"], exposed: ["内存数字"], incomplete: ["扩展设计"], redo: ["内存题"], resumeSuggestions: [], nextFocus: ["数字口径"] });
  return "【AI】收到。请继续讲讲你个人负责的部分和可验证的数字。";
}
const extractEvId = (t) => { const m = t.match(/\[(ev[a-z0-9]+|e\d+)\]/); return m ? m[1] : null; };
const extractEvTitle = (t) => { const m = t.match(/\[(?:ev[a-z0-9]+|e\d+)\] ([^（\n：]+)/); return m ? m[1].trim() : null; };

http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  let body = "";
  for await (const c of req) body += c;
  let data = {};
  try { data = JSON.parse(body || "{}"); } catch {}
  const auth = (req.headers.authorization || "").replace("Bearer ", "");
  const authed = sessions.has(auth);
  console.log(req.method, p, authed ? "(authed)" : "");

  if (p === "/roleready/v1/auth/email/code") return json(res, 200, { ok: true });
  if (p === "/roleready/v1/auth/email/verify") {
    if (data.code !== "123456") return json(res, 400, { error: { code: "bad_code", message: "验证码不正确（E2E：请用 123456）" } });
    sessions.add(TOKEN);
    return json(res, 200, { token: TOKEN, user: { id: "u_e2e", email: data.email, name: "E2E 用户", provider: "email", isAdmin: true } });
  }
  if (p === "/roleready/v1/auth/github/start") {
    const back = url.searchParams.get("redirect") || "http://localhost:3000";
    sessions.add(TOKEN);
    res.writeHead(302, { Location: back + "#rr_token=" + TOKEN, ...CORS });
    return res.end();
  }
  if (!authed) return json(res, 401, { error: { code: "unauthorized", message: "未登录或会话已过期" } });

  if (p === "/roleready/v1/me" && req.method === "GET")
    return json(res, 200, { user: { id: "u_e2e", email: "e2e@test.dev", name: "E2E 用户", provider: "email", isAdmin: true }, quota: { limit: 100000, used: usage.length * 500, unit: "tokens", resetAt: "2026-08-01" } });
  if (p === "/roleready/v1/me" && req.method === "DELETE") { sessions.delete(auth); return json(res, 200, { ok: true }); }
  if (p === "/roleready/v1/auth/logout") { sessions.delete(auth); return json(res, 200, { ok: true }); }
  if (p === "/roleready/v1/ai/chat") {
    const text = aiText(data);
    usage.push({ userId: "u_e2e", requestId: data.requestId, feature: data.feature, model: "claude-sonnet-5", inputTokens: 800, outputTokens: 350, estimatedCost: 0.006, durationMs: 400, status: "ok", createdAt: new Date().toISOString() });
    const quota = { limit: 100000, used: usage.length * 500, unit: "tokens", resetAt: "2026-08-01" };
    // stream:true → SSE 契约（data: {type:"delta"|"done"}），按小片延迟下发模拟真实流
    if (data.stream === true) {
      res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", ...CORS });
      const CHUNK = 24;
      let i = 0;
      const timer = setInterval(() => {
        if (i >= text.length) {
          clearInterval(timer);
          res.write(`data: ${JSON.stringify({ type: "done", quota })}\n\n`);
          return res.end();
        }
        res.write(`data: ${JSON.stringify({ type: "delta", text: text.slice(i, i + CHUNK) })}\n\n`);
        i += CHUNK;
      }, 30);
      return;
    }
    return json(res, 200, { text, quota });
  }
  if (p === "/roleready/v1/me/usage")
    return json(res, 200, { quota: { limit: 100000, used: usage.length * 500, unit: "tokens", resetAt: "2026-08-01" }, recent: usage.slice(-20).reverse() });
  if (p === "/roleready/v1/admin/usage/summary") {
    const by = (k) => Object.values(usage.reduce((a, u) => { (a[u[k]] ||= { [k === "feature" ? "feature" : "model"]: u[k], requests: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0 }); const g = a[u[k]]; g.requests++; g.inputTokens += u.inputTokens; g.outputTokens += u.outputTokens; g.estimatedCost += u.estimatedCost; return a; }, {}));
    return json(res, 200, {
      total: { requests: usage.length, inputTokens: usage.length * 800, outputTokens: usage.length * 350, estimatedCost: usage.length * 0.006, failRate: 0 },
      byFeature: by("feature"), byModel: by("model"),
      topUsers: [{ userId: "u_e2e", requests: usage.length, estimatedCost: usage.length * 0.006 }],
      anomalies: [],
    });
  }
  json(res, 404, { error: { code: "not_found", message: p } });
}).listen(8787, () => console.log("fake api.remi.run on :8787"));
