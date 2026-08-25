/**
 * 不走金流，只收使用建議。信箱與留言必填。
 */

import { NextResponse } from "next/server";

import {
  createSponsorInput,
  hasErrors,
  validateFeedback,
  type SponsorInput,
} from "@/lib/support";
import { sendUsageFeedback } from "@/server/thank-you-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }

  const input = parseInput(body);
  const errors = validateFeedback(input);
  if (hasErrors(errors)) {
    return NextResponse.json({ error: "欄位有誤，請確認後再送出。", errors }, { status: 400 });
  }

  const result = await sendUsageFeedback({
    email: input.email.trim(),
    name: input.name.trim(),
    message: input.message.trim(),
  });

  if (!result.ok) {
    // 對外只給一句話，但伺服器要留下真正的原因，否則憑證失效這種問題完全查不出來。
    console.error(`[support] 使用建議寄送失敗：${result.message}`);
    return NextResponse.json({ error: "留言送出失敗，請稍後再試。" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

function parseInput(body: unknown): SponsorInput {
  const raw = (body ?? {}) as Record<string, unknown>;
  const base = createSponsorInput();
  return {
    ...base,
    name: typeof raw.name === "string" ? raw.name.slice(0, 40) : "",
    email: typeof raw.email === "string" ? raw.email.slice(0, 80) : "",
    message: typeof raw.message === "string" ? raw.message.slice(0, 600) : "",
  };
}
