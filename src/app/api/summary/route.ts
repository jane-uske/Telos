import { streamText } from "ai";
import { getModel, hasApiKey, SYSTEM_SUMMARY } from "@/lib/ai";

/** 根据经历生成个人简介,流式返回纯文本 */
export async function POST(req: Request) {
  if (!hasApiKey()) {
    return Response.json(
      { error: "未配置 ANTHROPIC_API_KEY,请在 .env.local 设置后重启服务。" },
      { status: 503 },
    );
  }

  const { experiences, headline } = (await req.json()) as {
    experiences?: string;
    headline?: string;
  };

  const result = streamText({
    model: getModel(),
    system: SYSTEM_SUMMARY,
    prompt: `定位:${headline ?? "(未填)"}\n\n工作经历要点:\n${experiences ?? "(未填)"}`,
  });

  return result.toTextStreamResponse();
}
