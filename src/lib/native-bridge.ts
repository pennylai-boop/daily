/**
 * 原生殼（iOS WKWebView／Android WebView）的橋接層。
 *
 * WebView 裡沒有可靠的 Web Share API（Android WebView 完全沒有，iOS WKWebView 不穩），
 * blob 連結的下載也不會動，所以「把圖片或文字交出去」這件事必須讓原生處理。
 *
 * 契約（原生殼要負責的部分）：
 * 1. 在 document start 注入 `window.dailyNative`，這樣頁面第一次繪製前就能判斷平台。
 * 2. `share(payload)` 的參數是 JSON 字串 —— Android 的 addJavascriptInterface 只能傳字串，
 *    iOS 端可以在注入的 JS 裡轉呼叫 `window.webkit.messageHandlers.share.postMessage()`。
 * 3. 有處理就回 true 或不回值，明確不支援時回 false，網頁端才知道要不要退回瀏覽器的做法。
 *
 * 殼還沒實作時所有函式都會安靜地回 false，網頁版行為完全不變。
 */

export interface NativeSharePayload {
  kind: "image" | "text";
  /** kind=image 時的檔名，例如 daily-2026-08-19.png。 */
  fileName?: string;
  /** kind=image 的內容，格式是 data:image/png;base64,... */
  dataUrl?: string;
  text?: string;
  title?: string;
  url?: string;
}

export interface NativeBridge {
  /** "ios" 或 "android"，給 src/lib/platform.ts 判斷平台用。 */
  platform?: string;
  version?: string;
  share?: (payload: string) => boolean | Promise<boolean> | void;
  /** 用系統瀏覽器開啟外部網址（WebView 內開第三方頁面常會被擋）。 */
  openExternal?: (url: string) => boolean | void;
  /**
   * 開啟／關閉系統勿擾（專注模式計時用）。
   * 網頁本身開不了系統勿擾，需由 iOS／Android 殼實作；未實作時回 false。
   */
  setFocusMode?: (enabled: boolean) => boolean | Promise<boolean> | void;
}

declare global {
  interface Window {
    dailyNative?: NativeBridge;
  }
}

export function getNativeBridge(): NativeBridge | null {
  if (typeof window === "undefined") return null;
  return window.dailyNative ?? null;
}

export function hasNativeShare(): boolean {
  return typeof getNativeBridge()?.share === "function";
}

/** 回傳 true 代表原生已經接手，呼叫端就不用再走瀏覽器的分享或下載。 */
export async function nativeShare(payload: NativeSharePayload): Promise<boolean> {
  const bridge = getNativeBridge();
  if (typeof bridge?.share !== "function") return false;

  try {
    const result = await bridge.share(JSON.stringify(payload));
    return result !== false;
  } catch (error) {
    console.error("[native] share 失敗，退回瀏覽器的做法。", error);
    return false;
  }
}

export function openExternal(url: string): boolean {
  const bridge = getNativeBridge();
  if (typeof bridge?.openExternal !== "function") return false;

  try {
    return bridge.openExternal(url) !== false;
  } catch (error) {
    console.error("[native] openExternal 失敗。", error);
    return false;
  }
}

/** 橋接只能傳字串，因此 PNG 要先轉成 data URL。 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("圖片轉檔失敗"));
    reader.readAsDataURL(blob);
  });
}
