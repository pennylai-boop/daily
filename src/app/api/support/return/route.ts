/**
 * PAYUNi 前景返回（ReturnURL）：付款頁結束後把使用者 form post 回這裡。
 *
 * 這裡只負責把結果整理成 query string 導去 /support/result 顯示；
 * 真正的入帳與感謝信以 NotifyURL 為準。
 */

import { NextResponse } from "next/server";

import { parsePayuniCallback, payuniConfig } from "@/server/payuni";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = payuniConfig();
  const target = new URL("/support/result", new URL(request.url).origin);

  if (!config) {
    target.searchParams.set("status", "unconfigured");
    return NextResponse.redirect(target, 303);
  }

  const form = await request.formData();
  const callback = parsePayuniCallback(form, config);

  if (!callback) {
    target.searchParams.set("status", "invalid");
    return NextResponse.redirect(target, 303);
  }

  target.searchParams.set("status", callback.status);
  target.searchParams.set("tradeStatus", callback.tradeStatus);
  target.searchParams.set("paymentType", callback.paymentType);
  target.searchParams.set("amount", String(callback.tradeAmt));
  target.searchParams.set("no", callback.merTradeNo);
  if (callback.message) target.searchParams.set("message", callback.message);
  if (callback.payNo) target.searchParams.set("payNo", callback.payNo);
  if (callback.bankType) target.searchParams.set("bankType", callback.bankType);
  if (callback.expireDate) target.searchParams.set("expireDate", callback.expireDate);

  return NextResponse.redirect(target, 303);
}

/** 有些支付工具會用 GET 帶使用者回來，導回結果頁避免看到 405。 */
export async function GET(request: Request) {
  const target = new URL("/support/result", new URL(request.url).origin);
  target.searchParams.set("status", "unknown");
  return NextResponse.redirect(target, 303);
}
