/**
 * 無廣告訂閱狀態。`until` 是既有欄位（store 用它決定要不要顯示廣告），
 * 其餘欄位給設定頁顯示下次扣款日、已取消、扣款失敗等狀態。
 */

import { NextResponse } from "next/server";

import { getAdFreeSubscription } from "@/server/adfree";
import { requireUser } from "@/server/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const subscription = await getAdFreeSubscription(auth.userId);
  return NextResponse.json({
    until: subscription.until,
    status: subscription.status,
    nextChargeAt: subscription.nextChargeAt,
    cancelledAt: subscription.cancelledAt,
    lastFailureAt: subscription.lastFailureAt,
    lastFailureReason: subscription.lastFailureReason,
    /** 首期還沒授權完成前拿不到續期單號，此時還不能取消。 */
    cancellable: subscription.status === "active" && Boolean(subscription.periodTradeNo),
  });
}
