import { streamObject } from "ai";
import { getModel, hasApiKey } from "@/lib/ai";
import { importResumeSchema } from "@/lib/import-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_IMPORT = `你是简历结构化助手。用户会粘贴一份 Markdown 或纯文本简历。
请把它拆解到给定的结构化字段里：
- 忠实提取原文信息，不要杜撰内容；原文没有的字段留空字符串 / 空数组。
- 经历/项目的亮点拆成一条条 bullet；保留量化数据。
- 可用 <strong> 标签加粗关键成果，其余不加多余 HTML。
- 中文简历保持中文。`;

/** 把粘贴的 Markdown/文本流式结构化成简历对象（供前端边收边填表单）。 */
export async function POST(req: Request) {
  if (!hasApiKey()) {
    return Response.json(
      { error: "未配置 ANTHROPIC_API_KEY,请在 .env.local 设置后重启服务。" },
      { status: 503 },
    );
  }
  const { text } = (await req.json()) as { text?: string };
  if (!text?.trim()) {
    return Response.json({ error: "缺少简历文本" }, { status: 400 });
  }

  const result = streamObject({
    model: getModel(),
    schema: importResumeSchema,
    system: SYSTEM_IMPORT,
    prompt: `请结构化下面这份简历：\n\n${text}`,
  });

  return result.toTextStreamResponse();
}
