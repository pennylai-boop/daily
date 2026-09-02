import { NextResponse } from "next/server";

import { isShareId } from "@/lib/storage";
import { addViewerByShareId, requireUser } from "@/server/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const token = typeof raw.token === "string" ? raw.token.trim().toUpperCase() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!isShareId(token)) {
    return NextResponse.json({ error: "請輸入對方 8 碼的分享 ID。" }, { status: 400 });
  }

  const result = await addViewerByShareId(auth.userId, token, name);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, viewerName: result.viewerName });
}
