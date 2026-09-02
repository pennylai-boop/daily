/**
 * LINE 登入／登出。
 *
 * 走 Supabase 的 Custom OAuth Provider（`custom:line`，見 scripts/create-line-provider.mjs）。
 * `signInWithOAuth` 導去 LINE 的登入頁，成功後帶著 hash 導回本站，`supabase-browser.ts`
 * 的 client 已經開 `detectSessionInUrl`，回來就直接拿得到 session，不需要伺服器端 callback route。
 *
 * LIFF SDK（`./liff`）只留給 `line-invite.ts` 的 `shareTargetPicker()` 用，跟登入無關。
 */

import { getSupabaseBrowser } from "./supabase-browser";
import type { Profile } from "./types";

export type LineLoginResult = { status: "redirect" } | { status: "unavailable"; reason: string };

/** 向 LINE 發起登入；成功時回傳可寫進 settings.profile 的資料。 */
export async function signInWithLine(): Promise<LineLoginResult> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return {
      status: "unavailable",
      reason: "這個環境還沒有設定 Supabase，暫時無法登入。",
    };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "custom:line",
    options: { redirectTo: loginRedirectTo() },
  });

  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  // signInWithOAuth 會直接把瀏覽器導去 LINE 的登入頁，這裡回傳的 redirect 只是形式上結束這次呼叫。
  return { status: "redirect" };
}

/**
 * 正式站一律回到 NEXT_PUBLIC_SITE_URL（建置期烤進去的 https://daily.introvista.ai），
 * 避免從 Cloud Run 預設網域或錯誤的 host 登入後被導去別的地方。
 * 本機 SITE_URL 是 localhost，就跟現在這個分頁走。
 *
 * 真正能不能回到這個網址，還是看 Supabase Dashboard → Authentication → URL Configuration
 * 的 Site URL／Redirect URLs 有沒有把它列入。沒列入時 GoTrue 會退回 Site URL，
 * 而 Site URL 若還是 http://localhost:3000，正式站登入成功也會跳到本機。
 */
function loginRedirectTo(): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (site && !/localhost|127\.0\.0\.1/.test(site)) {
    return `${site}${window.location.pathname}${window.location.search}`;
  }
  return window.location.href;
}

/**
 * 從目前的 Supabase session 讀出可寫進 settings.profile 的資料。
 * 在 `detectSessionInUrl` 解析完 OAuth 回跳、或頁面載入時已有 session 時呼叫。
 *
 * `attribute_mapping` 把 LINE 的 userId 對到 `sub`（見 scripts/create-line-provider.mjs），
 * Supabase 對 custom oauth2 provider 會把對應後的欄位放進該 identity 的 `identity_data`；
 * 沒有 identities（理論上不會發生，保險起見才 fallback）才退到 user_metadata，
 * 兩邊都沒有就用 Supabase 內部的 uuid（僅避免整段掛掉，正式環境應該不會走到這裡）。
 * 第一次真的登入後要對照 Supabase Dashboard 的 auth.users 確認這個值真的是 LINE 的 U 開頭 userId。
 */
export function profileFromSession(user: {
  id: string;
  user_metadata?: Record<string, unknown> | null;
  identities?: { provider: string; identity_data?: Record<string, unknown> | null }[] | null;
}): Profile {
  const identity = user.identities?.find((item) => item.provider === "custom:line");
  const source = identity?.identity_data ?? user.user_metadata ?? {};

  const name = typeof source.name === "string" ? source.name : "";
  const picture = typeof source.picture === "string" ? source.picture : null;
  const lineUserId = typeof source.sub === "string" ? source.sub : user.id;

  return { name, lineUserId, avatarUrl: picture };
}

/** 解除 LINE 登入狀態（本機 profile 清空由 store.signOut 處理）。 */
export async function signOutFromLine(): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  await supabase.auth.signOut();
}
