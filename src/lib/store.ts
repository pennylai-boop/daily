"use client";

import { useSyncExternalStore } from "react";

import { createCustomMoodId } from "./moods";
import {
  createId,
  createInviteCode,
  EMPTY_STATE,
  loadState,
  normalizeState,
  saveState,
} from "./storage";
import type {
  CustomMood,
  DailyState,
  DayEntry,
  FocusItem,
  IsoDate,
  LineSettings,
  MoodLevel,
  Profile,
  Routine,
  ShareRecipient,
  ShareScope,
} from "./types";
import { resolvePepTalks } from "./pep-talk";

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

/**
 * 回傳是否寫入成功。照片可能把 localStorage 撐爆，寫不進去時要回捲記憶體中的狀態，
 * 否則畫面會顯示一份重新載入後就消失的資料。
 */
function commit(updater: (current: DailyState) => DailyState): boolean {
  const previous = cache ?? loadState();
  const next = updater(previous);
  cache = next;

  if (!saveState(next)) {
    cache = previous;
    emit();
    return false;
  }

  emit();
  return true;
}

export function saveEntry(entry: DayEntry): boolean {
  return commit((current) => ({
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

export function addCustomMood(input: {
  label: string;
  emoji: string | null;
  imageDataUrl: string | null;
  level: MoodLevel;
}): { ok: boolean; mood: CustomMood } {
  const mood: CustomMood = {
    id: createCustomMoodId(createId()),
    label: input.label.trim(),
    emoji: input.imageDataUrl ? null : input.emoji,
    imageDataUrl: input.imageDataUrl,
    level: input.level,
    createdAt: new Date().toISOString(),
  };

  const ok = commit((current) => ({ ...current, customMoods: [...current.customMoods, mood] }));
  return { ok, mood };
}

/**
 * 刪除自訂心情，並把用過它的日子改回沒有心情。
 * 留著孤兒 id 的話那些日子在日曆上會變成空格，看起來像資料掉了。
 */
export function removeCustomMood(id: string): void {
  commit((current) => {
    const entries: DailyState["entries"] = {};
    for (const [date, entry] of Object.entries(current.entries)) {
      entries[date] = entry.mood === id ? { ...entry, mood: null } : entry;
    }
    return {
      ...current,
      entries,
      customMoods: current.customMoods.filter((mood) => mood.id !== id),
    };
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

/** 寫入某一週的目標清單；空陣列會清掉該 key。 */
export function setWeekGoals(weekStart: IsoDate, items: FocusItem[]): void {
  commit((current) => {
    const weekGoals = { ...current.weekGoals };
    if (items.length > 0) weekGoals[weekStart] = items;
    else delete weekGoals[weekStart];
    return { ...current, weekGoals };
  });
}

/** 寫入某一個月的目標清單；`month` 為 `YYYY-MM`。 */
export function setMonthGoals(month: string, items: FocusItem[]): void {
  commit((current) => {
    const monthGoals = { ...current.monthGoals };
    if (items.length > 0) monthGoals[month] = items;
    else delete monthGoals[month];
    return { ...current, monthGoals };
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

/** 套用 LINE 登入拿到的身分（名稱、userId、頭貼）。 */
export function applyLineProfile(profile: Profile): void {
  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      profile: {
        name: profile.name.trim() || current.settings.profile.name,
        lineUserId: profile.lineUserId,
        avatarUrl: profile.avatarUrl,
      },
    },
  }));
}

/**
 * 登出：清掉 LINE 身分。本機的日記／事項資料仍留在這台裝置，
 * 要整包清掉請用設定裡的「清除全部資料」。
 */
export function signOut(): void {
  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      profile: { name: "", lineUserId: "", avatarUrl: null },
    },
  }));
}

export function updateLineSettings(patch: Partial<LineSettings>): void {
  commit((current) => ({
    ...current,
    settings: { ...current.settings, line: { ...current.settings.line, ...patch } },
  }));
}

export function setPepTalkVisible(visible: boolean): void {
  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      pepTalk: { ...current.settings.pepTalk, visible },
    },
  }));
}

/** 確保設定裡有一份可編輯清單（若還在用預設，先複製一份再改）。 */
function editableQuotes(current: DailyState): string[] {
  return resolvePepTalks(current.settings.pepTalk.quotes);
}

export function setPepTalkQuote(index: number, text: string): void {
  commit((current) => {
    const quotes = editableQuotes(current);
    if (index < 0 || index >= quotes.length) return current;
    const next = text.trim();
    if (!next) return current;
    quotes[index] = next;
    return {
      ...current,
      settings: {
        ...current.settings,
        pepTalk: { ...current.settings.pepTalk, quotes },
      },
    };
  });
}

export function addPepTalkQuote(text: string): boolean {
  const next = text.trim();
  if (!next) return false;
  commit((current) => {
    const quotes = editableQuotes(current);
    quotes.unshift(next);
    return {
      ...current,
      settings: {
        ...current.settings,
        pepTalk: { ...current.settings.pepTalk, quotes },
      },
    };
  });
  return true;
}

export function removePepTalkQuote(index: number): void {
  commit((current) => {
    const quotes = editableQuotes(current);
    if (index < 0 || index >= quotes.length) return current;
    quotes.splice(index, 1);
    return {
      ...current,
      settings: {
        ...current.settings,
        pepTalk: {
          ...current.settings.pepTalk,
          // 刪光之後仍存空陣列，避免又跳回預設 250 則把刪除撤銷掉。
          quotes,
        },
      },
    };
  });
}

export function resetPepTalkQuotes(): void {
  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      pepTalk: { ...current.settings.pepTalk, quotes: null },
    },
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
  addCustomMood: typeof addCustomMood;
  removeCustomMood: typeof removeCustomMood;
  addRoutine: typeof addRoutine;
  updateRoutine: typeof updateRoutine;
  deleteRoutine: typeof deleteRoutine;
  setWeekGoals: typeof setWeekGoals;
  setMonthGoals: typeof setMonthGoals;
  toggleRoutineCheck: typeof toggleRoutineCheck;
  updateProfile: typeof updateProfile;
  applyLineProfile: typeof applyLineProfile;
  signOut: typeof signOut;
  updateLineSettings: typeof updateLineSettings;
  setPepTalkVisible: typeof setPepTalkVisible;
  setPepTalkQuote: typeof setPepTalkQuote;
  addPepTalkQuote: typeof addPepTalkQuote;
  removePepTalkQuote: typeof removePepTalkQuote;
  resetPepTalkQuotes: typeof resetPepTalkQuotes;
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
    addCustomMood,
    removeCustomMood,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    setWeekGoals,
    setMonthGoals,
    toggleRoutineCheck,
    updateProfile,
    applyLineProfile,
    signOut,
    updateLineSettings,
    setPepTalkVisible,
    setPepTalkQuote,
    addPepTalkQuote,
    removePepTalkQuote,
    resetPepTalkQuotes,
    createInvite,
    acceptInvite,
    updateRecipient,
    removeRecipient,
    replaceState,
    resetAll,
  };
}

/**
 * 心情留 null，由紀錄頁顯示成預設的「開心」。
 * 真正寫進資料的時機在 `applyDefaultMood`：有內容才記，只是點開某一天不會留下痕跡。
 */
export function createDayEntry(date: IsoDate): DayEntry {
  const now = new Date().toISOString();
  return { date, mood: null, blocks: [], focus: [], photos: [], createdAt: now, updatedAt: now };
}
