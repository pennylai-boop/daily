/**
 * 卜卦點數兌換碼。
 *
 * 付款成功（Notify）時發一組碼寄到信箱；餘額留在資料庫，兌換碼只是領用的憑據。
 * 所以換裝置或清掉瀏覽器資料之後，重新輸入同一組碼就能接回剩下的點數，
 * 而每次用點數起卦都是在伺服器扣的，前端動不了餘額。
 */

import crypto from "node:crypto";

import { REDEEM_CODE_ALPHABET, REDEEM_CODE_LENGTH } from "@/lib/divination-credits";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface CreditBalance {
  code: string;
  credits: number;
  creditsUsed: number;
  remaining: number;
}

function generateCode(): string {
  const bytes = crypto.randomBytes(REDEEM_CODE_LENGTH);
  return Array.from(bytes, (byte) => REDEEM_CODE_ALPHABET[byte % REDEEM_CODE_ALPHABET.length]).join("");
}

/**
 * 為一筆已付款的訂單發碼。
 *
 * `mer_trade_no` 是唯一的，所以 Notify 被重送時不會多發一組；
 * 這種情況回傳既有的那一組，補寄的信才會拿到同一個碼。
 */
export async function issueCreditCode(params: {
  merTradeNo: string;
  credits: number;
  email: string;
}): Promise<{ code: string; alreadyIssued: boolean } | null> {
  const db = getSupabaseAdmin();

  const existing = await db
    .from("divination_credit_codes")
    .select("code")
    .eq("mer_trade_no", params.merTradeNo)
    .maybeSingle();

  if (existing.data?.code) return { code: existing.data.code as string, alreadyIssued: true };

  const { data, error } = await db
    .from("divination_credit_codes")
    .insert({
      code: generateCode(),
      credits: params.credits,
      email: params.email.trim(),
      mer_trade_no: params.merTradeNo,
    })
    .select("code")
    .single();

  if (error || !data) {
    console.error(`[credit-codes] 訂單 ${params.merTradeNo} 發碼失敗：`, error?.message);
    return null;
  }

  return { code: data.code as string, alreadyIssued: false };
}

/**
 * 用訂單編號找出已經發出的兌換碼。付款完成導回站上時用它把點數直接接到裝置上，
 * 使用者才不必先去信箱翻兌換碼。Notify 還沒進來時查不到，回 null 讓呼叫端稍後再試。
 */
export async function getCreditCodeByOrder(merTradeNo: string): Promise<string | null> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from("divination_credit_codes")
    .select("code")
    .eq("mer_trade_no", merTradeNo)
    .maybeSingle();

  if (error) {
    console.error(`[credit-codes] 查訂單 ${merTradeNo} 的兌換碼失敗：`, error.message);
    return null;
  }

  return (data?.code as string | undefined) ?? null;
}

export type BalanceResult =
  | { ok: true; balance: CreditBalance }
  | { ok: false; reason: "not-found" | "error" };

/**
 * 查餘額，不扣點。輸入兌換碼時用來確認碼是真的並回報還剩幾點。
 *
 * 資料庫連不上和查無此碼要分開回報：前者跟使用者說「找不到這組兌換碼」會讓人以為碼打錯了，
 * 一直重打也不會好。
 */
export async function getCreditBalance(code: string): Promise<BalanceResult> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from("divination_credit_codes")
    .select("code, credits, credits_used")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("[credit-codes] 查詢餘額失敗：", error.message);
    return { ok: false, reason: "error" };
  }
  if (!data) return { ok: false, reason: "not-found" };

  const credits = data.credits as number;
  const creditsUsed = data.credits_used as number;
  return {
    ok: true,
    balance: { code: data.code as string, credits, creditsUsed, remaining: credits - creditsUsed },
  };
}

export type ConsumeResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: "not-found" | "exhausted" | "error" };

/** 扣一點。扣不動時要分清楚是碼不存在還是點數用完，訊息才有用。 */
export async function consumeCredit(code: string): Promise<ConsumeResult> {
  const db = getSupabaseAdmin();

  const { data, error } = await db.rpc("consume_divination_credit", { p_code: code });

  if (error) {
    console.error("[credit-codes] 扣點失敗：", error.message);
    return { ok: false, reason: "error" };
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (row) {
    const credits = Number(row.credits);
    const creditsUsed = Number(row.credits_used);
    return { ok: true, remaining: credits - creditsUsed };
  }

  // 扣不到列：碼不存在，或點數已經用完。
  const balance = await getCreditBalance(code);
  if (!balance.ok) return { ok: false, reason: balance.reason };
  return { ok: false, reason: "exhausted" };
}
