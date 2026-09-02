import { NextResponse } from "next/server";

import { requireUser } from "@/server/sharing";
import { addSharedPepTalk, listSharedPepTalks } from "@/server/pep-talks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const quotes = await listSharedPepTalks();
    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("[pep-talks] GET", error);
    return NextResponse.json({ quotes: [] });
  }
}

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
  const text = typeof raw.text === "string" ? raw.text : "";
  const name = typeof raw.authorName === "string" ? raw.authorName : "";

  try {
    const result = await addSharedPepTalk({
      userId: auth.userId,
      authorName: name,
      text,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ quote: result.quote });
  } catch (error) {
    console.error("[pep-talks] POST", error);
    return NextResponse.json({ error: "暫時無法新增。" }, { status: 500 });
  }
}
