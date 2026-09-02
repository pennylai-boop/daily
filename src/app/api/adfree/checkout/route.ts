/**
 * 建立無廣告訂閱訂單，回傳要 form post 給 PAYUNi 的欄位。
 * 金額一律 NT$50，不看前端傳來的數字。必須已登入。
 */

import { NextResponse } from "next/server";

import { ADFREE_AMOUNT, ADFREE_PRODUCT_NAME } from "@/lib/adfree";
import { hasInvoiceErrors, parseInvoice, validateInvoice } from "@/lib/invoice";
import { createSponsorInput, getMethod, type SponsorMethod } from "@/lib/support";
import { buildUppRequest, createMerTradeNo, payuniConfig } from "@/server/payuni";
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
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const email = typeof raw.email === "string" ? raw.email.trim().slice(0, 80) : "";
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "請填寫正確的信箱，發票會寄到這裡。" }, { status: 400 });
  }

  const method: SponsorMethod =
    raw.method === "atm" || raw.method === "cvs" ? raw.method : "credit";
  const limits = getMethod(method);
  if (ADFREE_AMOUNT < limits.min || ADFREE_AMOUNT > limits.max) {
    return NextResponse.json(
      { error: `這個金額不在${limits.label}的可用範圍，請換一種付款方式。` },
      { status: 400 },
    );
  }

  const invoice = parseInvoice(raw.invoice);
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
      { ...createSponsorInput(), amount: ADFREE_AMOUNT, method, email },
      { product: "adfree", credits: 0, invoice, userId: auth.userId },
    );
  } catch (e) {
    console.error("[adfree/checkout] 建立訂單失敗：", e);
    return NextResponse.json({ error: "暫時無法建立訂單，請稍後再試。" }, { status: 500 });
  }

  const { action, fields } = buildUppRequest({
    config,
    merTradeNo,
    amount: ADFREE_AMOUNT,
    method,
    email,
    prodDesc: `${ADFREE_PRODUCT_NAME} 1 個月`,
    backPath: "/settings#adfree",
  });

  return NextResponse.json({ merTradeNo, action, fields });
}
