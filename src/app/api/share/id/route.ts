import { NextResponse } from "next/server";

import { ensureShareId, requireUser } from "@/server/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const id = await ensureShareId(auth.userId);
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "讀取分享 ID 失敗。" }, { status: 500 });
  }
}
