/**
 * 查兌換碼還剩幾點。
 *
 * 輸入兌換碼時用來確認碼是真的，換裝置後也用這支把餘額接回來。
 * 這裡不扣點：真正的扣款發生在起卦的時候（見 /api/divination）。
 */

import { NextResponse } from "next/server";

import { isRedeemCodeShaped, normalizeRedeemCode } from "@/lib/divination-credits";
import { getCreditBalance } from "@/server/credit-codes";

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
  const code = normalizeRedeemCode(typeof raw.code === "string" ? raw.code : "");

  if (!isRedeemCodeShaped(code)) {
    return NextResponse.json({ error: "兌換碼格式不對，請對照信件再輸入一次。" }, { status: 400 });
  }

  const result = await getCreditBalance(code);
  if (!result.ok) {
    return result.reason === "not-found"
      ? NextResponse.json({ error: "找不到這組兌換碼。" }, { status: 404 })
      : NextResponse.json({ error: "暫時查不到點數，請稍後再試。" }, { status: 502 });
  }

  return NextResponse.json({
    code: result.balance.code,
    credits: result.balance.credits,
    remaining: result.balance.remaining,
  });
}
