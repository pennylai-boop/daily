/**
 * PAYUNi 背景通知（NotifyURL）：交易結果的唯一可信來源。
 *
 * 贊助訂單付款成功後寄感謝信；購買點數的訂單則發一組兌換碼並寄出。
 * 兩種都只寄一次，已寄過的訂單不會重複寄。
 */

import { ADFREE_PRODUCT_NAME } from "@/lib/adfree";
import { CREDIT_PRODUCT_NAME } from "@/lib/divination-credits";
import { createInvoiceInput } from "@/lib/invoice";
import { issueCreditCode } from "@/server/credit-codes";
import { extendAdFree, getAdFreeUntil } from "@/server/adfree";
import { isPaid, parsePayuniCallback, payuniConfig } from "@/server/payuni";
import { issueInvoice } from "@/server/smilepay-invoice";
import { getOrder, updateOrder, type SponsorOrder } from "@/server/support-orders";
import { sendAdFreeReceipt, sendCreditCode, sendSponsorThankYou } from "@/server/thank-you-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = payuniConfig();
  if (!config) return new Response("unconfigured", { status: 503 });

  const form = await request.formData();
  const callback = parsePayuniCallback(form, config);
  if (!callback) return new Response("invalid", { status: 400 });

  const order = await getOrder(callback.merTradeNo);
  if (!order) {
    // 訂單不在資料庫裡（理論上不該發生；若真的查無此單，款項仍在 PAYUNi 後台，只是感謝信要手動補寄）。
    console.warn(`[support] 查無訂單 ${callback.merTradeNo}，跳過感謝信。`);
    return new Response("OK");
  }

  if (!isPaid(callback)) {
    await updateOrder(order.merTradeNo, {
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
    await updateOrder(order.merTradeNo, { status: "failed", tradeNo: callback.tradeNo });
    return new Response("OK");
  }

  const paid = await updateOrder(order.merTradeNo, {
    status: "paid",
    tradeNo: callback.tradeNo,
    paidAt: Date.now(),
  });

  if (!paid) return new Response("OK");

  // 開票和寄信各自獨立：其中一邊失敗不該讓另一邊也不做，重送 Notify 時也只補做沒完成的那一邊。
  if (paid.product === "credits" || paid.product === "adfree") await issueOrderInvoice(paid);

  if (paid.product === "adfree") {
    const granted = await grantAdFree(paid);
    if (!granted.ok) {
      await updateOrder(paid.merTradeNo, { thankYouError: granted.message });
      return new Response("OK");
    }
  }

  if (paid.thankYouSentAt) return new Response("OK");

  const mail =
    paid.product === "credits"
      ? await deliverCreditCode(paid)
      : paid.product === "adfree"
        ? await deliverAdFree(paid)
        : await deliverThankYou(paid);

  await updateOrder(paid.merTradeNo, {
    thankYouSentAt: mail.ok ? Date.now() : undefined,
    thankYouError: mail.ok ? undefined : mail.message,
  });

  return new Response("OK");
}

/**
 * 開發票。已經開過的訂單不會重複開。
 *
 * 開票失敗只記在訂單上，不影響點數入帳：錢收了、點數要給，發票晚一點補開。
 * `invoice_error` 有值的訂單就是要人工處理的清單（migration 有建對應的索引）。
 */
async function issueOrderInvoice(order: SponsorOrder) {
  if (order.invoiceNumber) return;

  const description =
    order.product === "adfree"
      ? `${ADFREE_PRODUCT_NAME} 1 個月`
      : `${CREDIT_PRODUCT_NAME} ${order.credits} 點`;

  const result = await issueInvoice({
    merTradeNo: order.merTradeNo,
    amount: order.amount,
    description,
    email: order.email,
    invoice: order.invoice ?? createInvoiceInput(),
  });

  if (!result.ok) {
    console.error(`[support] 訂單 ${order.merTradeNo} 開立發票失敗：${result.message}`);
    await updateOrder(order.merTradeNo, { invoiceError: result.message });
    return;
  }

  await updateOrder(order.merTradeNo, {
    invoiceNumber: result.invoiceNumber,
    invoiceIssuedAt: Date.now(),
    invoiceError: undefined,
  });
}

async function grantAdFree(order: SponsorOrder): Promise<{ ok: true } | { ok: false; message: string }> {
  if (order.entitlementAppliedAt) return { ok: true };
  if (!order.userId) {
    return { ok: false, message: `訂單 ${order.merTradeNo} 沒有綁定使用者，無法開啟無廣告。` };
  }
  const until = await extendAdFree(order.userId, order.email);
  if (!until) {
    return { ok: false, message: `訂單 ${order.merTradeNo} 延長無廣告效期失敗。` };
  }
  await updateOrder(order.merTradeNo, { entitlementAppliedAt: Date.now() });
  return { ok: true };
}

async function deliverAdFree(order: SponsorOrder) {
  if (!order.userId) {
    return { ok: false as const, message: `訂單 ${order.merTradeNo} 沒有綁定使用者。` };
  }
  const until = await getAdFreeUntil(order.userId);
  return sendAdFreeReceipt({
    email: order.email,
    name: order.name,
    amount: order.amount,
    merTradeNo: order.merTradeNo,
    until,
  });
}

function deliverThankYou(order: SponsorOrder) {
  return sendSponsorThankYou({
    email: order.email,
    name: order.name,
    amount: order.amount,
    merTradeNo: order.merTradeNo,
  });
}

/**
 * 發碼再寄信。
 *
 * 發碼失敗就不寄信，也不要把 thankYouSentAt 填上：這樣人工重送 Notify 時會再試一次，
 * 而 issueCreditCode 對同一筆訂單只會發一組碼，重試不會多給點數。
 */
async function deliverCreditCode(order: SponsorOrder) {
  const issued = await issueCreditCode({
    merTradeNo: order.merTradeNo,
    credits: order.credits,
    email: order.email,
  });

  if (!issued) {
    return { ok: false as const, message: `訂單 ${order.merTradeNo} 發兌換碼失敗。` };
  }

  return sendCreditCode({
    email: order.email,
    name: order.name,
    credits: order.credits,
    amount: order.amount,
    code: issued.code,
    merTradeNo: order.merTradeNo,
  });
}
