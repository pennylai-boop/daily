"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, PageHeading, TextLink } from "@/components/ui/surfaces";
import { startAdFreeCheckout } from "@/lib/adfree-checkout";
import { ADFREE_AMOUNT, formatAdFreeUntil, isAdFreeActive } from "@/lib/adfree";
import { signInWithLine } from "@/lib/line-auth";
import { formatAmount } from "@/lib/support";
import { refreshAdFreeStatus, useDailyStore } from "@/lib/store";

export function AdFreeStart({ paymentReady }: { paymentReady: boolean }) {
  const { state, ready } = useDailyStore();
  const loggedIn = Boolean(state.settings.profile.lineUserId);
  const until = state.settings.adFreeUntil;
  const active = isAdFreeActive(until);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loggedIn) void refreshAdFreeStatus();
  }, [loggedIn]);

  useEffect(() => {
    if (!ready || !paymentReady || busy || notice) return;
    if (!loggedIn) {
      setBusy(true);
      void signInWithLine().then((result) => {
        if (result.status === "unavailable") {
          setNotice(result.reason);
          setBusy(false);
        }
      });
      return;
    }
    if (active) return;
    setBusy(true);
    void startAdFreeCheckout().then((failure) => {
      if (failure) {
        setNotice(failure.error);
        setBusy(false);
      }
    });
  }, [ready, loggedIn, paymentReady, busy, notice, active]);

  const login = async () => {
    setBusy(true);
    const result = await signInWithLine();
    if (result.status === "unavailable") {
      setNotice(result.reason);
      setBusy(false);
    }
  };

  const retry = async () => {
    setNotice(null);
    setBusy(true);
    const failure = await startAdFreeCheckout();
    if (failure) {
      setNotice(failure.error);
      setBusy(false);
    }
  };

  return (
    <div className="hide-in-ios-app mx-auto max-w-xl space-y-6">
      <PageHeading
        title="訂閱無廣告"
        description={`每月 ${formatAmount(ADFREE_AMOUNT)}，信用卡自動續約。付款頁由 PAYUNi 處理，卡號不會經過天天 daily。`}
      />

      {ready && active && until ? (
        <p className="rounded-lg bg-accent-tint px-3.5 py-2.5 text-[13px] text-ink">
          目前已是無廣告版，有效至 {formatAdFreeUntil(until)}。再訂一次會從原到期日接著算，並繼續每月自動扣款。
        </p>
      ) : null}

      {!paymentReady ? (
        <Card className="px-4 py-4 sm:px-5">
          <p className="text-sm font-medium text-ink">金流尚未設定</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            這個環境還沒有填入 PAYUNi 的商店代號與串接金鑰，暫時無法送出訂閱。
          </p>
        </Card>
      ) : !ready ? (
        <p className="text-[13px] text-ink-muted">讀取中…</p>
      ) : !loggedIn ? (
        <Card className="space-y-3 px-4 py-4 sm:px-5">
          <p className="text-[13px] leading-relaxed text-ink-muted">
            請先用 LINE 登入，訂閱才綁得上你的帳號，換裝置也接得回來。登入後會直接前往付款頁。
          </p>
          <Button size="lg" disabled={busy} onClick={() => void login()}>
            {busy ? "前往登入…" : "用 LINE 登入並前往付款"}
          </Button>
        </Card>
      ) : (
        <Card className="space-y-3 px-4 py-4 sm:px-5">
          <p className="text-[13px] leading-relaxed text-ink-muted">
            {active
              ? "你已經在訂閱中，之後每月會自動扣款。如需取消請到支持頁留言。"
              : busy
                ? "正在前往 PAYUNi 付款頁，請稍候…"
                : "每月自動扣款，發票會在扣款成功後開立。"}
          </p>
          {notice ? <p className="text-[13px] font-semibold text-alert">{notice}</p> : null}
          {notice ? (
            <Button size="lg" disabled={busy} onClick={() => void retry()}>
              {busy ? "前往付款…" : "再試一次"}
            </Button>
          ) : null}
        </Card>
      )}

      <p className="text-[13px] text-ink-subtle">
        如需取消續約，請到 <TextLink href="/support">支持頁留言</TextLink>。
      </p>
    </div>
  );
}
