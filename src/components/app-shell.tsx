"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  CalendarIcon,
  GearIcon,
  HeartIcon,
  RepeatIcon,
  SparkIcon,
  SunIcon,
  UsersIcon,
} from "@/components/icons";
import { PepTalkBanner } from "@/components/pep-talk-banner";
import { ProfileAvatar } from "@/components/profile-avatar";
import { cn } from "@/components/ui/cn";
import { resolvePepTalks } from "@/lib/pep-talk";
import { useDailyStore } from "@/lib/store";

/**
 * primary 的項目在手機版顯示為底部分頁，其餘收進手機版頂端列。
 * hideInIosApp 的項目在 iOS App 內會被 CSS 隱藏（App Store 規則，見 README 的「包成 App」）。
 */
const NAV_ITEMS = [
  { href: "/", label: "日曆", Icon: CalendarIcon, primary: true, hideInIosApp: false },
  { href: "/routines", label: "定期目標", Icon: RepeatIcon, primary: true, hideInIosApp: false },
  { href: "/insights", label: "回顧", Icon: SparkIcon, primary: true, hideInIosApp: false },
  { href: "/shared", label: "被分享紀錄", Icon: UsersIcon, primary: true, hideInIosApp: false },
  // 手機改放右上角橘色愛心；桌機側欄仍列出。iOS App 內隱藏（App Store 規則）。
  { href: "/support", label: "支持", Icon: HeartIcon, primary: false, hideInIosApp: true },
  // 手機只靠右上角頭貼進設定；桌機側欄仍列出這一項。
  { href: "/settings", label: "設定", Icon: GearIcon, primary: false, hideInIosApp: false },
] as const;

const TAB_ITEMS = NAV_ITEMS.filter((item) => item.primary);
const SIDEBAR_ITEMS = NAV_ITEMS;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, ready } = useDailyStore();
  const pepVisible =
    ready && state.settings.pepTalk.visible && resolvePepTalks(state.settings.pepTalk.quotes).length > 0;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/entry") : pathname.startsWith(href);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <PepTalkBanner />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 border-r border-line bg-surface px-4 py-8 lg:flex lg:w-60 lg:flex-col">
          <div className="flex items-center justify-between gap-2">
            <BrandMark />
            <ProfileAvatar profile={state.settings.profile} size={36} />
          </div>
          <nav className="mt-8 flex flex-col gap-1">
            {SIDEBAR_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-brand font-medium text-on-brand"
                    : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                  item.hideInIosApp && "hide-in-ios-app",
                )}
              >
                <item.Icon
                  className={cn(
                    "size-5",
                    item.href === "/support" &&
                      (isActive(item.href) ? "text-on-brand" : "text-brand"),
                  )}
                />
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="mt-auto pt-8 text-xs leading-relaxed text-ink-subtle">
            資料目前儲存在這台裝置的瀏覽器中。
          </p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={cn(
              "z-30 bg-paper/95 backdrop-blur lg:hidden",
              pepVisible ? "relative" : "sticky top-0",
            )}
          >
            <div
              className={cn(
                "flex h-14 items-center gap-1 px-4",
                !pepVisible && "pt-[env(safe-area-inset-top)]",
              )}
            >
              <BrandMark compact />
              <div className="ml-auto flex items-center gap-2">
                <ProfileAvatar profile={state.settings.profile} size={32} />
                <Link
                  href="/support"
                  aria-label="支持"
                  aria-current={isActive("/support") ? "page" : undefined}
                  className={cn(
                    "hide-in-ios-app flex size-8 items-center justify-center rounded-full transition-colors",
                    isActive("/support")
                      ? "bg-brand-tint ring-2 ring-brand/30"
                      : "hover:bg-brand-tint/70",
                  )}
                >
                  <HeartIcon className="size-6 text-brand" strokeWidth={1.6} />
                </Link>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pt-5 pb-[calc(66px+env(safe-area-inset-bottom)+20px)] sm:px-6 lg:px-10 lg:pt-10 lg:pb-14">
            {children}
          </main>
        </div>

        <nav
          aria-label="主要分頁"
          className="fixed inset-x-0 bottom-0 z-40 w-full min-w-0 max-w-[100dvw] border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] shadow-[0_-2px_10px_rgba(17,24,39,0.08)] lg:hidden"
        >
          {/* 列高 66px，對齊同系列 App 底部導覽。 */}
          <ul className="flex h-[66px] w-full min-w-0">
            {TAB_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href} className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-full w-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 transition-colors",
                      active ? "bg-brand text-on-brand" : "text-ink-muted",
                    )}
                  >
                    <item.Icon className="size-6 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                    <span className="w-full truncate text-center text-[11px] leading-none font-medium">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-xl bg-brand text-on-brand"
      >
        <SunIcon className="size-[22px]" strokeWidth={2} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight text-ink">天天</span>
        {!compact ? (
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-subtle">daily</span>
        ) : null}
      </span>
    </Link>
  );
}
