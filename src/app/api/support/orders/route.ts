/**
 * 目前登入使用者的付款紀錄：贊助、卜卦點數、無廣告訂閱。
 */

import { NextResponse } from "next/server";

import { requireUser } from "@/server/sharing";
import { listOrdersForUser } from "@/server/support-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const orders = await listOrdersForUser(auth.userId, auth.email);
  return NextResponse.json({
    orders: orders.map((order) => ({
      merTradeNo: order.merTradeNo,
      product: order.product,
      amount: order.amount,
      method: order.method,
      status: order.status,
      credits: order.credits,
      thisPeriod: order.thisPeriod ?? null,
      createdAt: order.createdAt,
      paidAt: order.paidAt ?? null,
    })),
  });
}
