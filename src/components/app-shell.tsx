"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  CalendarIcon,
  GearIcon,
  RepeatIcon,
  SparkIcon,
  SunIcon,
  UsersIcon,
} from "@/components/icons";
import { cn } from "@/components/ui/cn";

/** primary 的項目在手機版顯示為底部分頁，其餘收進手機版頂端列。 */
const NAV_ITEMS = [
  { href: "/", label: "日曆", Icon: CalendarIcon, primary: true },
  { href: "/routines", label: "定期事項", Icon: RepeatIcon, primary: true },
  { href: "/insights", label: "回顧", Icon: SparkIcon, primary: true },
  { href: "/shared", label: "被分享紀錄", Icon: UsersIcon, primary: true },
  { href: "/settings", label: "設定", Icon: GearIcon, primary: false },
] as const;

const TAB_ITEMS = NAV_ITEMS.filter((item) => item.primary);
const TOP_ITEMS = NAV_ITEMS.filter((item) => !item.primary);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/entry") : pathname.startsWith(href);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col lg:flex-row">
      <aside className="hidden shrink-0 border-r border-line bg-surface px-4 py-8 lg:flex lg:w-60 lg:flex-col">
        <BrandMark />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive(href)
                  ? "bg-brand font-medium text-on-brand"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto pt-8 text-xs leading-relaxed text-ink-subtle">
          資料目前儲存在這台裝置的瀏覽器中。
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center gap-1 px-4 pt-[env(safe-area-inset-top)]">
            <BrandMark compact />
            <div className="ml-auto flex items-center gap-0.5">
              {TOP_ITEMS.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg transition-colors active:bg-surface-muted",
                    isActive(href) ? "bg-brand text-on-brand" : "text-ink-muted",
                  )}
                >
                  <Icon className="size-[21px]" />
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-[calc(64px+env(safe-area-inset-bottom)+20px)] sm:px-6 lg:px-10 lg:pt-10 lg:pb-14">
          {children}
        </main>
      </div>

      <nav
        aria-label="主要分頁"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface shadow-[0_-2px_10px_rgba(17,24,39,0.08)] lg:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {TAB_ITEMS.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 px-0.5 text-[11px] transition-colors",
                  isActive(href) ? "bg-brand font-bold text-on-brand" : "text-ink-muted font-medium",
                )}
              >
                <Icon className="size-6" strokeWidth={isActive(href) ? 2.2 : 1.8} />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
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
