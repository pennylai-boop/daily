/**
 * PAYUNi 前景返回（ReturnURL）：付款頁結束後把使用者 form post 回這裡。
 *
 * 這裡只負責把結果整理成 query string 導去顯示頁；真正的入帳與寄信以 NotifyURL 為準。
 * 贊助導去 /support/result，買點數導回 /divination（帶訂單編號讓它把點數接回來）。
 */

import { NextResponse } from "next/server";

import { isPaid, parsePayuniCallback, payuniConfig } from "@/server/payuni";
import { getOrder } from "@/server/support-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = payuniConfig();
  // 用 config.siteUrl 當 origin，不要用 request.url 的 origin：部署在 Cloud Run 等反向
  // 代理後面時，Node 收到的 request.url 反映容器內部監聽位址（如 http://0.0.0.0:8080），
  // 不是對外網域，會把使用者導到瀏覽器連不到的網址（ERR_ADDRESS_INVALID）。
  const origin = config?.siteUrl ?? new URL(request.url).origin;
  const target = new URL("/support/result", origin);

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

  // 點數付成功就回卜卦頁；無廣告訂閱回設定頁。沒付成功仍走 /support/result 說明原因。
  if (isPaid(callback)) {
    const order = await getOrder(callback.merTradeNo);
    if (order?.product === "credits") {
      const back = new URL("/divination", origin);
      back.searchParams.set("paid", callback.merTradeNo);
      return NextResponse.redirect(back, 303);
    }
    if (order?.product === "adfree") {
      const back = new URL("/settings", origin);
      back.searchParams.set("adfree", "ok");
      back.hash = "adfree";
      return NextResponse.redirect(back, 303);
    }
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
  const origin = payuniConfig()?.siteUrl ?? new URL(request.url).origin;
  const target = new URL("/support/result", origin);
  target.searchParams.set("status", "unknown");
  return NextResponse.redirect(target, 303);
}
