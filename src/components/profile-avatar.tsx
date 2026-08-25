"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import type { Profile } from "@/lib/types";

/**
 * LINE 登入後的頭貼。沒圖就用顯示名稱首字；尚未連結 LINE 時是淡色占位，
 * 點下去都進設定（之後登入入口也會放在那）。
 */
export function ProfileAvatar({
  profile,
  className,
  size = 32,
  onNavigate,
}: {
  profile: Profile;
  className?: string;
  size?: number;
  /** 放在手機抽屜裡時用來順手關掉抽屜（已經在 /settings 的話不會換頁，不會自己關）。 */
  onNavigate?: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const loggedIn = Boolean(profile.lineUserId);
  const showImage = Boolean(profile.avatarUrl) && !broken;
  const initial = (profile.name.trim() || "我").slice(0, 1);

  return (
    <Link
      href="/settings"
      onClick={onNavigate}
      aria-label={loggedIn ? `${profile.name || "我的帳號"}` : "登入與設定"}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-muted text-sm font-semibold text-ink transition-opacity hover:opacity-90",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        // LINE pictureUrl 來自外部 CDN，用原生 img 避開 next/image 網域白名單。
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatarUrl!}
          alt=""
          width={size}
          height={size}
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            "flex size-full items-center justify-center",
            loggedIn ? "bg-brand text-on-brand" : "bg-paper text-ink-subtle",
          )}
        >
          {loggedIn ? initial : "?"}
        </span>
      )}
    </Link>
  );
}
