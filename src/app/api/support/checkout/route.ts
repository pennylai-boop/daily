/**
 * 建立贊助訂單，回傳要 form post 給 PAYUNi 的欄位。
 *
 * 瀏覽器拿到 EncryptInfo／HashInfo 後自己組 form 送出（UPP 的規格就是從前端 post），
 * 金鑰與金額計算都留在這裡，前端改不了已簽章的內容。
 */

import { NextResponse } from "next/server";

import { createSponsorInput, hasErrors, validateSponsor, type SponsorInput } from "@/lib/support";
import { buildUppRequest, createMerTradeNo, payuniConfig } from "@/server/payuni";
import { createOrder } from "@/server/support-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = payuniConfig();
  if (!config) {
    return NextResponse.json(
      { error: "尚未設定 PAYUNi 金流憑證，暫時無法贊助。" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }

  const input = parseInput(body);
  const errors = validateSponsor(input);
  if (hasErrors(errors)) {
    return NextResponse.json({ error: "欄位有誤，請確認後再送出。", errors }, { status: 400 });
  }

  const merTradeNo = createMerTradeNo();
  createOrder(merTradeNo, input);

  const { action, fields } = buildUppRequest({
    config,
    merTradeNo,
    amount: input.amount,
    method: input.method,
    email: input.email.trim(),
  });

  return NextResponse.json({ merTradeNo, action, fields });
}

/** 只認得下面這些欄位，其餘一律丟掉，型別也在這裡收斂。 */
function parseInput(body: unknown): SponsorInput {
  const raw = (body ?? {}) as Record<string, unknown>;
  const base = createSponsorInput();

  return {
    ...base,
    amount: Math.trunc(Number(raw.amount ?? 0)),
    method: coerceMethod(raw.method),
    name: text(raw.name, 40),
    email: text(raw.email, 80),
    message: text(raw.message, 600),
  };
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function coerceMethod(value: unknown): SponsorInput["method"] {
  return value === "atm" || value === "cvs" ? value : "credit";
}
