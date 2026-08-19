"use client";

import { useSyncExternalStore } from "react";

import {
  createId,
  createInviteCode,
  EMPTY_STATE,
  loadState,
  normalizeState,
  saveState,
} from "./storage";
import type {
  DailyState,
  DayEntry,
  IsoDate,
  LineSettings,
  Profile,
  Routine,
  ShareRecipient,
  ShareScope,
} from "./types";

/**
 * localStorage 之上的極簡外部狀態容器。
 *
 * 以 `useSyncExternalStore` 訂閱，讓伺服器端渲染取得 `null` 快照（尚未就緒），
 * 客戶端 hydration 完成後才切換到真實資料，因此不需要在 effect 內呼叫 setState。
 * 未來接上後端時，只要把 commit 改成呼叫 API 即可。
 */
let cache: DailyState | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function handleExternalChange() {
  cache = loadState();
  emit();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    // 讓同一個瀏覽器的其他分頁修改資料時也能同步更新。
    window.addEventListener("storage", handleExternalChange);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleExternalChange);
    }
  };
}

function getSnapshot(): DailyState | null {
  cache ??= loadState();
  return cache;
}

function getServerSnapshot(): DailyState | null {
  return null;
}

function commit(updater: (current: DailyState) => DailyState): void {
  const next = updater(cache ?? loadState());
  cache = next;
  saveState(next);
  emit();
}

export function saveEntry(entry: DayEntry): void {
  commit((current) => ({
    ...current,
    entries: { ...current.entries, [entry.date]: entry },
  }));
}

export function deleteEntry(date: IsoDate): void {
  commit((current) => {
    const entries = { ...current.entries };
    delete entries[date];
    return { ...current, entries };
  });
}

export function addRoutine(input: Omit<Routine, "id" | "createdAt">): void {
  commit((current) => ({
    ...current,
    routines: [...current.routines, { ...input, id: createId(), createdAt: new Date().toISOString() }],
  }));
}

export function updateRoutine(
  id: string,
  patch: Partial<Omit<Routine, "id" | "createdAt">>,
): void {
  commit((current) => ({
    ...current,
    routines: current.routines.map((routine) =>
      routine.id === id ? { ...routine, ...patch } : routine,
    ),
  }));
}

export function deleteRoutine(id: string): void {
  commit((current) => {
    const checks: DailyState["checks"] = {};
    for (const [date, ids] of Object.entries(current.checks)) {
      const remaining = ids.filter((checkedId) => checkedId !== id);
      if (remaining.length > 0) checks[date] = remaining;
    }
    return {
      ...current,
      routines: current.routines.filter((routine) => routine.id !== id),
      checks,
    };
  });
}

export function toggleRoutineCheck(routineId: string, date: IsoDate): void {
  commit((current) => {
    const existing = current.checks[date] ?? [];
    const nextIds = existing.includes(routineId)
      ? existing.filter((id) => id !== routineId)
      : [...existing, routineId];

    const checks = { ...current.checks };
    if (nextIds.length > 0) {
      checks[date] = nextIds;
    } else {
      delete checks[date];
    }
    return { ...current, checks };
  });
}

export function updateProfile(patch: Partial<Profile>): void {
  commit((current) => ({
    ...current,
    settings: { ...current.settings, profile: { ...current.settings.profile, ...patch } },
  }));
}

export function updateLineSettings(patch: Partial<LineSettings>): void {
  commit((current) => ({
    ...current,
    settings: { ...current.settings, line: { ...current.settings.line, ...patch } },
  }));
}

/** 建立一張待接受的邀請，回傳邀請碼給呼叫端組成連結送出。 */
export function createInvite(input: { name: string; scope: ShareScope }): ShareRecipient {
  const recipient: ShareRecipient = {
    id: createId(),
    name: input.name,
    lineUserId: null,
    avatarUrl: null,
    scope: input.scope,
    status: "pending",
    inviteCode: createInviteCode(),
    createdAt: new Date().toISOString(),
    acceptedAt: null,
  };

  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      recipients: [...current.settings.recipients, recipient],
    },
  }));

  return recipient;
}

/**
 * 對方用 LINE 登入後接受邀請。
 *
 * 後端上線後會由伺服器比對邀請碼並寫入 LINE 回傳的身分；
 * 目前這一層只在同一個瀏覽器裡生效，用來預覽接受之後的樣子。
 */
export function acceptInvite(
  code: string,
  visitor: { name: string; lineUserId: string; avatarUrl?: string | null },
): boolean {
  const current = cache ?? loadState();
  const target = current.settings.recipients.find(
    (recipient) => recipient.inviteCode === code && recipient.status === "pending",
  );
  if (!target) return false;

  commit((state) => ({
    ...state,
    settings: {
      ...state.settings,
      recipients: state.settings.recipients.map((recipient) =>
        recipient.id === target.id
          ? {
              ...recipient,
              // 分享者自己寫的稱呼優先，沒寫才用對方的 LINE 顯示名稱。
              name: recipient.name || visitor.name,
              lineUserId: visitor.lineUserId,
              avatarUrl: visitor.avatarUrl ?? null,
              status: "accepted",
              acceptedAt: new Date().toISOString(),
            }
          : recipient,
      ),
    },
  }));

  return true;
}

export function updateRecipient(
  id: string,
  patch: Partial<Omit<ShareRecipient, "id" | "createdAt">>,
): void {
  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      recipients: current.settings.recipients.map((recipient) =>
        recipient.id === id ? { ...recipient, ...patch } : recipient,
      ),
    },
  }));
}

export function removeRecipient(id: string): void {
  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      recipients: current.settings.recipients.filter((recipient) => recipient.id !== id),
    },
  }));
}

export function replaceState(next: DailyState): void {
  commit(() => normalizeState(next));
}

export function resetAll(): void {
  commit(() => EMPTY_STATE);
}

export interface DailyStore {
  state: DailyState;
  /** 讀取 localStorage 之前為 false，用來顯示載入骨架並避免 hydration 落差。 */
  ready: boolean;
  saveEntry: typeof saveEntry;
  deleteEntry: typeof deleteEntry;
  addRoutine: typeof addRoutine;
  updateRoutine: typeof updateRoutine;
  deleteRoutine: typeof deleteRoutine;
  toggleRoutineCheck: typeof toggleRoutineCheck;
  updateProfile: typeof updateProfile;
  updateLineSettings: typeof updateLineSettings;
  createInvite: typeof createInvite;
  acceptInvite: typeof acceptInvite;
  updateRecipient: typeof updateRecipient;
  removeRecipient: typeof removeRecipient;
  replaceState: typeof replaceState;
  resetAll: typeof resetAll;
}

export function useDailyStore(): DailyStore {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    state: snapshot ?? EMPTY_STATE,
    ready: snapshot !== null,
    saveEntry,
    deleteEntry,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    toggleRoutineCheck,
    updateProfile,
    updateLineSettings,
    createInvite,
    acceptInvite,
    updateRecipient,
    removeRecipient,
    replaceState,
    resetAll,
  };
}

export function createDayEntry(date: IsoDate): DayEntry {
  const now = new Date().toISOString();
  return { date, mood: null, blocks: [], focus: [], createdAt: now, updatedAt: now };
}
