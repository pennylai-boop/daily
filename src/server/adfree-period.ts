/**
 * PAYUNi 續期收款：每一期授權成功後延長無廣告、開發票、寄收據。
 * 同一期（PeriodOrderNo）只入帳一次。
 */

import { ADFREE_AMOUNT, ADFREE_PRODUCT_NAME } from "@/lib/adfree";
import { createInvoiceInput } from "@/lib/invoice";
import { createSponsorInput } from "@/lib/support";
import { extendAdFree, getAdFreeUntil } from "@/server/adfree";
import { type PeriodCallback } from "@/server/payuni";
import { issueInvoice } from "@/server/smilepay-invoice";
import {
  createOrder,
  getOrder,
  getOrderByPeriodOrderNo,
  updateOrder,
  type SponsorOrder,
} from "@/server/support-orders";
import { sendAdFreeReceipt } from "@/server/thank-you-email";

export async function processAdFreePeriodPayment(callback: PeriodCallback): Promise<void> {
  if (callback.status !== "SUCCESS") {
    console.info(
      `[adfree] 續期授權未成功 mer=${callback.merTradeNo} period=${callback.periodOrderNo} status=${callback.status}`,
    );
    return;
  }

  if (callback.periodOrderNo) {
    const existing = await getOrderByPeriodOrderNo(callback.periodOrderNo);
    if (existing?.entitlementAppliedAt && existing.thankYouSentAt) return;
    if (existing) {
      await fulfillAdFreeOrder(existing, callback);
      return;
    }
  }

  const parent = await getOrder(callback.merTradeNo);
  if (!parent || parent.product !== "adfree") {
    console.warn(`[adfree] 查無無廣告訂單 ${callback.merTradeNo}，跳過續期入帳。`);
    return;
  }

  const charged = callback.authAmt || parent.amount;
  if (charged !== parent.amount && charged !== ADFREE_AMOUNT) {
    console.error(
      `[adfree] 訂單 ${parent.merTradeNo} 金額不符：建立 ${parent.amount}、回傳 ${charged}。`,
    );
    await updateOrder(parent.merTradeNo, { status: "failed", tradeNo: callback.tradeNo });
    return;
  }

  const isFirst =
    callback.thisPeriod <= 1 &&
    (!parent.periodOrderNo || parent.periodOrderNo === callback.periodOrderNo);

  if (isFirst) {
    const paid = await updateOrder(parent.merTradeNo, {
      status: "paid",
      tradeNo: callback.tradeNo,
      paidAt: parent.paidAt ?? Date.now(),
      email: parent.email || callback.payerEmail,
      name: parent.name || callback.payerName,
    });
    if (callback.periodTradeNo || callback.periodOrderNo || callback.thisPeriod) {
      await updateOrder(parent.merTradeNo, {
        periodTradeNo: callback.periodTradeNo || parent.periodTradeNo,
        periodOrderNo: callback.periodOrderNo || parent.periodOrderNo,
        thisPeriod: callback.thisPeriod || parent.thisPeriod || 1,
      });
    }
    const latest = (await getOrder(parent.merTradeNo)) ?? paid;
    if (latest) await fulfillAdFreeOrder(latest, callback);
    return;
  }

  let renewal: SponsorOrder;
  try {
    renewal = await createOrder(
      callback.periodOrderNo || `${parent.merTradeNo}_${callback.thisPeriod || "n"}`,
      {
        ...createSponsorInput(),
        amount: parent.amount,
        method: "credit",
        email: parent.email || callback.payerEmail,
        name: parent.name || callback.payerName,
      },
      {
        product: "adfree",
        credits: 0,
        invoice: parent.invoice,
        userId: parent.userId,
        periodTradeNo: callback.periodTradeNo,
        periodOrderNo: callback.periodOrderNo,
        thisPeriod: callback.thisPeriod,
      },
    );
  } catch (error) {
    const again = callback.periodOrderNo
      ? await getOrderByPeriodOrderNo(callback.periodOrderNo)
      : undefined;
    if (again) {
      await fulfillAdFreeOrder(again, callback);
      return;
    }
    console.error("[adfree] 建立續期訂單失敗：", error);
    await fulfillAdFreeOrder(parent, callback);
    return;
  }

  const paid = await updateOrder(renewal.merTradeNo, {
    status: "paid",
    tradeNo: callback.tradeNo,
    paidAt: Date.now(),
  });
  if (paid) await fulfillAdFreeOrder(paid, callback);
}

async function fulfillAdFreeOrder(order: SponsorOrder, callback: PeriodCallback): Promise<void> {
  const email = order.email || callback.payerEmail;
  const name = order.name || callback.payerName;
  if ((email && email !== order.email) || (name && name !== order.name)) {
    const patched = await updateOrder(order.merTradeNo, { email, name });
    if (patched) order = patched;
  }

  await issueAdFreeInvoice(order, email);
  const granted = await grantAdFree(order, email, callback);
  if (!granted.ok) {
    await updateOrder(order.merTradeNo, { thankYouError: granted.message });
    return;
  }

  if (order.thankYouSentAt) return;

  const mail = await sendAdFreeReceipt({
    email,
    name,
    amount: order.amount,
    merTradeNo: order.merTradeNo,
    until: order.userId ? await getAdFreeUntil(order.userId) : null,
  });

  await updateOrder(order.merTradeNo, {
    thankYouSentAt: mail.ok ? Date.now() : undefined,
    thankYouError: mail.ok ? undefined : mail.message,
  });
}

async function issueAdFreeInvoice(order: SponsorOrder, email: string) {
  if (order.invoiceNumber) return;

  const result = await issueInvoice({
    merTradeNo: order.periodOrderNo || order.merTradeNo,
    amount: order.amount,
    description: `${ADFREE_PRODUCT_NAME} 1 個月`,
    email,
    invoice: order.invoice ?? createInvoiceInput(),
  });

  if (!result.ok) {
    console.error(`[adfree] 訂單 ${order.merTradeNo} 開立發票失敗：${result.message}`);
    await updateOrder(order.merTradeNo, { invoiceError: result.message });
    return;
  }

  await updateOrder(order.merTradeNo, {
    invoiceNumber: result.invoiceNumber,
    invoiceIssuedAt: Date.now(),
    invoiceError: undefined,
  });
}

async function grantAdFree(
  order: SponsorOrder,
  email: string,
  callback: PeriodCallback,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const alreadyThisPeriod =
    Boolean(order.entitlementAppliedAt) &&
    ((order.periodOrderNo && order.periodOrderNo === callback.periodOrderNo) ||
      (!order.periodOrderNo && callback.thisPeriod <= 1));
  if (alreadyThisPeriod) return { ok: true };
  if (!order.userId) {
    return { ok: false, message: `訂單 ${order.merTradeNo} 沒有綁定使用者，無法開啟無廣告。` };
  }
  const until = await extendAdFree(order.userId, email);
  if (!until) {
    return { ok: false, message: `訂單 ${order.merTradeNo} 延長無廣告效期失敗。` };
  }
  await updateOrder(order.merTradeNo, { entitlementAppliedAt: Date.now() });
  return { ok: true };
}
