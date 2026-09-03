"use client";

import { useEffect } from "react";

import { ensureLiff, liffId } from "@/lib/liff";
import { LINE_HANDOFF_QUERY, LINE_INVITE_QUERY, LINE_PICK_QUERY } from "@/lib/line-invite";

/**
 * 在 LINE 裡開啟、或剛從 LINE 登入導回來時，先把 LIFF 準備好。
 *
 * `liff.login()` 會把人導去 LINE 再帶著 `liff.*` 參數導回本站，那一次回來一定要有人呼叫
 * `liff.init()` 才會把登入狀態接回去；等使用者自己再按一次登入就太晚了。
 *
 * 反過來說，一般瀏覽器不需要那支 SDK（約 100KB），所以只在看起來真的用得到時才載入：
 * LINE 內建瀏覽器的 UA 帶有 `Line/`，導回來的網址則會帶 `liff` 開頭的查詢參數。
 */
export function LiffBootstrap() {
  useEffect(() => {
    if (!liffId()) return;

    const params = new URLSearchParams(window.location.search);
    const fromLinePicker = params.get(LINE_PICK_QUERY) === "1" || params.has(LINE_HANDOFF_QUERY);
    if (fromLinePicker && !window.location.pathname.startsWith("/line-pick")) {
      window.location.replace(`/line-pick?${params.toString()}`);
      return;
    }

    const fromLineInvite = params.get(LINE_INVITE_QUERY) === "1";
    if (fromLineInvite && !window.location.pathname.startsWith("/settings")) {
      window.location.replace(`/settings?${params.toString()}`);
      return;
    }

    const inLineApp = /\bLine\/\d/i.test(navigator.userAgent);
    const returningFromLogin = window.location.search.includes("liff");
    if (!inLineApp && !returningFromLogin && !fromLinePicker) return;

    void ensureLiff();
  }, []);

  return null;
}
