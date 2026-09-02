/**
 * 建立「購買卜卦點數」的訂單，回傳要 form post 給 PAYUNi 的欄位。
 *
 * 和贊助共用同一條金流與同一張訂單表，只有 product 不同（見 supabase 的 divination_credits 遷移）。
 * 金額一律由伺服器依方案算出，不看前端傳來的數字。
 */

import { NextResponse } from "next/server";

import { CREDIT_PRODUCT_NAME, getCreditPack } from "@/lib/divination-credits";
import { hasInvoiceErrors, parseInvoice, validateInvoice } from "@/lib/invoice";
import { createSponsorInput, getMethod, type SponsorMethod } from "@/lib/support";
import { buildUppRequest, createMerTradeNo, payuniConfig } from "@/server/payuni";
import { optionalUser } from "@/server/sharing";
import { createOrder } from "@/server/support-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  const config = payuniConfig();
  if (!config) {
    return NextResponse.json({ error: "尚未設定金流憑證，暫時無法購買點數。" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const pack = getCreditPack(typeof raw.packId === "string" ? raw.packId : "");
  if (!pack) {
    return NextResponse.json({ error: "請選擇一個點數方案。" }, { status: 400 });
  }

  const email = typeof raw.email === "string" ? raw.email.trim().slice(0, 80) : "";
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "請填寫正確的信箱，兌換碼會寄到這裡。" },
      { status: 400 },
    );
  }

  const method: SponsorMethod =
    raw.method === "atm" || raw.method === "cvs" ? raw.method : "credit";
  const limits = getMethod(method);
  if (pack.amount < limits.min || pack.amount > limits.max) {
    return NextResponse.json(
      { error: `這個方案的金額不在${limits.label}的可用範圍，請換一種付款方式。` },
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
  const user = await optionalUser(request);
  try {
    await createOrder(
      merTradeNo,
      { ...createSponsorInput(), amount: pack.amount, method, email },
      { product: "credits", credits: pack.credits, invoice, userId: user?.userId },
    );
  } catch (e) {
    console.error("[divination/credits] 建立訂單失敗：", e);
    return NextResponse.json({ error: "暫時無法建立訂單，請稍後再試。" }, { status: 500 });
  }

  const { action, fields } = buildUppRequest({
    config,
    merTradeNo,
    amount: pack.amount,
    method,
    email,
    prodDesc: `${CREDIT_PRODUCT_NAME} ${pack.credits} 點`,
    backPath: "/divination/credits",
  });

  return NextResponse.json({ merTradeNo, action, fields });
}
