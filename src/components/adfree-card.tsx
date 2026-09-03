"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, SectionHeading } from "@/components/ui/surfaces";
import {
  cancelAdFree,
  fetchAdFreeSubscription,
  type AdFreeSubscriptionView,
} from "@/lib/adfree-checkout";
import { ADFREE_AMOUNT, formatAdFreeUntil, isAdFreeActive } from "@/lib/adfree";
import { formatAmount } from "@/lib/support";
import { refreshAdFreeStatus, useDailyStore } from "@/lib/store";

const CANCEL_CONFIRM =
  "取消後就不再每月扣款。已經付費的天數不會消失，會用到效期結束為止。要取消嗎？";

export function AdFreeCard({
  notice,
}: {
  paymentReady?: boolean;
  notice?: string | null;
}) {
  const router = useRouter();
  const { state, ready } = useDailyStore();
  const loggedIn = Boolean(state.settings.profile.lineUserId);
  const until = state.settings.adFreeUntil;
  const active = isAdFreeActive(until);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<AdFreeSubscriptionView | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    void refreshAdFreeStatus();
    void fetchAdFreeSubscription().then((data) => {
      if (!cancelled) setSubscription(data);
    });
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  const cancel = async () => {
    if (!window.confirm(CANCEL_CONFIRM)) return;
    setBusy(true);
    setActionNotice(null);
    const result = await cancelAdFree();
    if (result.ok) {
      setActionNotice(
        result.until
          ? `已取消每月扣款。無廣告版仍可用到 ${formatAdFreeUntil(result.until)}。`
          : "已取消每月扣款。",
      );
      setSubscription(await fetchAdFreeSubscription());
    } else {
      setActionNotice(result.error);
    }
    setBusy(false);
  };

  const cancelled = subscription?.status === "cancelled";
  const failure = subscription?.lastFailureReason ?? null;
  const message = actionNotice ?? notice ?? null;

  return (
    <div id="adfree" className="hide-in-ios-app scroll-mt-20">
      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading
          title="無廣告訂閱"
          description={`最下排廣告每月 ${formatAmount(ADFREE_AMOUNT)}，信用卡自動續約。`}
          action={
            active && !cancelled ? null : (
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={() => router.push("/adfree")}
              >
                {cancelled ? "重新訂閱" : `訂閱無廣告 ${formatAmount(ADFREE_AMOUNT)}`}
              </Button>
            )
          }
        />

        {ready && active && until ? (
          <p className="mt-3 text-[13px] text-ink-muted">有效至 {formatAdFreeUntil(until)}</p>
        ) : null}

        {cancelled ? (
          <p className="mt-1 text-[13px] text-ink-muted">
            已取消每月扣款，效期結束後廣告會回來。要繼續的話重新訂閱一次即可。
          </p>
        ) : subscription?.nextChargeAt ? (
          <p className="mt-1 text-[13px] text-ink-muted">
            下次扣款 {formatAdFreeUntil(subscription.nextChargeAt)}
          </p>
        ) : null}

        {failure ? (
          <p className="mt-3 text-[13px] leading-relaxed text-alert">
            上一期扣款沒有成功（{failure}）。系統會再重試；想換卡的話請先取消再重新訂閱。
          </p>
        ) : null}

        {message ? <p className="mt-3 text-[13px] text-ink-muted">{message}</p> : null}

        {subscription?.cancellable ? (
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => void cancel()}
            >
              {busy ? "取消中…" : "取消訂閱"}
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
