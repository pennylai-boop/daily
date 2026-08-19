"use client";

import { useEffect } from "react";

/**
 * 註冊離線用的 service worker（public/sw.js）。
 *
 * 只在正式建置註冊：開發模式的 chunk 網址會一直變，快取住只會拿到過期的檔案。
 * 要在本機驗證離線行為請跑 `npm run build && npm start`。
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .catch((error) => console.error("[sw] 註冊失敗", error));
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
