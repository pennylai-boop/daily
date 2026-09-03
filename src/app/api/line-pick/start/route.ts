import { NextResponse } from "next/server";

import { linePickLiffUrl, signLinePickToken } from "@/server/line-pick";
import { requireUser } from "@/server/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const token = signLinePickToken(auth.userId);
    const liffUrl = linePickLiffUrl(token);
    if (!liffUrl) {
      return NextResponse.json({ error: "這個環境還沒有設定 LIFF。" }, { status: 500 });
    }
    return NextResponse.json({ token, liffUrl });
  } catch (error) {
    console.error("[line-pick] start", error);
    return NextResponse.json({ error: "無法開啟 LINE。" }, { status: 500 });
  }
}
