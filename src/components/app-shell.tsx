"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { AccountFooter } from "@/components/account-footer";
import { AuthLocalhostBounce } from "@/components/auth-localhost-bounce";
import { AdBanner } from "@/components/ad-banner";
import { FocusLock } from "@/components/focus-lock";
import {
  CalendarIcon,
  CloseIcon,
  FocusIcon,
  GearIcon,
  HeartIcon,
  HexagramIcon,
  MenuIcon,
  RepeatIcon,
  SparkIcon,
  SunIcon,
  UsersIcon,
} from "@/components/icons";
import { PepTalkBanner } from "@/components/pep-talk-banner";
import { PointsBadge } from "@/components/points-badge";
import { ProfileAvatar } from "@/components/profile-avatar";
import { cn } from "@/components/ui/cn";
import { resolvePepTalks } from "@/lib/pep-talk";
import { isAdFreeActive } from "@/lib/adfree";
import { refreshAdFreeStatus, refreshSharedPepTalks, signOut, syncOnLogin, useDailyStore } from "@/lib/store";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { currentUserId } from "@/lib/supabase-sync";
import type { Profile } from "@/lib/types";

/**
 * primary 的項目在手機版顯示為底部分頁，其餘收進左側抽屜。
 * hideInIosApp 的項目在 iOS App 內會被 CSS 隱藏（App Store 規則，見 README 的「包成 App」）。
 */
const NAV_ITEMS = [
  { href: "/", label: "日曆", shortLabel: "日曆", Icon: CalendarIcon, primary: true, hideInIosApp: false },
  { href: "/routines", label: "定期目標", shortLabel: "定期目標", Icon: RepeatIcon, primary: true, hideInIosApp: false },
  { href: "/focus", label: "專心模式", shortLabel: "專心", Icon: FocusIcon, primary: true, hideInIosApp: false },
  { href: "/insights", label: "回顧", shortLabel: "回顧", Icon: SparkIcon, primary: true, hideInIosApp: false },
  { href: "/shared", label: "被分享紀錄", shortLabel: "被分享", Icon: UsersIcon, primary: true, hideInIosApp: false },
  { href: "/divination", label: "卜卦", shortLabel: "卜卦", Icon: HexagramIcon, primary: false, hideInIosApp: false },
  // 手機另有右上角橘色愛心；桌機側欄仍列出。iOS App 內隱藏（App Store 規則）。
  { href: "/support", label: "支持", shortLabel: "支持", Icon: HeartIcon, primary: false, hideInIosApp: true },
  { href: "/settings", label: "設定", shortLabel: "設定", Icon: GearIcon, primary: false, hideInIosApp: false },
] as const;

const TAB_ITEMS = NAV_ITEMS.filter((item) => item.primary);
const SIDEBAR_ITEMS = NAV_ITEMS;

