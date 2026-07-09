import { generateObject } from "ai";
import { getModel, hasApiKey, cleanResumeForAI, SYSTEM_CONDENSE } from "@/lib/ai";
import { importResumeSchema } from "@/lib/import-schema";

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

  const cleaned = cleanResumeForAI(resume);

  const { object } = await generateObject({
    model: getModel(),
    schema: importResumeSchema,
    system: SYSTEM_CONDENSE,
    prompt: `请精简以下简历:\n${JSON.stringify(cleaned)}`,
  });

  return Response.json({ resume: object });
}
