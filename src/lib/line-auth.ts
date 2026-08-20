/**
 * LINE 登入／登出。
 *
 * 正式流程走 LIFF（在 LINE 裡）或之後的 Supabase Custom OAuth（`custom:line`）。
 * 前端現在先接 LIFF：有 `NEXT_PUBLIC_LIFF_ID` 且在 LINE 內開啟時可真的登入；
 * 其他環境按登入會回傳 `unavailable`，由畫面提示要到 LINE 開啟或等後端接上。
 *
 * `window.liff` 的型別宣告集中在 `line-invite.ts`。
 */

import type { Profile } from "./types";

export type LineLoginResult =
  | { status: "ok"; profile: Profile }
  | { status: "redirect" }
  | { status: "unavailable"; reason: string };

function liffId(): string {
  return process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
}

async function ensureLiff(): Promise<boolean> {
  const id = liffId();
  if (!id || typeof window === "undefined" || !window.liff) return false;
  try {
    await window.liff.init({ liffId: id });
    return true;
  } catch {
    return false;
  }
}

/** 向 LINE 發起登入；成功時回傳可寫進 settings.profile 的資料。 */
export async function signInWithLine(): Promise<LineLoginResult> {
  const ready = await ensureLiff();
  if (!ready || !window.liff) {
    return {
      status: "unavailable",
      reason:
        "目前只能用 LINE 登入。請在 LINE 裡開啟本站，或等伺服器接上 LINE Login 之後再從瀏覽器登入。",
    };
  }

  if (!window.liff.isLoggedIn()) {
    window.liff.login({ redirectUri: window.location.href });
    return { status: "redirect" };
  }

  const profile = await window.liff.getProfile();
  return {
    status: "ok",
    profile: {
      name: profile.displayName,
      lineUserId: profile.userId,
      avatarUrl: profile.pictureUrl ?? null,
    },
  };
}

/** 解除 LINE 登入狀態（本機 profile 清空由 store.signOut 處理）。 */
export async function signOutFromLine(): Promise<void> {
  const ready = await ensureLiff();
  if (ready && window.liff?.isLoggedIn()) {
    window.liff.logout();
  }
}
