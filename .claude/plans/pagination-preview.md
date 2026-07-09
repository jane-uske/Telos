# 简历真实分页预览

## Context

当前简历预览是一张无限长的"纸"，超出 A4 时只画一条虚线。用户无法看到导出后每页的真实效果，内容可能在尴尬位置被截断。需要改为多张 A4 纸堆叠的真实分页预览。

## 方案

**CSS Clip/Offset** — 保留 ResumePreview 不变（10 个模板零修改），新建一个 `PaginatedPreview` 包装组件，把一份连续内容"切"成多页显示。

### 工作原理

1. 渲染一份 `ResumePreview`（隐藏，用于测量总高度）
2. 计算页数：`Math.ceil(sheetHeight / A4_HEIGHT)`
3. 为每页创建一个 794×1123px 的 `.sheet` 容器（白纸 + 阴影），`overflow: hidden`
4. 每个容器内放置内容，用 `translateY(-pageIndex * A4_HEIGHT)` 偏移到对应位置
5. 页与页之间留 32px 间距，每页右下角显示页码

### 文件清单

| 文件 | 改动 |
|---|---|
| `src/lib/use-page-overflow.ts` | 导出 `A4_HEIGHT` 常量；改为接收 ref 参数 |
| `src/components/paginated-preview.tsx` | **新建** — 测量内容高度，渲染 N 个分页帧 |
| `src/app/editor/page.tsx` | 用 `PaginatedPreview` 替换直接渲染的 `ResumePreview` + 删除虚线溢出标记 |
| `src/app/globals.css` | 添加 `.page-frame` 样式 |
| `src/components/resume-preview.tsx` | **不改** |

### PaginatedPreview 结构

```
<div> <!-- 外层容器 -->
  <!-- 隐藏测量层：绝对定位 + visibility:hidden -->
  <div style="position:absolute; visibility:hidden; width:794px">
    <ResumePreview id="resume-sheet" />  <!-- 用于测量 + usePageOverflow -->
  </div>

  <!-- 可见分页栈：垂直排列，页间 32px 间距 -->
  <div style="display:flex; flex-direction:column; gap:32px; align-items:center">
    {pages.map(i => (
      <div class="sheet page-frame" style="width:794px; height:1123px; overflow:hidden; position:relative">
        <div style="transform: translateY(-i * 1123px)">
          <ResumePreview />  <!-- 每页各渲染一份，偏移不同 -->
        </div>
        <span>第 i+1/pageCount 页</span>  <!-- 页码 -->
      </div>
    ))}
  </div>
</div>
```

每页渲染一份 ResumePreview（纯展示组件无副作用，开销可接受）。

### 验证

1. 编辑器添加足够多的经历使内容超过一页 → 预览区应显示两张分开的纸
2. 删除内容使简历回到一页内 → 只显示一张纸
3. 切换不同模板 → 分页正常跟随
4. "智能一页"功能仍正常工作（#resume-sheet 在隐藏测量层中）
5. 导出 PDF 正常
