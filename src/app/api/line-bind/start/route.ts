/**
 * 開始「綁定 LINE 群組（直接推播）」：簽一張綁到網頁帳號的短效憑證，
 * 回傳要在 LINE 群組裡開啟的 LIFF 連結。實際綁定在 /api/line-bind/complete。
 */

import { NextResponse } from "next/server";

import { signLinePickToken } from "@/server/line-pick";
import { lineBindLiffUrl } from "@/server/line-push";
import { requireUser } from "@/server/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const token = signLinePickToken(auth.userId);
    const liffUrl = lineBindLiffUrl(token);
    if (!liffUrl) {
      return NextResponse.json({ error: "這個環境還沒有設定 LIFF。" }, { status: 500 });
    }
    return NextResponse.json({ token, liffUrl });
  } catch (error) {
    console.error("[line-bind] start", error);
    return NextResponse.json({ error: "無法開始綁定。" }, { status: 500 });
  }
}
