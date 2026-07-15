# RoleReady 托管后端契约（api.remi.run / roleready 模块）

> 前端（`web/`）已按本契约完成对接并用本地假后端跑通 E2E；**真实后端模块尚未部署**，
> 需要在 remi gateway（api.remi.run 的服务，见 `~/dev/remi/server/gateway/`）里按本文实现，
> 属于当前唯一的上线阻断项。前端基地址由 `NEXT_PUBLIC_RR_API_BASE` 控制（默认 `https://api.remi.run`）。

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
