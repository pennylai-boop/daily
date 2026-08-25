/**
 * 卜卦的額度規則。
 *
 * 卦看的是當下的天時地利人和，效期大約三個月，所以免費額度也照同一個節奏走：
 * 每三個月一次免費，同一輪裡想再問就用點數換。這也順便擋住連續問到滿意為止的用法。
 */

import type { DivinationState } from "./types";

export const FREE_INTERVAL_MONTHS = 3;

/** 下一次免費的時間；回傳 null 表示現在就能免費卜。 */
export function nextFreeCastAt(state: DivinationState, now = new Date()): Date | null {
  if (!state.lastFreeCastAt) return null;

  const last = new Date(state.lastFreeCastAt);
  if (Number.isNaN(last.getTime())) return null;

  const next = new Date(last);
  next.setMonth(next.getMonth() + FREE_INTERVAL_MONTHS);
  return next.getTime() <= now.getTime() ? null : next;
}

export type QuotaStatus =
  /** 這一輪的免費額度還在。 */
  | { kind: "free" }
  /** 免費額度用掉了，但兌換碼還有點數。 */
  | { kind: "credit"; code: string; credits: number; nextFreeAt: Date }
  /** 兩者都沒有，只能等下一輪或買點數。 */
  | { kind: "locked"; nextFreeAt: Date };

export function quotaStatus(state: DivinationState, now = new Date()): QuotaStatus {
  const nextFreeAt = nextFreeCastAt(state, now);
  if (!nextFreeAt) return { kind: "free" };
  if (state.creditCode && state.credits > 0) {
    return { kind: "credit", code: state.creditCode, credits: state.credits, nextFreeAt };
  }
  return { kind: "locked", nextFreeAt };
}

export function canCast(state: DivinationState, now = new Date()): boolean {
  return quotaStatus(state, now).kind !== "locked";
}
