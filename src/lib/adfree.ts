/**
 * 無廣告訂閱：每月 NT$50，付款成功後效期往後加 30 天。
 *
 * 金流／發票與卜卦點數同一條路（PAYUNi + SmilePay）。
 * 權益記在伺服器、綁 LINE 登入的帳號，換裝置登入同一支 LINE 就接得回來。
 */

export const ADFREE_AMOUNT = 50;
export const ADFREE_DAYS = 30;
export const ADFREE_PRODUCT_NAME = "無廣告訂閱";

export function isAdFreeActive(until: string | null | undefined, now = Date.now()): boolean {
  if (!until) return false;
  const expires = Date.parse(until);
  return Number.isFinite(expires) && expires > now;
}

export function formatAdFreeUntil(until: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(until));
}

export function adsenseConfig(): { client: string; slot: string } | null {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT?.trim() ?? "";
  if (!client || !slot) return null;
  return { client, slot };
}
