"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/segmented";
import { Card, SectionHeading } from "@/components/ui/surfaces";
import { ADFREE_AMOUNT, formatAdFreeUntil, isAdFreeActive } from "@/lib/adfree";
import { formatAmount } from "@/lib/support";
import { refreshAdFreeStatus, useDailyStore } from "@/lib/store";

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
  const [localNotice, setLocalNotice] = useState<string | null>(notice ?? null);

  useEffect(() => {
    if (loggedIn) void refreshAdFreeStatus();
  }, [loggedIn]);

  useEffect(() => {
    if (notice) setLocalNotice(notice);
  }, [notice]);

  const toggle = (on: boolean) => {
    if (on) {
      router.push("/adfree");
      return;
    }
    if (active) {
      setLocalNotice("訂閱仍有效。如需取消續約，請到支持頁留言。");
    }
  };

  return (
    <div id="adfree" className="hide-in-ios-app scroll-mt-20">
      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading
          title="無廣告訂閱"
          description={`最下排廣告每月 ${formatAmount(ADFREE_AMOUNT)}，信用卡自動續約。打開開關會直接到付款頁。`}
          action={<Switch checked={active} onChange={toggle} label="無廣告訂閱" />}
        />

        {ready && active && until ? (
          <p className="mt-3 text-[13px] text-ink-muted">有效至 {formatAdFreeUntil(until)}</p>
        ) : null}

        {localNotice ? <p className="mt-3 text-[13px] text-ink-muted">{localNotice}</p> : null}
      </Card>
    </div>
  );
}
