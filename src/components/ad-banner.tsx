"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef } from "react";

import { adsenseConfig } from "@/lib/adfree";

/**
 * 全站最下排的廣告列。訂閱無廣告後由 AppShell 整塊不渲染。
 * iOS App 內用 hide-in-ios-app 藏起來（App Store 規則，與贊助同一套）。
 */
export function AdBanner() {
  const ads = adsenseConfig();

  return (
    <aside
      className="hide-in-ios-app fixed inset-x-0 z-30 bg-surface pb-[env(safe-area-inset-bottom,0px)] lg:pb-0"
      style={{ bottom: "var(--ad-bar-offset, 0px)" }}
      aria-label="廣告"
    >
      <div className="relative w-full">
        {ads ? <AdSenseUnit client={ads.client} slot={ads.slot} /> : <AdPlaceholder />}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 px-2 pt-1">
          <p className="rounded bg-surface/80 px-1.5 py-0.5 text-[11px] tracking-wide text-ink-subtle">
            廣告
          </p>
          <Link
            href="/adfree"
            className="adfree-link pointer-events-auto rounded bg-surface/80 px-1.5 py-0.5 text-[11px] font-medium underline-offset-2 hover:underline"
          >
            訂閱無廣告 NT$50／月
          </Link>
        </div>
      </div>
      {ads ? (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.client}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      ) : null}
    </aside>
  );
}

function AdPlaceholder() {
  return (
    <div className="flex h-[50px] w-full items-center justify-center bg-surface-muted text-[12px] text-ink-subtle">
      廣告位置（尚未設定 AdSense）
    </div>
  );
}

function AdSenseUnit({ client, slot }: { client: string; slot: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      const w = window as Window & { adsbygoogle?: object[] };
      w.adsbygoogle = w.adsbygoogle ?? [];
      w.adsbygoogle.push({});
    } catch {
      // AdSense 腳本還沒好或被擋，留空位就好。
    }
  }, []);

  return (
    <ins
      className="adsbygoogle block"
      style={{ display: "block", width: "100%", minHeight: 50 }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="horizontal"
      data-full-width-responsive="true"
    />
  );
}
