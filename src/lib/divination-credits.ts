/**
 * 卜卦點數的共用定義。
 *
 * 和 `./support` 一樣被瀏覽器與 Route Handler 同時引用，所以不能碰金鑰或 node 模組：
 * 前端用它顯示方案，後端用同一份算金額，不信任前端傳來的價格。
 */

/** PAYUNi 商品說明，帳務上要看得出來是點數而不是贊助。 */
export const CREDIT_PRODUCT_NAME = "天天 daily 卜卦點數";

/**
 * 儲值方案。**價格就是這裡的 `amount`，要調整只改這一份。**
 *
 * 買得越多，每點越便宜。金額受 PAYUNi 的支付工具限制（見 `./support` 的 SPONSOR_METHODS）：
 * 超商代碼上限 20,000 元、ATM 上限 49,999 元，所以 30,000 的旗艦只能用信用卡，
 * 畫面上會依選的付款方式擋掉不能用的方案。
 */
export const CREDIT_PACKS = [
  { id: "light", label: "輕量", credits: 6, amount: 300 },
  { id: "starter", label: "入門", credits: 12, amount: 500 },
  { id: "standard", label: "標準", credits: 30, amount: 1_000 },
  { id: "advanced", label: "進階", credits: 500, amount: 10_000 },
  { id: "flagship", label: "旗艦", credits: 2_000, amount: 30_000 },
] as const;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];
export type CreditPack = (typeof CREDIT_PACKS)[number];

/** 每點最便宜的那個方案標「最划算」。 */
export const BEST_VALUE_PACK_ID: CreditPackId = CREDIT_PACKS.reduce((best, pack) =>
  pack.amount / pack.credits < best.amount / best.credits ? pack : best,
).id;

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}

/**
 * 每點多少錢，留一位小數。
 *
 * 不用四捨五入到整數：12 點 500 元是 41.7，進位成 42 之後乘回去對不上，看起來像算錯。
 */
export function formatPricePerCredit(pack: CreditPack): string {
  return (pack.amount / pack.credits).toFixed(1);
}

/** 兌換碼會被唸出來也會被手打，長度與字母表和邀請碼同一套（避開 0/O、1/I）。 */
export const REDEEM_CODE_LENGTH = 12;
export const REDEEM_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** 顯示成 `XXXX-XXXX-XXXX`，比一長串好對。 */
export function formatRedeemCode(code: string): string {
  return (code.match(/.{1,4}/g) ?? [code]).join("-");
}

/** 使用者可能連著破折號、空白或小寫一起貼進來。 */
export function normalizeRedeemCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isRedeemCodeShaped(code: string): boolean {
  return code.length === REDEEM_CODE_LENGTH && [...code].every((c) => REDEEM_CODE_ALPHABET.includes(c));
}
