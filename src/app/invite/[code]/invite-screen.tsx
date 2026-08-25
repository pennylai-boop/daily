"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, EmptyState, SectionHeading, TextLink } from "@/components/ui/surfaces";
import { signInWithLine } from "@/lib/line-auth";
import { useDailyStore } from "@/lib/store";
import type { ShareScope } from "@/lib/types";

type Preview =
  | { status: "loading" }
  | { status: "ready"; ownerName: string; scope: ShareScope }
  | { status: "not-found" };

/**
 * 邀請頁。先不登入也能看到「誰想分享給你、分享範圍是什麼」（/api/invite/[token] 的預覽），
 * 按下接受才要求用 LINE 登入，登入完成後由 app-shell 的 session 監聽自動同步，
 * 這裡再呼叫 store.acceptInvite 建立分享關係。
 */
export function InviteScreen({ code }: { code: string }) {
  const store = useDailyStore();
  const { profile, ready } = { profile: store.state.settings.profile, ready: store.ready };
  const loggedIn = Boolean(profile.lineUserId);

  const [preview, setPreview] = useState<Preview>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState<{ ownerName: string; scope: ShareScope } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/invite/${encodeURIComponent(code)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { ownerName?: string; scope?: ShareScope } | null) => {
        if (cancelled) return;
        if (data?.ownerName && data.scope) {
          setPreview({ status: "ready", ownerName: data.ownerName, scope: data.scope });
        } else {
          setPreview({ status: "not-found" });
        }
      })
      .catch(() => {
        if (!cancelled) setPreview({ status: "not-found" });
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const acceptNow = async () => {
    setBusy(true);
    setError(null);
    const result = await store.acceptInvite(code);
    setBusy(false);
    if (result.ok) {
      setAccepted({ ownerName: result.ownerName, scope: preview.status === "ready" ? preview.scope : "full" });
    } else {
      setError(result.error);
    }
  };

  const login = async () => {
    setBusy(true);
    const result = await signInWithLine();
    if (result.status === "unavailable") {
      setError(result.reason);
      setBusy(false);
    }
    // redirect：頁面會整個轉去 LINE 登入，回來後仍停在這個網址，使用者再按一次「接受」即可。
  };

  if (!ready || preview.status === "loading") {
    return (
      <div className="mx-auto max-w-lg space-y-4" aria-busy>
        <div className="h-8 w-40 rounded-lg bg-paper-tint" />
        <div className="h-40 rounded-xl bg-paper-tint" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">接受分享邀請</h1>
        <p className="text-sm text-ink-muted">
          邀請碼 <span className="font-medium tabular-nums text-ink">{code}</span>
        </p>
      </header>

      {preview.status === "not-found" ? (
        <Card>
          <EmptyState
            emoji="🔍"
            title="找不到這張邀請"
            description="邀請碼可能已經被使用或輸入有誤，請請對方重新在「設定 → 分享給誰看」送一次邀請。"
            action={<TextLink href="/">回到日曆 →</TextLink>}
          />
        </Card>
      ) : accepted ? (
        <Card className="px-4 py-5 sm:px-5">
          <SectionHeading
            title="已經接受了"
            description={`${accepted.ownerName}的紀錄會出現在你的「被分享紀錄」，分享範圍是${
              accepted.scope === "full" ? "完整內容" : "只有心情"
            }。`}
          />
          <div className="mt-4">
            <TextLink href="/shared">前往被分享紀錄 →</TextLink>
          </div>
        </Card>
      ) : (
        <Card className="space-y-4 px-4 py-5 sm:px-5">
          <SectionHeading
            title={`${preview.ownerName}想把每天的紀錄分享給你`}
            description={
              preview.scope === "full"
                ? "接受後你可以看到對方每天的書寫內容與目標。"
                : "接受後你只會看到對方每天的心情，書寫內容不會顯示。"
            }
          />

          {loggedIn ? (
            <Button size="lg" className="w-full" disabled={busy} onClick={() => void acceptNow()}>
              {busy ? "接受中…" : "接受這張邀請"}
            </Button>
          ) : (
            <Button size="lg" className="w-full" disabled={busy} onClick={() => void login()}>
              {busy ? "前往 LINE…" : "用 LINE 登入並接受"}
            </Button>
          )}

          {error ? <p className="text-[13px] font-semibold text-alert">{error}</p> : null}

          <p className="text-[13px] leading-relaxed text-ink-subtle">
            登入後兩邊的身分都是 LINE 驗證過的 userId，不需要交換 email。
          </p>
        </Card>
      )}
    </div>
  );
}
