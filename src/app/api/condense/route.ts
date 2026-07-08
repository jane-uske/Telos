import { generateText } from "ai";
import { getModel, hasApiKey, SYSTEM_CONDENSE } from "@/lib/ai";

export async function POST(req: Request) {
  if (!hasApiKey()) {
    return Response.json(
      { error: "未配置 ANTHROPIC_API_KEY,请在 .env.local 设置后重启服务。" },
      { status: 503 },
    );
  }

  const { resume } = await req.json();
  if (!resume) {
    return Response.json({ error: "缺少 resume" }, { status: 400 });
  }

  const { text } = await generateText({
    model: getModel(),
    system: SYSTEM_CONDENSE,
    prompt: `请精简以下简历:\n${JSON.stringify(resume)}`,
  });

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("未能解析 AI 返回内容");
    const result = JSON.parse(match[0]);
    return Response.json({ resume: result });
  } catch {
    return Response.json({ error: "AI 返回格式异常,请重试" }, { status: 500 });
  }
}
