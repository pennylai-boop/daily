/**
 * 卜卦點數已不再販售。已成立的訂單仍由金流通知入帳，這裡不再開新單。
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ error: "卜卦功能已關閉。" }, { status: 410 });
}
