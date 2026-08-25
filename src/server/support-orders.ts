/**
 * 贊助訂單存取層。
 *
 * 感謝信需要贊助者信箱，但這份資料不能交給瀏覽器保管（否則有人改金額），
 * PAYUNi 的回傳也只帶訂單編號，因此建立訂單時先把表單內容存到伺服器端，
 * 等 Notify 回來再依 MerTradeNo 取出寄信。
 *
 * 存於 Supabase 的 sponsor_orders 表（見 supabase/migrations/20260825120000_sponsor_orders.sql），
 * 任何 Cloud Run 實例都能查到同一筆訂單，不會因重啟或多實例部署遺失待付款訂單。
 */

import { normalizeInvoice, parseInvoice, type InvoiceInput } from "@/lib/invoice";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { SponsorInput, SponsorMethod } from "@/lib/support";

/** sponsor＝贊助；credits＝購買卜卦點數，付款成功後發兌換碼而不是感謝信。 */
export type OrderProduct = "sponsor" | "credits";

export interface SponsorOrder {
  merTradeNo: string;
  amount: number;
  method: SponsorMethod;
  name: string;
  email: string;
  message: string;
  createdAt: number;
  status: "pending" | "awaiting_payment" | "paid" | "failed";
  product: OrderProduct;
  /** 點數訂單要發幾點；贊助訂單為 0。 */
  credits: number;
  /** 買受人要的發票形式；贊助訂單不開發票，為 null。 */
  invoice: InvoiceInput | null;
  tradeNo?: string;
  paidAt?: number;
  /** 贊助是感謝信，點數是兌換碼信，兩者共用這組欄位。 */
  thankYouSentAt?: number;
  thankYouError?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: number;
  invoiceError?: string;
}

/** DB 的 snake_case row 形狀（僅本檔內部使用）。 */
type SponsorOrderRow = {
  mer_trade_no: string;
  amount: number;
  method: SponsorMethod;
  name: string;
  email: string;
  message: string;
  status: SponsorOrder["status"];
  product: OrderProduct;
  credits: number;
  invoice: unknown;
  invoice_number: string | null;
  invoice_issued_at: string | null;
  invoice_error: string | null;
  trade_no: string | null;
  paid_at: string | null;
  thank_you_sent_at: string | null;
  thank_you_error: string | null;
  created_at: string;
};

function fromRow(row: SponsorOrderRow): SponsorOrder {
  return {
    merTradeNo: row.mer_trade_no,
    amount: row.amount,
    method: row.method,
    name: row.name,
    email: row.email,
    message: row.message,
    createdAt: new Date(row.created_at).getTime(),
    status: row.status,
    product: row.product === "credits" ? "credits" : "sponsor",
    credits: row.credits ?? 0,
    invoice: row.invoice ? parseInvoice(row.invoice) : null,
    invoiceNumber: row.invoice_number ?? undefined,
    invoiceIssuedAt: row.invoice_issued_at ? new Date(row.invoice_issued_at).getTime() : undefined,
    invoiceError: row.invoice_error ?? undefined,
    tradeNo: row.trade_no ?? undefined,
    paidAt: row.paid_at ? new Date(row.paid_at).getTime() : undefined,
    thankYouSentAt: row.thank_you_sent_at ? new Date(row.thank_you_sent_at).getTime() : undefined,
    thankYouError: row.thank_you_error ?? undefined,
  };
}

export async function createOrder(
  merTradeNo: string,
  input: SponsorInput,
  product: {
    product: OrderProduct;
    credits: number;
    invoice?: InvoiceInput | null;
  } = { product: "sponsor", credits: 0 },
): Promise<SponsorOrder> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from("sponsor_orders")
    .insert({
      mer_trade_no: merTradeNo,
      amount: input.amount,
      method: input.method,
      name: input.name.trim(),
      email: input.email.trim(),
      message: input.message.trim(),
      status: "pending",
      product: product.product,
      credits: product.credits,
      invoice: product.invoice ? normalizeInvoice(product.invoice) : null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`建立訂單失敗：${error?.message ?? "未知錯誤"}`);
  }

  return fromRow(data as SponsorOrderRow);
}

export async function getOrder(merTradeNo: string): Promise<SponsorOrder | undefined> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from("sponsor_orders")
    .select()
    .eq("mer_trade_no", merTradeNo)
    .maybeSingle();

  if (error) {
    console.error(`[support-orders] 查詢訂單 ${merTradeNo} 失敗：`, error.message);
    return undefined;
  }
  if (!data) return undefined;

  return fromRow(data as SponsorOrderRow);
}

export async function updateOrder(
  merTradeNo: string,
  patch: Partial<SponsorOrder>,
): Promise<SponsorOrder | undefined> {
  const db = getSupabaseAdmin();

  // 用 `in` 而非 `!== undefined`：呼叫端會明確傳 `{ thankYouError: undefined }` 之類的欄位
  // 來清空前次的值（例如感謝信補寄成功後清掉舊的錯誤訊息），須視為「設為 null」而非「不更動」。
  const has = <K extends keyof SponsorOrder>(k: K) => Object.prototype.hasOwnProperty.call(patch, k);

  const update: Partial<SponsorOrderRow> = {};
  if (has("status")) update.status = patch.status;
  if (has("tradeNo")) update.trade_no = patch.tradeNo ?? null;
  if (has("paidAt")) update.paid_at = patch.paidAt ? new Date(patch.paidAt).toISOString() : null;
  if (has("thankYouSentAt")) {
    update.thank_you_sent_at = patch.thankYouSentAt ? new Date(patch.thankYouSentAt).toISOString() : null;
  }
  if (has("thankYouError")) update.thank_you_error = patch.thankYouError ?? null;
  if (has("invoiceNumber")) update.invoice_number = patch.invoiceNumber ?? null;
  if (has("invoiceIssuedAt")) {
    update.invoice_issued_at = patch.invoiceIssuedAt
      ? new Date(patch.invoiceIssuedAt).toISOString()
      : null;
  }
  if (has("invoiceError")) update.invoice_error = patch.invoiceError ?? null;

  const { data, error } = await db
    .from("sponsor_orders")
    .update(update)
    .eq("mer_trade_no", merTradeNo)
    .select()
    .maybeSingle();

  if (error) {
    console.error(`[support-orders] 更新訂單 ${merTradeNo} 失敗：`, error.message);
    return undefined;
  }
  if (!data) return undefined;

  return fromRow(data as SponsorOrderRow);
}
