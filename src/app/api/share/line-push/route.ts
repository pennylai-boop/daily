/**
 * 「傳送今天」直接推播到已綁定的 LINE 群組。
 *
 * 收 multipart：original（分享圖 PNG）、preview（小張 JPEG）、date、targetIds（JSON 陣列）。
 * 群組 ID 一律以伺服器端用 (userId, targetId) 查 line_share_targets 為準，
 * 前端不能自己指定要推到哪個群組。
 */

import { NextResponse } from "next/server";

import { lineGroupIdForTarget, pushImageToChat, uploadDayShareImage } from "@/server/line-push";
import { requireUser } from "@/server/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ORIGINAL = 10 * 1024 * 1024;
const MAX_PREVIEW = 1 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }

  const original = form.get("original");
  const preview = form.get("preview");
  const date = typeof form.get("date") === "string" ? (form.get("date") as string) : "";
  let targetIds: string[] = [];
  try {
    const parsed = JSON.parse((form.get("targetIds") as string) ?? "[]");
    if (Array.isArray(parsed)) targetIds = parsed.filter((id): id is string => typeof id === "string");
  } catch {
    /* 下面會擋空陣列 */
  }

  if (!(original instanceof Blob) || !(preview instanceof Blob)) {
    return NextResponse.json({ error: "缺少圖片。" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日期格式不正確。" }, { status: 400 });
  }
  if (targetIds.length === 0) {
    return NextResponse.json({ error: "沒有指定要推播的對象。" }, { status: 400 });
  }
  if (original.size > MAX_ORIGINAL || preview.size > MAX_PREVIEW) {
    return NextResponse.json({ error: "圖片太大，無法推播。" }, { status: 413 });
  }

  // 先把每個對象的群組 ID 查出來（以伺服器資料為準）。
  const resolved = await Promise.all(
    targetIds.map(async (id) => ({ id, chatId: await lineGroupIdForTarget(auth.userId, id) })),
  );
  const pushable = resolved.filter((t): t is { id: string; chatId: string } => Boolean(t.chatId));
  if (pushable.length === 0) {
    return NextResponse.json(
      { error: "這些對象都還沒綁定 LINE 群組，請先在設定裡綁定。" },
      { status: 400 },
    );
  }

  let uploaded: { originalUrl: string; previewUrl: string };
  try {
    uploaded = await uploadDayShareImage({
      userId: auth.userId,
      date,
      original: {
        bytes: Buffer.from(await original.arrayBuffer()),
        contentType: original.type === "image/jpeg" ? "image/jpeg" : "image/png",
      },
      preview: {
        bytes: Buffer.from(await preview.arrayBuffer()),
        contentType: "image/jpeg",
      },
    });
  } catch (error) {
    console.error("[line-push] upload", error);
    return NextResponse.json({ error: "圖片上傳失敗，請稍後再試。" }, { status: 502 });
  }

  const results = await Promise.all(
    resolved.map(async ({ id, chatId }) => {
      if (!chatId) return { targetId: id, ok: false as const, reason: "還沒綁定 LINE 群組。" };
      const outcome = await pushImageToChat({
        chatId,
        originalUrl: uploaded.originalUrl,
        previewUrl: uploaded.previewUrl,
      });
      return outcome.ok
        ? { targetId: id, ok: true as const }
        : { targetId: id, ok: false as const, reason: outcome.reason };
    }),
  );

  return NextResponse.json({ results });
}
