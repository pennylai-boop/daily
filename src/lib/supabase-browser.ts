"use client";

/**
 * 瀏覽器端 Supabase client（anon／publishable key，權限由 RLS 決定）。
 *
 * `detectSessionInUrl` 讓 `signInWithOAuth` 導回來時直接在前端解析 hash 拿 session，
 * 不需要伺服器端的 callback route 或 `@supabase/ssr`。
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached) return cached;
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return cached;
}
