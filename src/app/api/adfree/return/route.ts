/**
 * PAYUNi 續期收款前景返回。入帳以 Notify 為準，這裡只把人帶回設定頁。
 */

import { NextResponse } from "next/server";

import { parsePayuniCallback, payuniConfig } from "@/server/payuni";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const config = payuniConfig();
  const ok = new URL("/settings", origin);
  ok.searchParams.set("adfree", "ok");
  ok.hash = "adfree";

  if (!config) {
    const failed = new URL("/support/result", origin);
    failed.searchParams.set("status", "unconfigured");
    return NextResponse.redirect(failed, 303);
  }

  const form = await request.formData();
  const callback = parsePayuniCallback(form, config);
  if (callback?.status === "SUCCESS") {
    return NextResponse.redirect(ok, 303);
  }

  const failed = new URL("/support/result", origin);
  failed.searchParams.set("status", callback?.status || "invalid");
  if (callback?.message) failed.searchParams.set("message", callback.message);
  if (callback?.merTradeNo) failed.searchParams.set("no", callback.merTradeNo);
  return NextResponse.redirect(failed, 303);
}

/**
 * PAYUNi 偶爾用 GET 帶人回來，這時沒有可驗證的回傳內容，
 * 所以只把人帶回設定頁、不宣告成功——實際狀態由那一頁自己去問 /api/adfree/status。
 */
export async function GET(request: Request) {
  const target = new URL("/settings", new URL(request.url).origin);
  target.hash = "adfree";
  return NextResponse.redirect(target, 303);
}
