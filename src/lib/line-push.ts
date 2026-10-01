"use client";

import { sessionAccessToken } from "./session-token";
import type { PreparedDayImage } from "./share-image";

export type LinePushResult = { targetId: string; ok: true } | { targetId: string; ok: false; reason: string };

export type LinePushOutcome =
  | { ok: true; results: LinePushResult[] }
  | { ok: false; error: string };

/**
 * 請伺服器用 Messaging API 把分享圖直接推到這些常傳對象綁定的 LINE 群組。
 * 對象有沒有綁群組、綁哪個群組，都由伺服器以帳號為準判斷。
 */
export async function pushDayImageToTargets(
  image: PreparedDayImage,
  targetIds: string[],
): Promise<LinePushOutcome> {
  if (targetIds.length === 0) return { ok: false, error: "沒有可直接發送的對象。" };

  const token = await sessionAccessToken();
  if (!token) return { ok: false, error: "請先用 LINE 登入。" };

  const form = new FormData();
  form.append("original", image.blob, image.fileName);
  form.append("preview", image.thumbnailBlob, `preview-${image.date}.jpg`);
  form.append("date", image.date);
  form.append("targetIds", JSON.stringify(targetIds));

  try {
    const response = await fetch("/api/share/line-push", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = (await response.json()) as { results?: LinePushResult[]; error?: string };
    if (!response.ok || !data.results) {
      return { ok: false, error: data.error ?? "推播失敗，請稍後再試。" };
    }
    return { ok: true, results: data.results };
  } catch {
    return { ok: false, error: "連線失敗，請稍後再試。" };
  }
}

/** 要開始「綁定 LINE 群組」流程時，向伺服器拿要在 LINE 開啟的連結。 */
export async function startLineGroupBind(): Promise<{ liffUrl: string } | { error: string }> {
  const token = await sessionAccessToken();
  if (!token) return { error: "請先用 LINE 登入。" };
  try {
    const response = await fetch("/api/line-bind/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as { liffUrl?: string; error?: string };
    if (!response.ok || !data.liffUrl) return { error: data.error ?? "無法開始綁定。" };
    return { liffUrl: data.liffUrl };
  } catch {
    return { error: "連線失敗，請稍後再試。" };
  }
}
