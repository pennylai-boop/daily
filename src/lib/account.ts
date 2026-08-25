/**
 * 帳號的共用部分：登出動作與 LINE userId 的遮罩。
 *
 * 手機側邊選單底部和設定頁都要能登出，登出的順序（先斷 Supabase session、再清本機身分）
 * 只留這一份，不然兩邊很容易走歪。
 */

import { signOutFromLine } from "./line-auth";
import { signOut } from "./store";

export const SIGN_OUT_CONFIRM = "確定要登出嗎？這台裝置上的日記與事項會留著，只是解除 LINE 帳號。";

/** LINE userId 很長且沒有可讀性，只留頭尾當作連結狀態的佐證。 */
export function maskLineUserId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

/**
 * 登出。Supabase 那邊失敗也一定要清掉本機身分，不然會卡在「看起來已登入但同步不動」的
 * 中間狀態。回傳 false 表示只清了本機。
 */
export async function performSignOut(): Promise<boolean> {
  try {
    await signOutFromLine();
    signOut();
    return true;
  } catch {
    signOut();
    return false;
  }
}