function isActiveHref(pathname: string, href: string) {
  return href === "/" ? pathname === "/" || pathname.startsWith("/entry") : pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, ready } = useDailyStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);
  const pepVisible =
    ready &&
    state.settings.pepTalk.visible &&
    resolvePepTalks(state.sharedPepTalks).length > 0;
  // 登入後資料會同步到帳號，「只在這台裝置」就不再成立。等 ready 才判斷，免得先閃一次錯的說法。
  const showLocalDataNote = ready && !state.settings.profile.lineUserId;
  const showAds = !isAdFreeActive(state.settings.adFreeUntil);

  const isActive = (href: string) => isActiveHref(pathname, href);

  // 換頁就收起選單。抽屜裡的連結本來就會關，這裡處理的是上一頁／下一頁。
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  // 全站只在這裡監聽 Supabase 的登入狀態：有新的 session 就把本機資料同步上去，
  // 登出就清掉本機的 LINE 身分（日記／事項資料留著）。
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    let cancelled = false;

    void refreshSharedPepTalks();

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!cancelled && user && currentUserId() !== user.id) void syncOnLogin(user);
      else if (!cancelled && user) {
        void refreshAdFreeStatus();
        void refreshSharedPepTalks();
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (currentUserId()) signOut();
        return;
      }
      const user = session?.user;
      if (user && currentUserId() !== user.id) void syncOnLogin(user);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col" data-ads={showAds ? "on" : "off"}>
      <AuthLocalhostBounce />
      <PepTalkBanner />

      <div className="flex w-full min-w-0 flex-1 flex-col lg:flex-row">
        {/* 側欄固定在視窗高度內：整頁再長也不跟著拉長，項目多時自己捲動。 */}
        <aside
          className={cn(
            "hidden shrink-0 overflow-y-auto border-r border-line bg-surface px-4 py-8 lg:sticky lg:flex lg:w-60 lg:flex-col",
            pepVisible
              ? "lg:top-[var(--pep-banner-total)] lg:h-[calc(100dvh-var(--pep-banner-total)-var(--ad-bar-h))]"
              : "lg:top-0 lg:h-[calc(100dvh-var(--ad-bar-h))]",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <BrandMark />
            <ProfileAvatar profile={state.settings.profile} size={36} />
          </div>
          {/* 側欄只有 15rem 寬，點數擠不進品牌那一列，自己佔一行。 */}
          <PointsBadge divination={state.divination} className="mt-5 self-start" />
          <SidebarNav pathname={pathname} className="mt-5" />
          {showLocalDataNote ? <LocalDataNote className="mt-auto pt-8" /> : null}
        </aside>

        <MobileMenu
          pathname={pathname}
          profile={state.settings.profile}
          showLocalDataNote={showLocalDataNote}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />

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
              <button
                type="button"
                aria-label="開啟選單"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
                className="-ml-2 flex size-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <MenuIcon className="size-6" />
              </button>
              <BrandMark compact />
              {/* 頂端列不放頭貼：身分與登出都收在左側抽屜底部。 */}
              <div className="ml-auto flex items-center gap-2">
                <PointsBadge divination={state.divination} />
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

          <main className="min-w-0 flex-1 px-4 pt-5 pb-[calc(66px+var(--ad-bar-h)+env(safe-area-inset-bottom)+20px)] sm:px-6 lg:px-10 lg:pt-10 lg:pb-[calc(var(--ad-bar-h)+3.5rem)]">
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
                      {item.shortLabel}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {showAds ? <AdBanner /> : null}
      <FocusLock />
    </div>
  );
}

function SidebarNav({
  pathname,
  className,
  onNavigate,
}: {
  pathname: string;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {SIDEBAR_ITEMS.map((item) => {
        const active = isActiveHref(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-brand font-medium text-on-brand"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              item.hideInIosApp && "hide-in-ios-app",
            )}
          >
            <item.Icon
              className={cn(
                "size-5",
                item.href === "/support" && (active ? "text-on-brand" : "text-brand"),
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** 手機版的左側抽屜：底部分頁放不下的項目都從這裡進入。 */
function MobileMenu({
  pathname,
  profile,
  showLocalDataNote,
  open,
  onClose,
}: {
  pathname: string;
  profile: Profile;
  showLocalDataNote: boolean;
  open: boolean;
  onClose: () => void;
}) {
  // z-index 要壓過打氣小語橫幅（z-60），不然抽屜開著時橫幅會蓋在上面。
  return (
    <div inert={!open} className="fixed inset-0 z-[70] lg:hidden">
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal={open}
        aria-label="選單"
        className={cn(
          "absolute inset-y-0 left-0 flex w-[78%] max-w-72 flex-col overflow-y-auto bg-surface px-4 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-[calc(env(safe-area-inset-top,0px)+16px)] shadow-[4px_0_18px_rgba(17,24,39,0.14)] transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <BrandMark />
          <button
            type="button"
            aria-label="關閉選單"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <SidebarNav pathname={pathname} className="mt-6" onNavigate={onClose} />
        {/* 帳號區要貼著抽屜底部，mt-auto 掛在這層，說明文字有沒有出現都不影響。 */}
        <div className="mt-auto pt-8">
          {showLocalDataNote ? <LocalDataNote className="mb-4" /> : null}
          {/* 負的 mx 讓分隔線橫跨整個抽屜寬度，內容仍對齊上面的選單。 */}
          <AccountFooter profile={profile} onNavigate={onClose} className="-mx-4 px-4" />
        </div>
      </div>
    </div>
  );
}

/** 未登入時才成立的提醒：資料只在這台瀏覽器裡，換裝置或清掉就沒了。 */
function LocalDataNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-ink-subtle", className)}>
      資料目前儲存在這台裝置的瀏覽器中。
    </p>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-xl bg-brand"
      >
        <SunIcon className="size-[22px] text-white" strokeWidth={2} />
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
