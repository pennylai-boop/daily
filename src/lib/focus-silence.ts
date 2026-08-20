/**
 * 專注模式的「勿擾／維持喚醒」。
 *
 * 瀏覽器無法直接開啟系統勿擾；有原生殼時走 `dailyNative.setFocusMode`，
 * 同時一律嘗試取得螢幕 Wake Lock，避免計時中螢幕熄滅。
 */

import { getNativeBridge, openExternal } from "./native-bridge";

let wakeLock: WakeLockSentinel | null = null;

export interface FocusSilenceResult {
  /** 原生殼是否已切換系統勿擾。 */
  dnd: boolean;
  /** 是否取得螢幕喚醒鎖。 */
  wakeLock: boolean;
}

export async function enterFocusSilence(): Promise<FocusSilenceResult> {
  const dnd = await requestNativeFocusMode(true);
  const locked = await acquireWakeLock();
  return { dnd, wakeLock: locked };
}

export async function exitFocusSilence(): Promise<void> {
  await requestNativeFocusMode(false);
  await releaseWakeLock();
}

async function requestNativeFocusMode(enabled: boolean): Promise<boolean> {
  const bridge = getNativeBridge();
  if (typeof bridge?.setFocusMode !== "function") return false;
  try {
    const result = await bridge.setFocusMode(enabled);
    return result !== false;
  } catch (error) {
    console.error("[focus] setFocusMode 失敗。", error);
    return false;
  }
}

async function acquireWakeLock(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return false;
  try {
    await releaseWakeLock();
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
    return true;
  } catch {
    return false;
  }
}

async function releaseWakeLock(): Promise<void> {
  if (!wakeLock) return;
  try {
    await wakeLock.release();
  } catch {
    // 已釋放或瀏覽器收回。
  }
  wakeLock = null;
}

/** Android 可嘗試打開系統勿擾設定；其他平台安靜失敗。 */
export function openSystemDndSettings(): boolean {
  return openExternal("intent:#Intent;action=android.settings.ZEN_MODE_SETTINGS;end");
}
