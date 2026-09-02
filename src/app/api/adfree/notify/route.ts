/**
 * PAYUNi 續期收款每期授權通知。
 * 首期與之後每月扣款都走這裡；同一期重送不會重複加效期。
 */

import { processAdFreePeriodPayment } from "@/server/adfree-period";
import { isPeriodCallback, parsePayuniCallback, payuniConfig, toPeriodCallback } from "@/server/payuni";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = payuniConfig();
  if (!config) return new Response("unconfigured", { status: 503 });

  const form = await request.formData();
  const callback = parsePayuniCallback(form, config);
  if (!callback) return new Response("invalid", { status: 400 });

  if (isPeriodCallback(callback)) {
    await processAdFreePeriodPayment(toPeriodCallback(callback));
  }

  return new Response("OK");
}
