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

import { ensureLiff, openLiffInLine } from "./liff";
import { hasNativeShare, nativeShare } from "./native-bridge";

/** line：LINE 好友選擇畫面；share：系統分享面板；clipboard：已複製連結。 */
export type InviteChannel = "line" | "share" | "clipboard" | "cancelled" | "redirect";

export function inviteUrl(code: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/invite/${code}`;
}

export function inviteMessage(ownerName: string, url: string): string {
  const who = ownerName.trim() || "有人";
  return `${who}想把每天的紀錄分享給你。點開連結、用 LINE 登入就能接受：\n${url}`;
}

export const LINE_INVITE_QUERY = "inviteLine";

export async function shareInvite(
  ownerName: string,
  code: string,
  options: { fromLiffReturn?: boolean } = {},
): Promise<InviteChannel> {
  const url = inviteUrl(code);
  const text = inviteMessage(ownerName, url);

  const liff = await ensureLiff();
  const canPick = Boolean(liff?.isApiAvailable("shareTargetPicker"));
  const alreadyInLiff = Boolean(liff?.isInClient?.());
  const returning =
    options.fromLiffReturn || new URLSearchParams(window.location.search).get(LINE_INVITE_QUERY) === "1";

  if (!canPick && !alreadyInLiff && !returning) {
    const opened = openLiffInLine({
      [LINE_INVITE_QUERY]: "1",
      ...(code ? { code } : {}),
    });
    if (opened) return "redirect";
  }

  if (canPick) {
    if (!liff!.isLoggedIn()) {
      liff!.login({ redirectUri: window.location.href });
      return "redirect";
    }
    try {
      const result = await liff!.shareTargetPicker([{ type: "text", text }]);
      return result ? "line" : "cancelled";
    } catch {
      // 使用者未登入或 LINE 版本太舊時往下退回其他管道。
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

export type LinePickResult = "line" | "unavailable" | "cancelled" | "redirect";

export const LINE_PICK_QUERY = "pickLine";

/**
 * 打開 LINE 原生的好友／群組列表讓使用者選一個聊天室。
 * LINE 基於隱私不會回傳選到誰，選完會送出一則短訊到該聊天室，我們再把顯示名稱記在本機。
 * 在一般瀏覽器會先跳進 LINE 的 LIFF，進 App 後再自動跳出選人畫面。
 */
export async function pickLineChat(
  displayName = "",
  options: { fromLiffReturn?: boolean } = {},
): Promise<LinePickResult> {
  const liff = await ensureLiff();
  const canPick = Boolean(liff?.isApiAvailable("shareTargetPicker"));
  const alreadyInLiff = Boolean(liff?.isInClient?.());
  const returningToPick =
    options.fromLiffReturn || new URLSearchParams(window.location.search).get(LINE_PICK_QUERY) === "1";

  if (!canPick) {
    if (alreadyInLiff || returningToPick) return "unavailable";
    const opened = openLiffInLine({
      [LINE_PICK_QUERY]: "1",
      ...(displayName.trim() ? { label: displayName.trim().slice(0, 30) } : {}),
    });
    return opened ? "redirect" : "unavailable";
  }

  if (!liff!.isLoggedIn()) {
    liff!.login({ redirectUri: window.location.href });
    return "redirect";
  }

  try {
    const result = await liff!.shareTargetPicker(
      [
        {
          type: "text",
          text: "已把這個聊天室加入天天 daily 的常傳名單。之後日記頁按「傳送今天」就會傳到這裡。",
        },
      ],
      // false 只會出現好友；true 才看得到群組與聊天室。
      { isMultiple: true },
    );
    return result ? "line" : "cancelled";
  } catch {
    return "unavailable";
  }
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
