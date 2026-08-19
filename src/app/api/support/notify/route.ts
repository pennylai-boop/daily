/**
 * PAYUNi 背景通知（NotifyURL）：交易結果的唯一可信來源。
 *
 * 收到付款成功才呼叫 SmilePay 開立發票，開過的訂單不會重複開
 * （SmilePay 也會用 data_id 擋同期別重複開立）。
 */

import { isPaid, parsePayuniCallback, payuniConfig } from "@/server/payuni";
import { issueInvoice, isSmilepayConfigured } from "@/server/smilepay-invoice";
import { getOrder, updateOrder } from "@/server/support-orders";

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
    // 訂單不在暫存裡（伺服器重啟或多實例），款項仍在 PAYUNi 後台，只是發票要手動補開。
    console.warn(`[support] 查無訂單 ${callback.merTradeNo}，跳過開票。`);
    return new Response("OK");
  }

  if (!isPaid(callback)) {
    updateOrder(order.merTradeNo, {
      status: callback.tradeStatus === "0" ? "awaiting_payment" : "failed",
      tradeNo: callback.tradeNo,
    });
    return new Response("OK");
  }

  // 金額必須跟建立訂單時一致，否則不開票，留給人工確認。
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

  if (!paid || paid.invoiceNumber) return new Response("OK");

  if (!isSmilepayConfigured()) {
    console.warn(`[support] 訂單 ${paid.merTradeNo} 已付款，但尚未設定 SmilePay，未開立發票。`);
    return new Response("OK");
  }

  const invoice = await issueInvoice({
    orderNo: paid.merTradeNo,
    amount: paid.amount,
    kind: paid.invoiceKind,
    name: paid.name,
    email: paid.email,
    carrierId: paid.carrierId,
    loveCode: paid.loveCode,
    taxId: paid.taxId,
    companyName: paid.companyName,
  });

  updateOrder(paid.merTradeNo, {
    invoiceNumber: invoice.ok ? invoice.invoiceNumber : undefined,
    invoiceError: invoice.ok ? undefined : `${invoice.status} ${invoice.message}`.trim(),
  });

  return new Response("OK");
}
