# AI 分析 + 智能一页 实现计划

## Context

Telos 简历编辑器已有 AI 润色、JD 关键词提取等能力。用户希望在工具栏「导出 PDF」旁新增两个功能按钮，结果以内联面板形式展示在预览区上方。

---

## 功能一：AI 分析

### 两种模式

1. **通用分析** — 无需 JD，对简历打分（满分 100）+ 5 个维度评分 + 亮点/改进建议
2. **JD 匹配** — 粘贴 JD，分析匹配度 + 关键词命中/缺失 + 针对性建议

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/lib/analysis-types.ts` | `GeneralAnalysisResult` / `JdMatchAnalysisResult` 类型定义 |
| `src/app/api/analyze/route.ts` | POST 接口，接收 `{ resume, jd? }`，用 `generateText` 返回结构化 JSON |
| `src/lib/use-analysis.ts` | 客户端 fetch hook — `{ result, loading, error, analyze, reset }` |
| `src/components/ai-analysis-panel.tsx` | 内联结果面板组件 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/lib/ai.ts` | 新增 `SYSTEM_ANALYZE` 和 `SYSTEM_JD_ANALYZE` 两个 system prompt |
| `src/app/editor/page.tsx` | 工具栏加按钮 + 预览区上方渲染面板 |

### AI 分析面板 UI 结构

```
┌─ AI 分析 ─────────────────────── [×] ─┐
│ [通用分析] [JD 匹配]     ← tab 切换    │
│                                        │
│ 通用模式:                              │
│   总分 82/100  ████████░░              │
│   内容完整度 85  量化表达 70  ...       │
│   ✅ 亮点: ...                         │
│   💡 改进: ...                         │
│                                        │
│ JD 模式:                               │
│   [粘贴 JD 文本框]  [分析]             │
│   匹配度 78%                           │
│   ✅ React  ✅ TypeScript  ❌ Go       │
│   缺失能力: ...                        │
│   修改建议: ...                        │
└────────────────────────────────────────┘
```

### API 设计

- 非流式（`generateText`），因为需要解析结构化 JSON 来渲染评分卡片/标签
- 参考现有 `/api/match-jd` 的模式：用正则提取 JSON，try/catch 解析
- 返回格式见 `analysis-types.ts` 类型定义

---

## 功能二：智能一页

### 两阶段渐进策略

1. **排版压缩**（本地，无 AI） — 逐级切换间距到 compact，检测是否仍溢出
2. **AI 精简内容**（如仍溢出） — 调 AI 压缩 bullets、精简描述，返回完整 Resume 对象

### 溢出检测

新增 `src/lib/use-page-overflow.ts`：
- 用 `ResizeObserver` 监听 `#resume-sheet` 的高度
- A4 @96dpi 高度 ≈ 1123px，`overflowing = scrollHeight > 1123`
- 返回 `{ overflowing, pageCount, sheetHeight }`

### 快照/撤销

在 `src/lib/store.ts` 的 Zustand store 中新增：
- `_onePageSnapshot: { resume, theme } | null` — 压缩前快照
- `saveOnePageSnapshot()` / `revertOnePage()` / `clearOnePageSnapshot()`
- 通过 `partialize` 排除快照不写入 localStorage

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/lib/use-page-overflow.ts` | ResizeObserver 溢出检测 hook |
| `src/lib/one-page.ts` | 两阶段压缩编排逻辑 |
| `src/app/api/condense/route.ts` | POST 接口，接收 `{ resume }`，返回精简后的 Resume JSON |
| `src/components/smart-one-page-panel.tsx` | 内联操作面板 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/lib/ai.ts` | 新增 `SYSTEM_CONDENSE` prompt |
| `src/lib/store.ts` | 快照状态 + partialize 配置 |
| `src/app/editor/page.tsx` | 工具栏按钮 + 面板渲染 + A4 边界线 |

### 智能一页面板 UI 流程

```
初始态:  "当前约 1.3 页"  [开始压缩]
  ↓
排版压缩: "第 1 步: 调整间距..." ⏳
  ↓
AI 精简: "第 1 步: 间距已调整 ✅"
         "第 2 步: AI 精简内容中..." ⏳
  ↓
完成:    "已压缩至一页 ✅"
         变更摘要列表
         [接受更改]  [撤销还原]
```

### A4 页面边界指示线

当溢出时，在预览区 `#resume-sheet` 的 1123px 位置叠加一条虚线 + "A4 页面边界" 标签，让用户直观看到超出位置。

---

## 工具栏按钮布局

```
[已自动保存] [AI 分析] [智能一页] [导出 PDF]
```

- AI 分析 / 智能一页用 outline 风格按钮（`border border-line`）
- 激活时变为 `border-brand bg-brand-soft text-brand-deep`
- 智能一页按钮在溢出时显示红点提示
- 两个面板互斥：开一个自动关另一个

---

## 实施顺序

### Phase A — 基础设施（不涉及 AI 调用）
1. `analysis-types.ts` 类型定义
2. `use-page-overflow.ts` 溢出检测 hook
3. `store.ts` 快照状态 + partialize
4. `editor/page.tsx` 工具栏按钮 + 状态 + 面板插槽 + A4 边界线

### Phase B — AI 分析
5. `ai.ts` 新增 SYSTEM_ANALYZE / SYSTEM_JD_ANALYZE
6. `api/analyze/route.ts` 接口
7. `use-analysis.ts` hook
8. `ai-analysis-panel.tsx` 面板
9. `editor/page.tsx` 接入面板

### Phase C — 智能一页
10. `ai.ts` 新增 SYSTEM_CONDENSE
11. `api/condense/route.ts` 接口
12. `one-page.ts` 压缩编排
13. `smart-one-page-panel.tsx` 面板
14. `editor/page.tsx` 接入面板

---

## 验证方式

1. TypeScript 编译通过 (`npx tsc --noEmit`)
2. 启动 dev server，打开编辑器页面
3. AI 分析：点击按钮 → 面板展开 → 通用分析返回评分 → 切 JD 模式粘贴文本分析
4. 智能一页：填充足够多的内容使简历超一页 → 红点出现 + A4 边界线显示 → 点击压缩 → 观察两阶段执行 → 验证撤销还原
5. 两个面板互斥切换正常
6. 导出 PDF 功能不受影响
