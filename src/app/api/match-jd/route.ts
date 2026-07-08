import { generateText } from "ai";
import { getModel, hasApiKey, SYSTEM_KEYWORDS } from "@/lib/ai";

interface MatchBody {
  jd?: string;
  resume?: unknown;
}

/** 从 JD 抽取关键词,再与简历文本比对,返回命中情况 */
export async function POST(req: Request) {
  if (!hasApiKey()) {
    return Response.json(
      { error: "未配置 ANTHROPIC_API_KEY,请在 .env.local 设置后重启服务。" },
      { status: 503 },
    );
  }

  const { jd, resume } = (await req.json()) as MatchBody;
  if (!jd?.trim()) {
    return Response.json({ error: "缺少 jd" }, { status: 400 });
  }

  const { text } = await generateText({
    model: getModel(),
    system: SYSTEM_KEYWORDS,
    prompt: jd,
  });

  let keywords: string[] = [];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    keywords = match ? (JSON.parse(match[0]) as string[]) : [];
  } catch {
    keywords = [];
  }

  const resumeText = JSON.stringify(resume ?? "").toLowerCase();
  const result = keywords.map((term) => ({
    term,
    hit: resumeText.includes(term.toLowerCase()),
  }));

  return Response.json({ keywords: result });
}
