/**
 * 網頁按「新增」時先簽一張短效憑證，LINE 裡選完後用這張憑證寫回網頁那個帳號。
 * LINE 內建瀏覽器不必登入天天；憑證本身就指向當初在網頁登入的使用者。
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

const HANDOUT_MS = 30 * 60 * 1000;

function signingSecret(): string {
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!key) throw new Error("缺少 SUPABASE_SECRET_KEY");
  return key;
}

function liffId(): string {
  return process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
}

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://daily.introvista.ai").replace(/\/$/, "");
}

export function signLinePickToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + HANDOUT_MS })).toString(
    "base64url",
  );
  const sig = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyLinePickToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  if (!safeEqual(sig, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      userId?: string;
      exp?: number;
    };
    if (!data.userId || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data.userId;
  } catch {
    return null;
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function linePickLiffUrl(token: string): string | null {
  const id = liffId();
  if (!id) return null;
  const params = new URLSearchParams({ pickLine: "1", handoff: token });
  return `https://liff.line.me/${id}?${params.toString()}`;
}

export function linePickReturnUrl(picked: "1" | "0"): string {
  return `${siteOrigin()}/settings?picked=${picked}`;
}

export async function recordLinePick(userId: string): Promise<{ id: string; name: string }> {
  const supabase = getSupabaseAdmin();
  const { data: rows, error: readError } = await supabase
    .from("line_share_targets")
    .select("name")
    .eq("user_id", userId);
  if (readError) throw readError;

  const used = new Set((rows ?? []).map((row) => row.name as string));
  let index = 1;
  while (used.has(`群組 ${index}`)) index += 1;
  const name = `群組 ${index}`;

  const { data, error } = await supabase
    .from("line_share_targets")
    .insert({ user_id: userId, name })
    .select("id, name")
    .single();
  if (error || !data) throw error ?? new Error("寫入常傳名單失敗");
  return { id: data.id as string, name: data.name as string };
}
