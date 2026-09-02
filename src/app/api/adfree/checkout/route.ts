/**
 * 建立無廣告每月自動扣款訂單，回傳要 form post 給 PAYUNi 續期收款頁的欄位。
 * 金額一律 NT$50，只走信用卡。必須已登入。
 */

import { NextResponse } from "next/server";

import { ADFREE_AMOUNT, ADFREE_PRODUCT_NAME } from "@/lib/adfree";
import { createInvoiceInput, hasInvoiceErrors, parseInvoice, validateInvoice } from "@/lib/invoice";
import { createSponsorInput } from "@/lib/support";
import { buildPeriodRequest, createMerTradeNo, payuniConfig } from "@/server/payuni";
import { requireUser } from "@/server/sharing";
import { createOrder } from "@/server/support-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const config = payuniConfig();
  if (!config) {
    return NextResponse.json({ error: "尚未設定金流憑證，暫時無法訂閱。" }, { status: 503 });
  }

  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const rawEmail = typeof raw.email === "string" ? raw.email.trim().slice(0, 80) : "";
  const email = EMAIL_PATTERN.test(rawEmail)
    ? rawEmail
    : auth.email && EMAIL_PATTERN.test(auth.email)
      ? auth.email
      : "";

  const invoice = raw.invoice ? parseInvoice(raw.invoice) : createInvoiceInput();
  const invoiceErrors = validateInvoice(invoice);
  if (hasInvoiceErrors(invoiceErrors)) {
    return NextResponse.json(
      { error: "發票資訊有誤，請確認後再送出。", invoiceErrors },
      { status: 400 },
    );
  }

  const merTradeNo = createMerTradeNo();
  try {
    await createOrder(
      merTradeNo,
      { ...createSponsorInput(), amount: ADFREE_AMOUNT, method: "credit", email },
      { product: "adfree", credits: 0, invoice, userId: auth.userId },
    );
  } catch (e) {
    console.error("[adfree/checkout] 建立訂單失敗：", e);
    return NextResponse.json({ error: "暫時無法建立訂單，請稍後再試。" }, { status: 500 });
  }

  const { action, fields } = buildPeriodRequest({
    config,
    merTradeNo,
    amount: ADFREE_AMOUNT,
    email,
    prodDesc: `${ADFREE_PRODUCT_NAME}（每月自動續約）`,
    backPath: "/settings#adfree",
  });

  return NextResponse.json({ merTradeNo, action, fields });
}
