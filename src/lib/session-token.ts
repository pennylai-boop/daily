import { getSupabaseBrowser } from "./supabase-browser";

/** 目前登入的 access token；沒登入或沒設定 Supabase 就回 null。 */
export async function sessionAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function sessionEmail(): Promise<string | null> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const email = session?.user?.email?.trim() ?? "";
  return email || null;
}
