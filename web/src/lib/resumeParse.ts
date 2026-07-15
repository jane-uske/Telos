"use client";

// 简历纯文本 → 结构化经历段的本地确定性解析（基础模式用，不调用任何 AI）。
// 原则：只做切分与归组，不改写、不补全、不编造——切出来什么就是什么。

import type { ImportSegment } from "./types";

const SECTION_RE = /^(工作经历|工作经验|项目经历|项目经验|实习经历|实习经验|开源经历|个人项目|教育经历|教育背景|技能|专业技能|自我评价|荣誉|证书)\s*[:：]?$/;
const STOP_SECTION_RE = /^(教育经历|教育背景|技能|专业技能|自我评价|荣誉|证书)/;
const BULLET_RE = /^[-·•*●▪◦～>]\s*/;
// 「公司｜职位｜时间」或「公司 | 职位 | 2020.07-2022.05」类行
const PERIOD_RE = /(\d{4}[./年]\d{1,2}|\d{4})\s*[-–—~至到]+\s*(\d{4}[./年]\d{1,2}|\d{4}|至今|现在|now|present)/i;

interface Entry {
  head: string;
  period: string;
  bullets: string[];
}

function splitHead(head: string): { company: string; title: string } {
  const parts = head.split(/[｜|]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return { company: parts[0], title: parts.slice(1).join(" · ") };
  return { company: head.trim(), title: head.trim() };
}

/** 确定性解析：识别小节标题 / 条目头（含时间段的行）/ 弹点行 */
export function parseResumeText(raw: string): ImportSegment[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const entries: Entry[] = [];
  let cur: Entry | null = null;
  let inStopSection = false;

  for (const line of lines) {
    if (SECTION_RE.test(line)) {
      inStopSection = STOP_SECTION_RE.test(line);
      cur = null;
      continue;
    }
    if (inStopSection) continue;
    const isBullet = BULLET_RE.test(line);
    const hasPeriod = PERIOD_RE.test(line);
    if (!isBullet && (hasPeriod || /[｜|]/.test(line)) && line.length <= 60) {
      // 新条目头
      const m = line.match(PERIOD_RE);
      const period = m ? m[0] : "";
      const head = line.replace(PERIOD_RE, "").replace(/[｜|]\s*$/, "").trim();
      cur = { head: head || line, period, bullets: [] };
      entries.push(cur);
      continue;
    }
    if (isBullet && cur) {
      cur.bullets.push(line.replace(BULLET_RE, "").trim());
      continue;
    }
    if (isBullet && !cur) {
      cur = { head: "未命名经历", period: "", bullets: [line.replace(BULLET_RE, "").trim()] };
      entries.push(cur);
    }
  }

  const segs: ImportSegment[] = entries
    .filter((e) => e.bullets.length || e.period)
    .map((e) => {
      const { company, title } = splitHead(e.head);
      return {
        title: title || company || "未命名经历",
        company: company || "待补充",
        period: e.period || "时间待补充",
        bullets: e.bullets,
      };
    });

  // 兜底：完全没识别出条目时，按空行分块，避免用户粘贴后毫无结果
  if (!segs.length) {
    const blocks = raw
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter((b) => b.length > 20)
      .slice(0, 6);
    return blocks.map((b, i) => {
      const ls = b.split(/\n/).map((l) => l.trim()).filter(Boolean);
      return {
        title: ls[0].slice(0, 30) || "段落 " + (i + 1),
        company: "待补充",
        period: "时间待补充",
        bullets: ls.slice(1, 6),
      };
    });
  }
  return segs;
}
