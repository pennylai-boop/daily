import { todayIso } from "./date";
import type { FocusSession, FocusState } from "./types";

export const FOCUS_PRESETS = [15, 25, 45, 60] as const;

export function clampFocusMinutes(value: number): number {
  return Math.max(1, Math.min(180, Math.trunc(value) || 25));
}

export function focusElapsedSeconds(focus: FocusState, now = Date.now()): number {
  if (!focus.runningStartedAt) return 0;
  const started = Date.parse(focus.runningStartedAt);
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.floor((now - started) / 1000));
}

export function focusRemainingSeconds(focus: FocusState, now = Date.now()): number {
  if (!focus.runningStartedAt) return focus.runningPlannedMinutes * 60;
  const cap = focus.runningPlannedMinutes * 60;
  return Math.max(0, cap - focusElapsedSeconds(focus, now));
}

export function isFocusRunning(focus: FocusState, now = Date.now()): boolean {
  return Boolean(focus.runningStartedAt) && focusRemainingSeconds(focus, now) > 0;
}

export function focusShouldComplete(focus: FocusState, now = Date.now()): boolean {
  return Boolean(focus.runningStartedAt) && focusRemainingSeconds(focus, now) <= 0;
}

export function todayFocusSeconds(sessions: FocusSession[], date = todayIso()): number {
  return sessions.filter((session) => session.date === date).reduce((sum, session) => sum + session.elapsedSeconds, 0);
}

export function rangeFocusSeconds(
  sessions: FocusSession[],
  from: string,
  to: string,
): number {
  return sessions
    .filter((session) => session.date >= from && session.date <= to)
    .reduce((sum, session) => sum + session.elapsedSeconds, 0);
}
