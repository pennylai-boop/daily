"use client";

import { useState } from "react";

import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { SIGN_OUT_CONFIRM, maskLineUserId, performSignOut } from "@/lib/account";
import { signInWithLine } from "@/lib/line-auth";
import type { Profile } from "@/lib/types";

/**
 * 手機側邊選單底部的帳號區。手機版頂端列不放頭貼，登入的身分只在這裡露出，
 * 所以未登入時也要給得去登入的入口。
 */
export function AccountFooter({
  profile,
  className,
  onNavigate,
}: {
  profile: Profile;
  className?: string;
  onNavigate?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loggedIn = Boolean(profile.lineUserId);

  const login = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await signInWithLine();
      if (result.status === "unavailable") setError(result.reason);
    } catch {
      setError("LINE 登入沒有成功，請稍後再試。");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    if (!window.confirm(SIGN_OUT_CONFIRM)) return;
    setBusy(true);
    await performSignOut();
    setBusy(false);
    onNavigate?.();
  };

  if (!loggedIn) {
    return (
      <div className={cn("border-t border-line pt-4", className)}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void login()}
        >
          {busy ? "前往 LINE…" : "用 LINE 登入"}
        </Button>
        {error ? <p className="mt-2 text-[13px] text-ink-muted">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 border-t border-line pt-4", className)}>
      <ProfileAvatar profile={profile} size={36} onNavigate={onNavigate} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{profile.name || "LINE 使用者"}</p>
        <p className="mt-0.5 truncate text-xs text-ink-subtle">
          LINE {maskLineUserId(profile.lineUserId)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() => void logout()}
        className="shrink-0 px-2"
      >
        {busy ? "登出中…" : "登出"}
      </Button>
    </div>
  );
}
