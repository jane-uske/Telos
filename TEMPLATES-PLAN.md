# 模板体系演进方案（已确认）

> 状态：方案已拍板（2026-07-09）。P0 进行中。
> 三个已确认决策：① 自定义模板是**数据不是代码**；② 分享 V1 = 链接分享 + fork 语义，公开广场后置；③ 顺序 P0 → P1 → P2 → P3。

## 核心架构决策：TemplateSpec（数据）+ SpecRenderer（通用渲染器）

自定义模板、AI 生成、分享，流转的都是一份 **JSON 设计参数（TemplateSpec）**，
由**一个通用渲染器**白名单式消费。绝不流转代码（JSX / 任意 HTML+CSS）。

理由：
- **安全**：分享 = 别人渲染你的 spec。纯数据无注入面；颜色等字段做格式校验，防 CSS 注入。
- **AI 可控**：截图 → `streamObject` 按 Zod schema 流式产出 spec（复用导入/tailor 的流式基建），输出永远合法。
- **导出免费**：服务端 PDF/HTML 导出走同一渲染器，无额外适配。
- **可持久化**：spec 可进库、可分享、可版本化（`specVersion` 字段留升级余地）。

### TemplateSpec 参数空间（草案，P1 定稿为 Zod schema）

```
specVersion: 1
skeleton:  single | sidebar-left | sidebar-right | banner | two-col      ← 骨架枚举
layout:    sidebarRatio、sidebar 放哪些 section、栏间距
header:    对齐(left|center) / 风格(plain|band|underline|boxed)
           / 照片(none|circle|square) / 名字字号档位
section:   标题样式(caps|underline|band|leftbar|dot) / 分隔线(none|line|dotted)
           / 密度(compact|normal|loose)
typography: 字族(sans|serif|mono) / 基准字号档位 / 标题字重 / 行高
colors:    accent / ink / muted / headerBg / sidebarBg（校验 hex/oklch 格式）
details:   时间轴(bool) / bullet 样式(dot|dash|none) / 技能标签(tag|inline|bar)
```

设计目标：覆盖现有内置 layout ~80% 的效果，组合出海量合法变体；
**约束即特性**——保证 A4 打印安全、ATS 可解析，不会生成怪胎排版。

### 双轨并行，零迁移

现有内置 layout（React 代码组件）**不迁移**。内置模板走代码，自定义模板走
SpecRenderer。自定义模板缩略图直接用 SpecRenderer 缩小渲染。

## 分期路线

### P0 · 扩充内置模板（进行中）
- 现有 layout × 新配色/字体 = 变体条目（只加 `templates.ts` 配置）。
- 手写 2~3 个新 layout（同步 `resume-preview.tsx` + `template-thumb.tsx`）。

### P1 · TemplateSpec + SpecRenderer（核心地基）
- `src/lib/template-spec.ts`：Zod schema + 默认值 + 校验。
- `src/components/spec-renderer.tsx`：通用渲染器（预览/导出/缩略图共用）。
- 「自定义模板」编辑器：左调参面板 + 右实时预览。
- 存储：先 localStorage（zustand persist），不等后端。

### P2 · Vibe Coding：截图 → 模板
- `/api/vibe-template`：Claude 视觉 + `streamObject(TemplateSpec)`。
- 上传/粘贴截图 → spec 流式生成 → 右侧用**用户自己的简历数据**实时长出模板。
- 自然语言多轮微调（当前 spec + 指令 → 修改后的 spec），兜底看图偏差。
- 保存为自定义模板。**预期管理：神似，不是像素复刻。**
- 上传处放一行版权提示（仿制他人设计属灰色地带）。

### P3 · 分享机制（Telos 第一块后端）
- 需要账号：接已有登录网关（见 AUTH.md）。Next API + SQLite。
- 表：`custom_templates(id, owner_user_id, name, spec_json, source(manual|vibe|fork), forked_from, share_slug, created_at)`
- 分享 = 链接 `telos.xsticq.com/t/<slug>` → 示例数据预览页 → 「使用此模板」。
- **fork 语义**：使用 = 复制 spec 到自己名下，作者改/删不影响已 fork 的人。
- 公开广场（列表/审核/举报）后置，V1 不做。
- 此后端同时是多简历/收费后端的开端（与 MONETIZATION.md 汇合）。

## 风险与对策
- spec 表达力不足 → `specVersion` + 迭代扩参数。
- AI 看图偏差 → P2 自然语言微调兜底。
- 分享内容安全 → spec 纯数据；模板名转义；颜色格式白名单。
