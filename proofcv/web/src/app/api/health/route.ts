// 部署健康检查：不依赖 AI、Chrome 或任何私有环境变量。
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { ok: true, app: "roleready", ts: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
