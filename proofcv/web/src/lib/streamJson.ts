"use client";

// 流式 AI 输出的增量解析：从仍在增长的文本缓冲里提取「顶层 JSON 数组中已完整闭合的元素」。
// 简历拆解等长输出用它做逐卡浮现——每闭合一个 {...} 就能立刻上屏，不必等整个数组输出完。
// 每次全量重扫缓冲（简历规模 <20KB，开销可忽略），换取实现简单可靠；坏元素跳过不阻塞后续。

export function extractTopLevelArrayItems(buffer: string): unknown[] {
  const start = buffer.indexOf("[");
  if (start < 0) return [];
  const items: unknown[] = [];
  let depth = 0;
  let inStr = false;
  let esc = false;
  let itemStart = -1;
  for (let i = start; i < buffer.length; i++) {
    const c = buffer[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (inStr) {
      if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{" || c === "[") {
      if (depth === 1 && itemStart < 0) itemStart = i;
      depth++;
    } else if (c === "}" || c === "]") {
      depth--;
      if (depth === 1 && itemStart >= 0) {
        try {
          items.push(JSON.parse(buffer.slice(itemStart, i + 1)));
        } catch {
          // 单个元素坏了跳过，别拖累已解析出的其它元素
        }
        itemStart = -1;
      }
      if (depth === 0) break; // 顶层数组已闭合
    }
  }
  return items;
}
