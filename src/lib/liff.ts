"use client";

/**
 * LIFF SDK 的載入與初始化。
 *
 * SDK 不進 bundle，改成第一次要用到時才插一支 script。多數使用者不會走 LINE 的路徑，
 * 沒必要讓每個人都下載它；在 LINE 內開啟時則由 `LiffBootstrap` 提早暖機。
 *
 * 兩個呼叫端（`line-auth.ts` 登入、`line-invite.ts` 好友選擇畫面）都要先 init 才能用，
 * 所以初始化的 promise 在這裡快取一份，重複呼叫不會重載也不會重跑。
 */

const SDK_URL = "https://static.line-scdn.net/liff/edge/2/sdk.js";

export interface LiffLike {
  init: (config: { liffId: string }) => Promise<void>;
  isLoggedIn: () => boolean;
  login: (config?: { redirectUri?: string }) => void;
  logout: () => void;
  getProfile: () => Promise<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
  }>;
  isInClient: () => boolean;
  isApiAvailable: (name: string) => boolean;
  /** 使用者按取消時回傳 null。isMultiple 可一次選多個聊天室。 */
  shareTargetPicker: (
    messages: unknown[],
    options?: { isMultiple?: boolean },
  ) => Promise<{ status: string } | null>;
  openWindow?: (params: { url: string; external?: boolean }) => void;
  closeWindow?: () => void;
}

declare global {
  interface Window {
    liff?: LiffLike;
  }
}

export function liffId(): string {
  return process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
}

/** 用 LINE 開這個 LIFF。路徑不另加，避免 Endpoint 已是 /settings 時變成 /settings/settings。 */
export function liffAppUrl(query: Record<string, string> = {}): string | null {
  const id = liffId();
  if (!id) return null;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const search = params.toString();
  return `https://liff.line.me/${id}${search ? `?${search}` : ""}`;
}

export function openLiffInLine(query: Record<string, string> = {}): boolean {
  const url = liffAppUrl(query);
  if (!url) return false;
  window.location.assign(url);
  return true;
}

let ready: Promise<LiffLike | null> | null = null;

/** 初始化完成回傳 liff 物件；沒設定 LIFF ID、載不到 SDK 或 init 失敗都回傳 null。 */
export function ensureLiff(): Promise<LiffLike | null> {
  ready ??= initLiff();
  return ready;
}

async function initLiff(): Promise<LiffLike | null> {
  if (typeof window === "undefined") return null;
  const id = liffId();
  if (!id) return null;

  try {
    await loadSdk();
    const liff = window.liff;
    if (!liff) return null;
    await liff.init({ liffId: id });
    return liff;
  } catch (error) {
    // 在 LINE 以外的瀏覽器 init 會失敗，這是正常情形，呼叫端會退回其他分享管道。
    console.info("[liff] 初始化失敗，改走一般瀏覽器流程", error);
    return null;
  }
}

function loadSdk(): Promise<void> {
  if (window.liff) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[data-liff-sdk]`);
  if (existing) return scriptLoaded(existing);

  const script = document.createElement("script");
  script.src = SDK_URL;
  script.async = true;
  script.dataset.liffSdk = "";
  const loaded = scriptLoaded(script);
  document.head.appendChild(script);
  return loaded;
}

function scriptLoaded(script: HTMLScriptElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (script.dataset.loaded === "true") {
      resolve();
      return;
    }
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error("LIFF SDK 載入失敗")), { once: true });
  });
}
