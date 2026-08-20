/**
 * 用 LINE 送出分享邀請。
 *
 * LINE 基於隱私沒有提供好友清單或以 LINE ID 查人的 API，所以不能讓使用者輸入對方的帳號；
 * 改用 `liff.shareTargetPicker()` 讓使用者在 LINE 原生的清單裡挑人，送出一則帶邀請連結的訊息，
 * 對方點開後用 LINE 登入才建立關聯。
 *
 * LIFF SDK 只有在頁面以 LIFF app 開啟時才會存在；不在 LINE 裡就退回系統分享面板或複製連結。
 * 包成 App 之後一定走不到 LIFF（那是 LINE 自己瀏覽器裡的 API），因此第二順位是原生殼的分享橋接。
 */

import { hasNativeShare, nativeShare } from "./native-bridge";

interface LiffLike {
  init: (config: { liffId: string }) => Promise<void>;
  isLoggedIn: () => boolean;
  login: (config?: { redirectUri?: string }) => void;
  logout: () => void;
  getProfile: () => Promise<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
  }>;
  isApiAvailable: (name: string) => boolean;
  /** 使用者按取消時回傳 null。 */
  shareTargetPicker: (messages: unknown[]) => Promise<{ status: string } | null>;
}

declare global {
  interface Window {
    liff?: LiffLike;
  }
}

/** line：LINE 好友選擇畫面；share：系統分享面板；clipboard：已複製連結。 */
export type InviteChannel = "line" | "share" | "clipboard" | "cancelled";

export function inviteUrl(code: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/invite/${code}`;
}

export function inviteMessage(ownerName: string, url: string): string {
  const who = ownerName.trim() || "有人";
  return `${who}想把每天的紀錄分享給你。點開連結、用 LINE 登入就能接受：\n${url}`;
}

export async function shareInvite(ownerName: string, code: string): Promise<InviteChannel> {
  const url = inviteUrl(code);
  const text = inviteMessage(ownerName, url);

  const liff = window.liff;
  if (liff?.isApiAvailable("shareTargetPicker")) {
    try {
      const result = await liff.shareTargetPicker([{ type: "text", text }]);
      return result ? "line" : "cancelled";
    } catch {
      // LIFF 尚未 init 或使用者未登入時往下退回其他管道。
    }
  }

  if (hasNativeShare()) {
    const handled = await nativeShare({ kind: "text", title: "天天 daily", text, url });
    if (handled) return "share";
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "天天 daily", text, url });
      return "share";
    } catch {
      return "cancelled";
    }
  }

  await copyText(url);
  return "clipboard";
}

export async function copyInviteUrl(code: string): Promise<void> {
  await copyText(inviteUrl(code));
}

/**
 * Android WebView 常常沒有 navigator.clipboard（需要 HTTPS 與額外權限），
 * 所以退回舊的 execCommand 做法，至少複製得到連結。
 */
async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // 往下走備援。
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}
