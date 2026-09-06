/**
 * 把一段文字（打字或語音辨識來的）整理成當天紀錄的欄位。
 *
 * 打字整理開放給所有登入者；語音輸入本身是訂閱功能，但辨識在瀏覽器端做，
 * 所以那道關卡放在前端（未訂閱按麥克風就導去訂閱頁），這裡只擋沒登入的請求。
 */

import { NextResponse } from "next/server";

import type { TemplateId } from "@/lib/types";
import { fillEntryFromSpeech } from "@/server/entry-fill";
import { requireUser } from "@/server/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATE_IDS: TemplateId[] = ["diary", "gratitude", "mindfulness", "timer", "metric"];

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "請求格式不正確。" }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const transcript = typeof raw.transcript === "string" ? raw.transcript : "";
  if (!transcript.trim()) {
    return NextResponse.json({ error: "沒有可整理的內容。" }, { status: 400 });
  }

  const templates = Array.isArray(raw.templates)
    ? (raw.templates.filter(
        (id): id is TemplateId => typeof id === "string" && TEMPLATE_IDS.includes(id as TemplateId),
      ) as TemplateId[])
    : [];
  const metricLabels = Array.isArray(raw.metricLabels)
    ? raw.metricLabels
        .map((label) => (typeof label === "string" ? label.trim() : ""))
        .filter((label) => label.length > 0)
        .slice(0, 30)
    : [];

  const outcome = await fillEntryFromSpeech({ transcript, templates, metricLabels });
  if (!outcome.ok) {
    console.error(`[entry/voice-fill] ${outcome.message}`);
    return NextResponse.json({ error: "語音整理失敗，請稍後再試或直接打字。" }, { status: 502 });
  }

  return NextResponse.json({ result: outcome.result });
}
