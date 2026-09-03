/**
 * 終止無廣告訂閱的每月自動扣款。必須已登入。
 *
 * 已付費的效期不收回：PAYUNi 那邊終止約定，expires_at 留著讓它自然走完。
 * 文件註明終止後同一張約定無法再啟用，所以要再訂閱是重新建立一張（走 /adfree）。
 */

import { NextResponse } from "next/server";

import { getAdFreeSubscription, markAdFreeCancelled } from "@/server/adfree";
import { payuniConfig } from "@/server/payuni";
import { endPeriodAgreement } from "@/server/payuni-period-api";
import { requireUser } from "@/server/sharing";
import { sendAdFreeCancelled } from "@/server/thank-you-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const subscription = await getAdFreeSubscription(auth.userId);

  if (subscription.status === "cancelled") {
    return NextResponse.json({ ok: true, until: subscription.until, alreadyCancelled: true });
  }

  if (!subscription.periodTradeNo) {
    // 首期還沒授權完成時我們還沒拿到續期單號，這時候沒有東西可以終止。
    return NextResponse.json(
      { error: "還沒有可以取消的訂閱。若剛完成付款請稍後再試。" },
      { status: 409 },
    );
  }

  const config = payuniConfig();
  if (!config) {
    return NextResponse.json({ error: "尚未設定金流憑證，暫時無法取消。" }, { status: 503 });
  }

  const ended = await endPeriodAgreement(config, subscription.periodTradeNo);
  if (!ended.ok) {
    console.error(
      `[adfree/cancel] 終止約定失敗 user=${auth.userId} period=${subscription.periodTradeNo}：${ended.message}`,
    );
    return NextResponse.json(
      { error: "PAYUNi 目前無法終止這筆訂閱，請稍後再試或與我們聯絡。" },
      { status: 502 },
    );
  }

  await markAdFreeCancelled(auth.userId);

  if (auth.email) {
    const mail = await sendAdFreeCancelled({
      email: auth.email,
      name: "",
      until: subscription.until,
    });
    if (!mail.ok) console.error("[adfree/cancel] 取消通知信寄送失敗：", mail.message);
  }

  return NextResponse.json({ ok: true, until: subscription.until });
}
