import { z } from "zod";

export const generalAnalysisSchema = z.object({
  overall: z.number().describe("综合评分 0-100"),
  dimensions: z
    .array(
      z.object({
        name: z.string().describe("维度名称，固定为：内容完整度 / 量化表达 / 结构清晰度 / 关键词密度 / 整体印象"),
        score: z.number().describe("该维度得分 0-100"),
        advice: z
          .string()
          .describe("针对该维度的具体改进建议，1-2句，必须指出简历中的具体位置或内容"),
      }),
    )
    .describe("5个评分维度，顺序固定"),
  highlights: z.array(z.string()).describe("简历的2-3个亮点"),
  improvements: z
    .array(z.string())
    .describe("3-5条可直接执行的改进建议，具体到简历中的哪段经历、哪个模块"),
});

export const jdAnalysisSchema = z.object({
  matchScore: z.number().describe("JD匹配度 0-100"),
  keywords: z
    .array(
      z.object({
        term: z.string().describe("从JD中提取的关键技能/能力词"),
        hit: z.boolean().describe("简历中是否体现了该能力"),
        context: z
          .string()
          .describe("命中时说明在简历哪个部分体现了该能力；未命中则留空字符串"),
      }),
    )
    .describe("从JD中提取的8-15个最关键的技能词及匹配情况"),
  missing: z
    .array(z.string())
    .describe("JD要求但简历未体现的关键能力，每条说明该能力在JD中的重要程度"),
  suggestions: z
    .array(z.string())
    .describe("3-5条针对该JD的具体修改建议，指明修改简历的具体位置"),
});

export type GeneralAnalysis = z.infer<typeof generalAnalysisSchema>;
export type JdAnalysis = z.infer<typeof jdAnalysisSchema>;
