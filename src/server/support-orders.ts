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

/** sponsor＝贊助；credits＝購買卜卦點數；adfree＝無廣告訂閱。 */
export type OrderProduct = "sponsor" | "credits" | "adfree";

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
  /** 下單時的登入使用者；無廣告訂閱一定有值。 */
  userId?: string;
  /** 無廣告訂閱已把效期加上去的時間；重送 Notify 時不要再加 30 天。 */
  entitlementAppliedAt?: number;
  /** PAYUNi 續期收款單號；每月自動扣款的各期共用。 */
  periodTradeNo?: string;
  /** 本期 PeriodOrderNo，用來避免同一期重覆入帳。 */
  periodOrderNo?: string;
  thisPeriod?: number;
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
  user_id: string | null;
  entitlement_applied_at: string | null;
  period_trade_no: string | null;
  period_order_no: string | null;
  this_period: number | null;
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
    product: row.product === "credits" || row.product === "adfree" ? row.product : "sponsor",
    credits: row.credits ?? 0,
    invoice: row.invoice ? parseInvoice(row.invoice) : null,
    userId: row.user_id ?? undefined,
    entitlementAppliedAt: row.entitlement_applied_at
      ? new Date(row.entitlement_applied_at).getTime()
      : undefined,
    periodTradeNo: row.period_trade_no ?? undefined,
    periodOrderNo: row.period_order_no ?? undefined,
    thisPeriod: row.this_period ?? undefined,
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
    userId?: string | null;
    periodTradeNo?: string | null;
    periodOrderNo?: string | null;
    thisPeriod?: number | null;
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
      user_id: product.userId ?? null,
      ...(product.periodTradeNo || product.periodOrderNo || product.thisPeriod
        ? {
            period_trade_no: product.periodTradeNo ?? null,
            period_order_no: product.periodOrderNo ?? null,
            this_period: product.thisPeriod ?? null,
          }
        : {}),
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
  if (has("entitlementAppliedAt")) {
    update.entitlement_applied_at = patch.entitlementAppliedAt
      ? new Date(patch.entitlementAppliedAt).toISOString()
      : null;
  }
  if (has("periodTradeNo")) update.period_trade_no = patch.periodTradeNo ?? null;
  if (has("periodOrderNo")) update.period_order_no = patch.periodOrderNo ?? null;
  if (has("thisPeriod")) update.this_period = patch.thisPeriod ?? null;
  if (has("email")) update.email = patch.email ?? "";
  if (has("name")) update.name = patch.name ?? "";

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

export async function getOrderByPeriodOrderNo(
  periodOrderNo: string,
): Promise<SponsorOrder | undefined> {
  if (!periodOrderNo) return undefined;
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("sponsor_orders")
    .select()
    .eq("period_order_no", periodOrderNo)
    .maybeSingle();

  if (error) {
    console.error(`[support-orders] 查詢續期訂單 ${periodOrderNo} 失敗：`, error.message);
    return undefined;
  }
  if (!data) return undefined;
  return fromRow(data as SponsorOrderRow);
}

/** 登入使用者的付款紀錄：自己下的單，以及尚未綁帳號但信箱相同的舊單。 */
export async function listOrdersForUser(
  userId: string,
  email?: string | null,
): Promise<SponsorOrder[]> {
  const db = getSupabaseAdmin();
  const normalizedEmail = email?.trim() ?? "";

  const { data: owned, error: ownedError } = await db
    .from("sponsor_orders")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (ownedError) {
    console.error("[support-orders] 查詢付款紀錄失敗：", ownedError.message);
    return [];
  }

  const rows = new Map<string, SponsorOrder>();
  for (const row of owned ?? []) {
    const order = fromRow(row as SponsorOrderRow);
    rows.set(order.merTradeNo, order);
  }

  if (normalizedEmail) {
    const { data: mailed, error: mailedError } = await db
      .from("sponsor_orders")
      .select()
      .is("user_id", null)
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(80);

    if (mailedError) {
      console.error("[support-orders] 依信箱查詢舊訂單失敗：", mailedError.message);
    } else {
      for (const row of mailed ?? []) {
        const order = fromRow(row as SponsorOrderRow);
        if (!rows.has(order.merTradeNo)) rows.set(order.merTradeNo, order);
      }
    }
  }

  return [...rows.values()].sort((a, b) => (b.paidAt ?? b.createdAt) - (a.paidAt ?? a.createdAt));
}
