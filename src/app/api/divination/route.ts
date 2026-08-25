/**
 * 數字卜卦：起卦計算在伺服器端完成，再交給 Gemini 產生解讀。
 *
 * 每三個月一次的免費額度記在瀏覽器（`DailyState.divination`）；帶了兌換碼進來的請求
 * 表示要用點數，扣點在這裡做，因為餘額是伺服器的資料，不能讓前端自己說還有幾點。
 */

import { NextResponse } from "next/server";

import { isRedeemCodeShaped, normalizeRedeemCode } from "@/lib/divination-credits";
import { castHexagram, HEXAGRAM_NUMBER_COUNT } from "@/lib/hexagram";
import { consumeCredit } from "@/server/credit-codes";
import { analyzeHexagram } from "@/server/divination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const question = typeof raw.question === "string" ? raw.question.trim().slice(0, 200) : "";
  if (!question) {
    return NextResponse.json({ error: "請先寫下想問的問題。" }, { status: 400 });
  }

  const rawNumbers = Array.isArray(raw.numbers) ? raw.numbers : [];
  const numbers = rawNumbers.map((n) => (typeof n === "number" ? n : Number(n)));
  const valid =
    numbers.length === HEXAGRAM_NUMBER_COUNT &&
    numbers.every((n) => Number.isInteger(n) && n > 0);

  if (!valid) {
    return NextResponse.json(
      { error: `請填滿 ${HEXAGRAM_NUMBER_COUNT} 個 1～9 的數字，或按「隨機產生」。` },
      { status: 400 },
    );
  }

  let hexagram;
  try {
    hexagram = castHexagram(numbers);
  } catch {
    return NextResponse.json({ error: "起卦失敗，請確認輸入的數字。" }, { status: 400 });
  }

  // 先確認 AI 解得出來再扣點：解讀失敗還扣一點，等於收了錢沒給東西。
  const result = await analyzeHexagram({ question, hexagram });
  if (!result.ok) {
    // 卦象已經算出來了，解讀失敗仍把卦象回給前端；真正的原因只留在伺服器日誌。
    console.error(`[divination] 解卦失敗：${result.message}`);
    return NextResponse.json({ error: "AI 解卦失敗，請稍後再試。", hexagram }, { status: 502 });
  }

  const code = normalizeRedeemCode(typeof raw.redeemCode === "string" ? raw.redeemCode : "");
  if (!code) {
    return NextResponse.json({ hexagram, analysis: result.analysis });
  }

  if (!isRedeemCodeShaped(code)) {
    return NextResponse.json({ error: "兌換碼格式不對。" }, { status: 400 });
  }

  const spent = await consumeCredit(code);
  if (!spent.ok) {
    const error =
      spent.reason === "exhausted"
        ? "這組兌換碼的點數已經用完了。"
        : spent.reason === "not-found"
          ? "找不到這組兌換碼。"
          : "扣點失敗，請稍後再試。";
    return NextResponse.json({ error }, { status: spent.reason === "error" ? 502 : 402 });
  }

  return NextResponse.json({
    hexagram,
    analysis: result.analysis,
    creditsRemaining: spent.remaining,
  });
}
