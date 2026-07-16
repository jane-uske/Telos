"use client";

// Agent 本地工具（在用户浏览器里执行，不出设备）。设计原则：
// - 工具只读经历库或写「草稿」，绝不直接修改用户已确认的内容
// - 每次调用都产生一条给用户看的透明记录（note），随聊天气泡展示

import type { AgentTool } from "./ai";
import type { Evidence } from "./types";

/** 查经历库：面试官/访谈官追问前核实「这个说法有没有经历支撑」 */
export function searchEvidenceTool(getEvidence: () => Evidence[]): AgentTool {
  return {
    name: "search_evidence",
    description:
      "在候选人的职业经历库中按关键词检索。用于在追问前核实：候选人的某个说法有没有已确认的经历支撑、经历的具体内容与确认状态。没有经历支撑的说法应该深挖细节。",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "检索关键词：技能名、项目名、或候选人说法里的关键名词" },
      },
      required: ["query"],
    },
    run: (input) => {
      const q = String(input.query || "").trim().toLowerCase();
      const hits = q
        ? getEvidence().filter((e) =>
            [e.title, e.project, e.background, ...e.skills, ...e.actions, ...e.results]
              .join(" ")
              .toLowerCase()
              .includes(q)
          )
        : [];
      const statusZh = (s: Evidence["status"]) =>
        s === "confirmed" ? "已确认" : s === "pending" ? "待确认" : "细节不足";
      const result = hits.length
        ? hits
            .map(
              (e) =>
                "【" + e.title + "】状态：" + statusZh(e.status) + "；成果：" + (e.results.join("、") || "—") +
                (e.note ? "；备注：" + e.note : "")
            )
            .join("\n")
        : "经历库中没有命中该关键词的经历。";
      return {
        result,
        note: "查经历库「" + String(input.query || "") + "」→ " + (hits.length ? "命中 " + hits.length + " 条" : "无命中"),
      };
    },
  };
}

const DRAFT_FIELDS = ["background", "responsibilities", "actions", "challenges", "results", "skills"] as const;
type DraftField = (typeof DRAFT_FIELDS)[number];
const FIELD_ZH: Record<DraftField, string> = {
  background: "背景",
  responsibilities: "职责",
  actions: "关键行动",
  challenges: "难点",
  results: "结果",
  skills: "技能",
};

/** 起草经历卡：访谈中实时沉淀草稿，最终由用户确认后才入库 */
export function draftEvidenceTool(onDraft: (d: Partial<Evidence>) => void): AgentTool {
  return {
    name: "draft_evidence_card",
    description:
      "把访谈中候选人已经说清楚的内容实时沉淀为经历卡草稿。只允许记录候选人原话中明确说过的事实，严禁推断、补全或美化任何数字与成果。可多次调用，每次只传新问清楚的字段。草稿最终由候选人本人确认后才会写入经历库。",
    input_schema: {
      type: "object",
      properties: {
        background: { type: "string", description: "项目背景与目标（候选人原话整理）" },
        responsibilities: { type: "array", items: { type: "string" }, description: "候选人个人实际负责的部分" },
        actions: { type: "array", items: { type: "string" }, description: "关键行动" },
        challenges: { type: "array", items: { type: "string" }, description: "技术/业务难点" },
        results: { type: "array", items: { type: "string" }, description: "可量化结果（必须是候选人明确说过的数字）" },
        skills: { type: "array", items: { type: "string" }, description: "体现出的技能" },
      },
    },
    run: (input) => {
      const d: Partial<Evidence> = {};
      const touched: string[] = [];
      for (const f of DRAFT_FIELDS) {
        const v = input[f];
        if (f === "background") {
          if (typeof v === "string" && v.trim()) {
            d.background = v.trim();
            touched.push(FIELD_ZH[f]);
          }
        } else if (Array.isArray(v)) {
          const arr = v.filter((x): x is string => typeof x === "string" && !!x.trim());
          if (arr.length) {
            d[f] = arr;
            touched.push(FIELD_ZH[f]);
          }
        }
      }
      if (!touched.length) return { result: "没有可记录的字段。", note: "起草经历卡 → 未更新任何字段" };
      onDraft(d);
      return {
        result: "草稿已更新（" + touched.join("/") + "）。草稿会在访谈结束后由候选人确认。",
        note: "起草经历卡草稿 → 更新了 " + touched.join("/"),
      };
    },
  };
}
