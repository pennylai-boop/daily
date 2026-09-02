"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, Chip, SectionHeading } from "@/components/ui/surfaces";
import { signInWithLine } from "@/lib/line-auth";
import { sessionAccessToken } from "@/lib/session-token";
import { formatAmount, getMethod, type SponsorMethod } from "@/lib/support";
import { useDailyStore } from "@/lib/store";

type OrderProduct = "sponsor" | "credits" | "adfree";
type OrderStatus = "pending" | "awaiting_payment" | "paid" | "failed";

interface PaymentRecord {
  merTradeNo: string;
  product: OrderProduct;
  amount: number;
  method: SponsorMethod;
  status: OrderStatus;
  credits: number;
  thisPeriod: number | null;
  createdAt: number;
  paidAt: number | null;
}

const PRODUCT_LABEL: Record<OrderProduct, string> = {
  sponsor: "贊助",
  credits: "卜卦點數",
  adfree: "無廣告訂閱",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "待付款",
  awaiting_payment: "待繳費",
  paid: "已付款",
  failed: "未完成",
};

export function PaymentHistory() {
  const { state, ready } = useDailyStore();
  const loggedIn = Boolean(state.settings.profile.lineUserId);
  const [orders, setOrders] = useState<PaymentRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  useEffect(() => {
    if (!ready || !loggedIn) {
      setOrders(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const token = await sessionAccessToken();
      if (!token) {
        if (!cancelled) setError("請重新登入後再查看付款紀錄。");
        return;
      }
      try {
        const response = await fetch("/api/support/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await response.json()) as { orders?: PaymentRecord[]; error?: string };
        if (!response.ok) {
          if (!cancelled) setError(data.error ?? "讀取付款紀錄失敗。");
          return;
        }
        if (!cancelled) {
          setError(null);
          setOrders(data.orders ?? []);
        }
      } catch {
        if (!cancelled) setError("連線失敗，請稍後再試。");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, loggedIn]);

  const login = async () => {
    setLoginBusy(true);
    const result = await signInWithLine();
    if (result.status === "unavailable") setError(result.reason);
    setLoginBusy(false);
  };

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="付款紀錄"
        description="包含贊助、卜卦點數與無廣告訂閱。登入後下的單會綁在帳號上；舊的贊助若信箱相同也會列出來。"
        action={
          loggedIn ? undefined : (
            <Button
              type="button"
              size="sm"
              className="shrink-0"
              variant="secondary"
              disabled={!ready || loginBusy}
              onClick={() => void login()}
            >
              {loginBusy ? "前往登入…" : "用 LINE 登入"}
            </Button>
          )
        }
      />

      {!ready ? (
        <p className="mt-4 text-[13px] text-ink-muted">讀取中…</p>
      ) : !loggedIn ? (
        <p className="mt-4 text-[13px] text-ink-muted">用 LINE 登入後可查看你的付款紀錄。</p>
      ) : error ? (
        <p className="mt-4 text-[13px] font-semibold text-alert">{error}</p>
      ) : orders === null ? (
        <p className="mt-4 text-[13px] text-ink-muted">讀取中…</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-[13px] text-ink-muted">還沒有付款紀錄。</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {orders.map((order) => (
            <li key={order.merTradeNo} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {PRODUCT_LABEL[order.product]}
                  {order.product === "credits" && order.credits > 0 ? ` ${order.credits} 點` : ""}
                  {order.product === "adfree" && order.thisPeriod
                    ? ` 第 ${order.thisPeriod} 期`
                    : ""}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-subtle">
                  {formatWhen(order.paidAt ?? order.createdAt)} · {getMethod(order.method).label}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-ink-subtle">訂單 {order.merTradeNo}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-ink">{formatAmount(order.amount)}</p>
                <Chip tone={order.status === "paid" ? "accent" : "neutral"} className="mt-1">
                  {STATUS_LABEL[order.status]}
                </Chip>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function formatWhen(at: number): string {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(at));
}
