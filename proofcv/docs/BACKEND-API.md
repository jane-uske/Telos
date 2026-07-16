# RoleReady 托管后端契约（api.remi.run / roleready 模块）

> **状态（2026-07-16）：已实现并部署。** 后端模块在 remi 仓库 `server/gateway/roleready/`
> （commit `79a5bc1f`），随 remi 本地生产栈（docker + Cloudflare tunnel）跑在 api.remi.run。
> 单测：`test/server/gateway/roleready.test.ts`（13 条）；全链路 E2E：`scripts/roleready_e2e.ts`
> （29 断言，一次性 PG + 假上游）；生产冒烟已验证真实 Claude 调用、幂等与用量记录。
> 环境变量在 remi `.env.local-prod` 的 RoleReady 段；GitHub OAuth / Resend 凭据待填（见文末）。
> 前端基地址由 `NEXT_PUBLIC_RR_API_BASE` 控制（默认 `https://api.remi.run`）。

## 调用链与职责边界（固定）

```
浏览器 (RoleReady web)
  → api.remi.run          登录与 Session、AI 权限、用户额度、限流、请求幂等、用量审计
    → sub2api.remi.run    模型路由、上游密钥、Token 与成本统计、上游错误处理
      → 模型服务
```

- 前端**禁止**直接访问 sub2api.remi.run，服务端 Key 永不出后端。
- 后端**不持久化**用户求职正文：完整 Prompt、简历正文、JD、面试回答、模型完整返回、API Key 一律不落库、不进日志/监控/埋点。
- 只保存两类数据：**身份**（用户表）与**用量元数据**（见下）。

## 路由（全部挂在 `/roleready/v1` 前缀下，避免与 remi 现有 `/api/*` 冲突）

所有需鉴权接口用 `Authorization: Bearer <token>`。错误统一返回
`{ "error": { "code": "<机器码>", "message": "<人话>" } }`；错误码至少含：
`unauthorized`（401）、`forbidden`（403）、`quota_exceeded`、`rate_limited`（429）、`bad_code`、`upstream_error`（502）。

### 登录与 Session

| 方法/路径 | 说明 |
|---|---|
| `POST /auth/email/code` `{email}` | 发送邮箱验证码（限流：同邮箱 1 次/分钟）。响应 `{ok:true}` |
| `POST /auth/email/verify` `{email, code}` | 校验验证码，响应 `{token, user}` |
| `GET /auth/github/start?redirect=<url>` | 302 到 GitHub OAuth；回调完成后 302 回 `<redirect>#rr_token=<token>`（redirect 需校验白名单：部署域名 + localhost） |
| `GET /me` | `{user: {id, email?, name?, avatar?, isAdmin?, provider}, quota: {limit, used, unit?, resetAt?} \| null}` |
| `POST /auth/logout` | 使当前 token 失效 |
| `DELETE /me` | 删除账号：删身份与用量记录。**与用户本机数据无关**（本机数据前端自管） |

Token 建议 JWT（复用 remi gateway 现有 `JWT_SECRET` 基建），有效期 30 天。

### AI 代理

`POST /ai/chat`

```jsonc
// 请求
{
  "feature": "job_analysis | resume_generate | qa_generate | interview | mock_interview | record_review | import_parse",
  "system": "…",                    // 可选
  "messages": [{ "role": "user|assistant", "content": "…" }],
  "max_tokens": 1800,               // 服务端上限裁剪（建议 ≤ 4096）
  "requestId": "uuid"               // 幂等键：同一 requestId 重复请求返回首次结果，不重复计费
}
// 响应
{ "text": "…", "quota": { "limit": 100000, "used": 4200, "unit": "tokens", "resetAt": "…" } }
```

后端职责：鉴权 → 校验额度（超出返回 `quota_exceeded`）→ 限流（按用户，如 20 req/min，超出 429）→
幂等去重（requestId 短期缓存）→ 转发 sub2api.remi.run（服务端持有 sub2api 的 key）→
记录用量元数据 → 返回 `text`。**请求与响应正文用完即弃。**

