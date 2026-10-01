/**
 * 數字卜卦已關閉。舊的付款通知仍由 /api/support/notify 處理，這裡不再起卦。
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ error: "卜卦功能已關閉。" }, { status: 410 });
}
