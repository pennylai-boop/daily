/**
 * 伺服器端專用 Supabase client（service role，繞過 RLS）。
 *
 * 只給 Route Handler／伺服器程式碼使用（例如 src/server/support-orders.ts）；
 * 絕對不要匯入到會被打包進瀏覽器的檔案。
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "缺少 Supabase 環境變數：請設定 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SECRET_KEY（見 .env）。",
    );
  }

  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
