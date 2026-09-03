import { NextResponse } from "next/server";

import { linePickReturnUrl, recordLinePick, verifyLinePickToken } from "@/server/line-pick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const token = typeof raw.token === "string" ? raw.token.trim() : "";
  const status = raw.status === "success" || raw.status === "cancelled" || raw.status === "unavailable"
    ? raw.status
    : "";
  if (!token || !status) {
    return NextResponse.json({ error: "缺少選人結果。" }, { status: 400 });
  }

  const userId = verifyLinePickToken(token);
  if (!userId) {
    return NextResponse.json({ error: "連線已過期，請回到網頁再按一次新增。" }, { status: 401 });
  }

  try {
    if (status !== "success") {
      return NextResponse.json({ ok: true, returnUrl: linePickReturnUrl("0") });
    }
    const target = await recordLinePick(userId);
    return NextResponse.json({ ok: true, target, returnUrl: linePickReturnUrl("1") });
  } catch (error) {
    console.error("[line-pick] complete", error);
    return NextResponse.json({ error: "寫回帳號失敗。" }, { status: 500 });
  }
}
