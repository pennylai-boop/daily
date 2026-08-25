/**
 * 付款完成導回站上時，用訂單編號把剛買到的兌換碼與餘額接回這台裝置。
 *
 * 入帳以 Notify 為準，前景返回常常比 Notify 早到，所以查不到碼時回 202 讓前端重試，
 * 而不是當成失敗。
 *
 * 訂單編號等於一次性的領取憑據，所以只在付款後一小段時間內允許領取；
 * 過了就請使用者用信件裡的兌換碼（那組碼本來就是長期憑據）。
 */

import { NextResponse } from "next/server";

import { getCreditBalance, getCreditCodeByOrder } from "@/server/credit-codes";
import { getOrder } from "@/server/support-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLAIM_WINDOW_MS = 30 * 60 * 1000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const merTradeNo = typeof raw.no === "string" ? raw.no.trim().slice(0, 25) : "";
  if (!/^[A-Za-z0-9_-]{6,25}$/.test(merTradeNo)) {
    return NextResponse.json({ error: "訂單編號不正確。" }, { status: 400 });
  }

  const order = await getOrder(merTradeNo);
  if (!order || order.product !== "credits") {
    return NextResponse.json({ error: "找不到這筆點數訂單。" }, { status: 404 });
  }

  if (order.status !== "paid") {
    return NextResponse.json({ pending: true }, { status: 202 });
  }

  if (order.paidAt && Date.now() - order.paidAt > CLAIM_WINDOW_MS) {
    return NextResponse.json(
      { error: "這筆訂單已經過了自動接回的時間，請用信件裡的兌換碼。" },
      { status: 410 },
    );
  }

  const code = await getCreditCodeByOrder(merTradeNo);
  if (!code) {
    return NextResponse.json({ pending: true }, { status: 202 });
  }

  const balance = await getCreditBalance(code);
  if (!balance.ok) {
    return NextResponse.json({ error: "暫時查不到點數，請稍後再試。" }, { status: 502 });
  }

  return NextResponse.json({ code, remaining: balance.balance.remaining });
}
