import { generateText } from "ai";
import { getModel, hasApiKey, SYSTEM_ANALYZE, SYSTEM_JD_ANALYZE } from "@/lib/ai";

export async function POST(req: Request) {
  if (!hasApiKey()) {
    return Response.json(
      { error: "未配置 ANTHROPIC_API_KEY,请在 .env.local 设置后重启服务。" },
      { status: 503 },
    );
  }

  const { resume, jd } = await req.json();
  if (!resume) {
    return Response.json({ error: "缺少 resume" }, { status: 400 });
  }

  const isJd = Boolean(jd?.trim());
  const system = isJd ? SYSTEM_JD_ANALYZE : SYSTEM_ANALYZE;
  const prompt = isJd
    ? `简历:\n${JSON.stringify(resume)}\n\n目标职位 JD:\n${jd}`
    : `简历:\n${JSON.stringify(resume)}`;

  const { text } = await generateText({
    model: getModel(),
    system,
    prompt,
  });

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("未能解析 AI 返回内容");
    const result = JSON.parse(match[0]);
    return Response.json(result);
  } catch {
    return Response.json({ error: "AI 返回格式异常,请重试" }, { status: 500 });
  }
}
