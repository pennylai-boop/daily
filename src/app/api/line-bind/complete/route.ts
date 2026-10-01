/**
 * 在 LINE 群組裡開啟 LIFF 後，把 liff.getContext() 拿到的 groupId／roomId
 * 綁成網頁帳號的常傳對象（line_share_targets.line_group_id）。
 */

import { NextResponse } from "next/server";

import { verifyLinePickToken } from "@/server/line-pick";
import { lineBoundReturnUrl, recordLineGroupBind } from "@/server/line-push";

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
  const chatId = typeof raw.chatId === "string" ? raw.chatId.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "連線已過期，請回到網頁再按一次。" }, { status: 401 });
  }
  if (!chatId) {
    return NextResponse.json(
      { error: "沒有拿到群組資訊，請確認是在 LINE 群組裡開啟這個連結。", returnUrl: lineBoundReturnUrl("0") },
      { status: 400 },
    );
  }

  const userId = verifyLinePickToken(token);
  if (!userId) {
    return NextResponse.json({ error: "連線已過期，請回到網頁再按一次。" }, { status: 401 });
  }

  try {
    const target = await recordLineGroupBind(userId, chatId);
    return NextResponse.json({ ok: true, target, returnUrl: lineBoundReturnUrl("1") });
  } catch (error) {
    console.error("[line-bind] complete", error);
    return NextResponse.json({ error: "綁定失敗，請稍後再試。" }, { status: 500 });
  }
}