### 用量

| 方法/路径 | 说明 |
|---|---|
| `GET /me/usage` | `{quota, recent: UsageRecord[]}`（最近 ~20 条，仅本人） |
| `GET /admin/usage/summary` | 管理员（`isAdmin`，否则 403）。`{total: {requests, inputTokens, outputTokens, estimatedCost, failRate}, byFeature[], byModel[], topUsers[], anomalies[]}` |

前端 `/admin` 页面已按此渲染（总调用量 / 功能消耗 / 模型消耗 / 失败率 / 异常用户），不需要更复杂后台。

## 用量记录字段（每次 AI 调用一条，最少集）

```
userId, requestId, feature, model,
inputTokens, outputTokens, estimatedCost, durationMs,
status ("ok" | "error:<code>"), createdAt
```

明确**不**记录：prompt、messages、system、模型返回正文、IP 之外的设备信息。

## 本地联调

`web/` 目录：`NEXT_PUBLIC_RR_API_BASE=http://localhost:8787 npm run dev`，
假后端参考实现：`web/scripts/fake-remi-api.mjs`（`node web/scripts/fake-remi-api.mjs`）（邮箱验证码固定 `123456`，
GitHub start 直接 302 带 token 回跳，AI 按 feature 返回确定性 JSON）。前端 E2E 已在该假后端上全量走通。

## 真实后端运维（remi 仓库）

- 代码：`server/gateway/roleready/`（挂载点在 `server/gateway/index.ts`，位于 remi access gate 之前，自管鉴权）。
- 表：`storage/schema.sql` 末尾 RoleReady 段（`roleready_users` / `roleready_email_codes` / `roleready_revoked_tokens` / `roleready_usage`），随 `ensureStorageSchema` 幂等建表。
- 部署：`npm run prod:local:rebuild`（建议从干净 worktree 构建，避免把未提交 WIP 烤进镜像）；验证 `curl https://api.remi.run/roleready/v1/health`。
- E2E：`docker run -d --rm --name rr-e2e-pg -e POSTGRES_PASSWORD=t -e POSTGRES_USER=rr -e POSTGRES_DB=rr -p 127.0.0.1:5433:5432 postgres:16-alpine`，然后 `NODE_OPTIONS="--no-experimental-strip-types" npx ts-node --transpile-only scripts/roleready_e2e.ts`。
- 环境变量（`.env.local-prod` RoleReady 段）：`ROLEREADY_LLM_BASE_URL`（http://host.docker.internal:8080 → 本机 sub2api）、`ROLEREADY_LLM_API_KEY`（sub2api 里名为 `roleready` 的专用 key）、`ROLEREADY_LLM_PROTOCOL=anthropic`、`ROLEREADY_LLM_MODEL`、`ROLEREADY_ADMIN_EMAILS` / `ROLEREADY_ADMIN_GITHUB_LOGINS`、`ROLEREADY_PUBLIC_BASE`、额度/限流可调（`ROLEREADY_MONTHLY_TOKEN_QUOTA` 默认 30 万 token/月、`ROLEREADY_RATE_PER_MIN` 默认 20）。JWT 密钥缺省复用 `REMI_AUTH_JWT_SECRET`（aud=roleready 双向隔离，与 remi token 互不通用）。

### 待人工配置（登录通道，二选一即可用）

1. **GitHub OAuth**：github.com/settings/developers → New OAuth App：
   Homepage `https://roleready.remi.run`，Callback `https://api.remi.run/roleready/v1/auth/github/callback`；
   把 Client ID/Secret 填入 `.env.local-prod` 的 `ROLEREADY_GITHUB_CLIENT_ID/SECRET`，重启：`npm run prod:local:start`。
2. **邮箱验证码**：Resend 账号 + 验证发件域，填 `ROLEREADY_RESEND_API_KEY` 与 `ROLEREADY_EMAIL_FROM`。

配好前，两通道分别返回 503 `github_unavailable` / `email_unavailable`，前端原样提示，不伪装。
