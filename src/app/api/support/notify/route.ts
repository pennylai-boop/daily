/**
 * PAYUNi 背景通知（NotifyURL）：交易結果的唯一可信來源。
 *
 * 收到付款成功後寄感謝信；已寄過的訂單不會重複寄。
 */

import { isPaid, parsePayuniCallback, payuniConfig } from "@/server/payuni";
import { getOrder, updateOrder } from "@/server/support-orders";
import { sendSponsorThankYou } from "@/server/thank-you-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = payuniConfig();
  if (!config) return new Response("unconfigured", { status: 503 });

  const form = await request.formData();
  const callback = parsePayuniCallback(form, config);
  if (!callback) return new Response("invalid", { status: 400 });

  const order = getOrder(callback.merTradeNo);
  if (!order) {
    // 訂單不在暫存裡（伺服器重啟或多實例），款項仍在 PAYUNi 後台，只是感謝信要手動補寄。
    console.warn(`[support] 查無訂單 ${callback.merTradeNo}，跳過感謝信。`);
    return new Response("OK");
  }

  if (!isPaid(callback)) {
    updateOrder(order.merTradeNo, {
      status: callback.tradeStatus === "0" ? "awaiting_payment" : "failed",
      tradeNo: callback.tradeNo,
    });
    return new Response("OK");
  }

  // 金額必須跟建立訂單時一致，否則不寄信，留給人工確認。
  if (callback.tradeAmt !== order.amount) {
    console.error(
      `[support] 訂單 ${order.merTradeNo} 金額不符：建立 ${order.amount}、回傳 ${callback.tradeAmt}。`,
    );
    updateOrder(order.merTradeNo, { status: "failed", tradeNo: callback.tradeNo });
    return new Response("OK");
  }

  const paid = updateOrder(order.merTradeNo, {
    status: "paid",
    tradeNo: callback.tradeNo,
    paidAt: Date.now(),
  });

  if (!paid || paid.thankYouSentAt) return new Response("OK");

  const thankYou = await sendSponsorThankYou({
    email: paid.email,
    name: paid.name,
    amount: paid.amount,
    merTradeNo: paid.merTradeNo,
  });

  updateOrder(paid.merTradeNo, {
    thankYouSentAt: thankYou.ok ? Date.now() : undefined,
    thankYouError: thankYou.ok ? undefined : thankYou.message,
  });

  return new Response("OK");
}
