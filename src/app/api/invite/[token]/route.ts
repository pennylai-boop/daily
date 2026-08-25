import { NextResponse } from "next/server";

import { peekInvite } from "@/server/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 邀請落地頁的預覽：不需要登入，只回傳邀請者名稱與分享範圍，不會接受邀請。 */
export async function GET(_request: Request, ctx: RouteContext<"/api/invite/[token]">) {
  const { token } = await ctx.params;
  const result = await peekInvite(token);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ownerName: result.ownerName, scope: result.scope });
}
