/**
 * 由伺服器用 LINE Messaging API 把每日分享圖直接推到已綁定的群組。
 *
 * 前提（見 .env.example 的「LINE 推送」段）：
 * - 設定 LINE_MESSAGING_CHANNEL_ACCESS_TOKEN（與 Login channel 同一個 provider 的 Messaging API channel）。
 * - 官方帳號要在該群組裡，且成員已加官方帳號為好友。
 * - push 依「收得到訊息的人數」計費，台灣免費方案每月 200 則、用完即失敗。
 *
 * 群組 ID 只能在該群組裡開啟 LIFF 時由 liff.getContext() 取得（見 src/app/line-bind）。
 */

import { randomUUID } from "node:crypto";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { siteOrigin } from "@/server/line-pick";

const PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const SHARE_BUCKET = "day-shares";

function channelToken(): string | null {
  return process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim() || null;
}

function liffId(): string {
  return process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
}

/** 從群組裡開這個連結才綁得到；帶著網頁帳號的短效憑證。 */
export function lineBindLiffUrl(token: string): string | null {
  const id = liffId();
  if (!id) return null;
  const params = new URLSearchParams({ bindLine: "1", handoff: token });
  return `https://liff.line.me/${id}?${params.toString()}`;
}

export function lineBoundReturnUrl(bound: "1" | "0"): string {
  return `${siteOrigin()}/settings?bound=${bound}`;
}

/**
 * 把某個 LINE 群組／聊天室綁成使用者的常傳對象。
 * 已經綁過同一個 chatId 就只更新名稱時間、不重複新增。
 */
export async function recordLineGroupBind(
  userId: string,
  chatId: string,
): Promise<{ id: string; name: string }> {
  const supabase = getSupabaseAdmin();

  const { data: rows, error: readError } = await supabase
    .from("line_share_targets")
    .select("id, name, line_group_id")
    .eq("user_id", userId);
  if (readError) throw readError;

  const existing = (rows ?? []).find((row) => row.line_group_id === chatId);
  if (existing) {
    return { id: existing.id as string, name: existing.name as string };
  }

  const used = new Set((rows ?? []).map((row) => row.name as string));
  let index = 1;
  while (used.has(`群組 ${index}`)) index += 1;
  const name = `群組 ${index}`;

  const { data, error } = await supabase
    .from("line_share_targets")
    .insert({ user_id: userId, name, line_group_id: chatId })
    .select("id, name")
    .single();
  if (error || !data) throw error ?? new Error("寫入常傳名單失敗");
  return { id: data.id as string, name: data.name as string };
}

/** 讀某個常傳對象綁定的群組 ID（沒綁或不是本人的回 null）。 */
export async function lineGroupIdForTarget(
  userId: string,
  targetId: string,
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("line_share_targets")
    .select("line_group_id")
    .eq("user_id", userId)
    .eq("id", targetId)
    .maybeSingle();
  if (error) {
    console.error("[line-push] lineGroupIdForTarget", error);
    return null;
  }
  const value = data?.line_group_id;
  return typeof value === "string" && value ? value : null;
}

/**
 * 把分享圖上傳到公開 bucket，回傳給 LINE 用的原圖與預覽圖網址。
 * 預覽圖 LINE 限制 1MB，由前端另外壓一張小 JPEG 傳上來。
 */
export async function uploadDayShareImage(params: {
  userId: string;
  date: string;
  original: { bytes: Buffer; contentType: string };
  preview: { bytes: Buffer; contentType: string };
}): Promise<{ originalUrl: string; previewUrl: string }> {
  const supabase = getSupabaseAdmin();
  const stamp = randomUUID();
  const base = `${params.userId}/${params.date}-${stamp}`;
  const originalExt = params.original.contentType === "image/jpeg" ? "jpg" : "png";
  const originalPath = `${base}.${originalExt}`;
  const previewPath = `${base}-preview.jpg`;

  const [originalRes, previewRes] = await Promise.all([
    supabase.storage.from(SHARE_BUCKET).upload(originalPath, params.original.bytes, {
      contentType: params.original.contentType,
      upsert: true,
    }),
    supabase.storage.from(SHARE_BUCKET).upload(previewPath, params.preview.bytes, {
      contentType: params.preview.contentType,
      upsert: true,
    }),
  ]);
  if (originalRes.error) throw originalRes.error;
  if (previewRes.error) throw previewRes.error;

  return {
    originalUrl: supabase.storage.from(SHARE_BUCKET).getPublicUrl(originalPath).data.publicUrl,
    previewUrl: supabase.storage.from(SHARE_BUCKET).getPublicUrl(previewPath).data.publicUrl,
  };
}

export type PushResult = { ok: true } | { ok: false; reason: string };

/** 推一則圖片訊息到指定的群組／聊天室。 */
export async function pushImageToChat(params: {
  chatId: string;
  originalUrl: string;
  previewUrl: string;
}): Promise<PushResult> {
  const token = channelToken();
  if (!token) return { ok: false, reason: "伺服器還沒有設定 LINE 推播金鑰。" };

  try {
    const response = await fetch(PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: params.chatId,
        messages: [
          {
            type: "image",
            originalContentUrl: params.originalUrl,
            previewImageUrl: params.previewUrl,
          },
        ],
      }),
    });

    if (response.ok) return { ok: true };

    const detail = await response.text();
    if (response.status === 429) {
      return { ok: false, reason: "這個月的 LINE 推播額度用完了，改用「加選對象」從 LINE 傳。" };
    }
    if (response.status === 403) {
      return {
        ok: false,
        reason: "推不進這個群組：請確認官方帳號還在群組裡、且成員已加它為好友。",
      };
    }
    console.error(`[line-push] push ${response.status}: ${detail.slice(0, 300)}`);
    return { ok: false, reason: "LINE 推播失敗，請稍後再試或改用「加選對象」。" };
  } catch (error) {
    console.error("[line-push] push error", error);
    return { ok: false, reason: "連線 LINE 失敗，請稍後再試。" };
  }
}
