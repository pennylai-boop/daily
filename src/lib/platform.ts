"use client";

import { useSyncExternalStore } from "react";

import { getNativeBridge } from "./native-bridge";

/**
 * 這個網站有三種執行環境：一般瀏覽器、包成 iOS App 的 WKWebView、包成 Android App 的 WebView。
 * 內容完全相同，但有些 UI 要依平台調整（例如 iOS App 內不顯示贊助入口，見 README 的「包成 App」）。
 *
 * 判斷結果在首次繪製前就寫進 `<html data-platform>`，因此 CSS 能直接切換、不會閃一下，
 * React 這邊則用 usePlatform() 讀同一個屬性。
 */
export type Platform = "web" | "ios" | "android";

/** sessionStorage 而不是 localStorage：避免有人在真的瀏覽器裡開過 ?platform=ios 就永久生效。 */
const PLATFORM_KEY = "daily.platform";

export const platformBootstrapScript = `
(function () {
  try {
    var ua = navigator.userAgent || '';
    var bridge = window.dailyNative;
    var query = /[?&]platform=(ios|android|web)(?:&|$)/.exec(window.location.search);
    var stored = null;
    try { stored = sessionStorage.getItem('${PLATFORM_KEY}'); } catch (error) {}

    var platform = 'web';
    if (bridge && (bridge.platform === 'ios' || bridge.platform === 'android')) {
      platform = bridge.platform;
    } else if (query) {
      platform = query[1];
    } else if (/DailyApp/i.test(ua)) {
      platform = /android/i.test(ua) ? 'android' : 'ios';
    } else if (stored === 'ios' || stored === 'android') {
      platform = stored;
    }

    if (platform !== 'web') {
      try { sessionStorage.setItem('${PLATFORM_KEY}', platform); } catch (error) {}
    }
    document.documentElement.dataset.platform = platform;
  } catch (error) {
    document.documentElement.dataset.platform = 'web';
  }
})();
`;

function readPlatform(): Platform {
  const value = document.documentElement.dataset.platform;
  if (value === "ios" || value === "android") return value;
  // bootstrap script 沒跑到（例如被擋掉）時，還是認得注入的橋接物件。
  const bridge = getNativeBridge()?.platform;
  return bridge === "ios" || bridge === "android" ? bridge : "web";
}

/** 平台在載入後不會改變，所以不需要真的訂閱任何事件。 */
function subscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): Platform {
  return "web";
}

export function usePlatform(): Platform {
  return useSyncExternalStore(subscribe, readPlatform, getServerSnapshot);
}

export function useIsNativeApp(): boolean {
  return usePlatform() !== "web";
}
