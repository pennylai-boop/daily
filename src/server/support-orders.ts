/**
 * 贊助訂單暫存。
 *
 * 感謝信需要贊助者信箱，但這份資料不能交給瀏覽器保管（否則有人改金額），
 * PAYUNi 的回傳也只帶訂單編號，因此建立訂單時先把表單內容留在伺服器端，
 * 等 Notify 回來再依 MerTradeNo 取出寄信。
 *
 * 目前是行程內的 Map：單一實例可用，重啟或 Cloud Run 擴出第二個實例就會查不到訂單
 * （後果是感謝信沒寄，款項仍在 PAYUNi 後台看得到）。接上 Supabase 後
 * 只要換掉這個檔案的實作，其他呼叫端不用動。
 */

import type { SponsorInput, SponsorMethod } from "@/lib/support";

export interface SponsorOrder {
  merTradeNo: string;
  amount: number;
  method: SponsorMethod;
  name: string;
  email: string;
  message: string;
  createdAt: number;
  status: "pending" | "awaiting_payment" | "paid" | "failed";
  tradeNo?: string;
  paidAt?: number;
  thankYouSentAt?: number;
  thankYouError?: string;
}

/** dev 模式的熱更新會重新載入模組，掛在 globalThis 才不會把待付款訂單弄丟。 */
const store: Map<string, SponsorOrder> = ((
  globalThis as { __dailySupportOrders?: Map<string, SponsorOrder> }
).__dailySupportOrders ??= new Map());

/** 超商代碼最長 7 天、ATM 更久，這裡留 30 天再回收。 */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function createOrder(merTradeNo: string, input: SponsorInput): SponsorOrder {
  sweep();

  const order: SponsorOrder = {
    merTradeNo,
    amount: input.amount,
    method: input.method,
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    createdAt: Date.now(),
    status: "pending",
  };

  store.set(merTradeNo, order);
  return order;
}

export function getOrder(merTradeNo: string): SponsorOrder | undefined {
  return store.get(merTradeNo);
}

export function updateOrder(merTradeNo: string, patch: Partial<SponsorOrder>): SponsorOrder | undefined {
  const order = store.get(merTradeNo);
  if (!order) return undefined;

  const next = { ...order, ...patch };
  store.set(merTradeNo, next);
  return next;
}

function sweep() {
  const deadline = Date.now() - TTL_MS;
  for (const [key, order] of store) {
    if (order.createdAt < deadline) store.delete(key);
  }
}
