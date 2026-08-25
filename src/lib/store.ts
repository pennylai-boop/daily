"use client";

import { useSyncExternalStore } from "react";

import { createCustomMoodId } from "./moods";
import { profileFromSession } from "./line-auth";
import { getSupabaseBrowser } from "./supabase-browser";
import {
  createShareInviteRemote,
  currentUserId,
  deleteCustomMoodRemote,
  deleteEntryRemote,
  deleteLineTargetRemote,
  deleteRecipientRemote,
  deleteRoutineRemote,
  fetchRecipients,
  hasSession,
  mergeStates,
  pullRemoteState,
  pushCustomMood,
  pushEntry,
  pushLineTarget,
  pushPeriodGoals,
  pushProfileSettings,
  pushRoutine,
  pushWholeState,
  setRoutineCheckRemote,
  setSessionUserId,
  updateRecipientRemote,
} from "./supabase-sync";
import {
  createId,
  createInviteCode,
  DIVINATION_HISTORY_LIMIT,
  EMPTY_STATE,
  loadState,
  normalizeState,
  saveState,
} from "./storage";
import type {
  CustomMood,
  DailyState,
  DayEntry,
  DivinationRecord,
  FocusItem,
  IsoDate,
  LineShareTarget,
  MoodLevel,
  Profile,
  Routine,
  SharedJournal,
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
  const ok = commit((current) => ({
    ...current,
    entries: { ...current.entries, [entry.date]: entry },
  }));
  if (ok && hasSession()) void pushEntry(entry);
  return ok;
}

export function deleteEntry(date: IsoDate): void {
  commit((current) => {
    const entries = { ...current.entries };
    delete entries[date];
    return { ...current, entries };
  });
  if (hasSession()) void deleteEntryRemote(date);
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
  if (ok && hasSession()) void pushCustomMood(mood);
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
  if (hasSession()) void deleteCustomMoodRemote(id);
}

export function addRoutine(input: Omit<Routine, "id" | "createdAt" | "updatedAt">): void {
  let created: Routine | null = null;
  commit((current) => {
    const now = new Date().toISOString();
    const routine: Routine = { ...input, id: createId(), createdAt: now, updatedAt: now };
    created = routine;
    return { ...current, routines: [...current.routines, routine] };
  });
  if (created && hasSession()) void pushRoutine(created);
}

export function updateRoutine(
  id: string,
  patch: Partial<Omit<Routine, "id" | "createdAt" | "updatedAt">>,
): void {
  let updated: Routine | null = null;
  commit((current) => ({
    ...current,
    routines: current.routines.map((routine) => {
      if (routine.id !== id) return routine;
      updated = { ...routine, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    }),
  }));
  if (updated && hasSession()) void pushRoutine(updated);
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
  if (hasSession()) void deleteRoutineRemote(id);
}

/** 寫入某一週的目標清單；空陣列會清掉該 key。 */
export function setWeekGoals(weekStart: IsoDate, items: FocusItem[]): void {
  commit((current) => {
    const weekGoals = { ...current.weekGoals };
    if (items.length > 0) weekGoals[weekStart] = items;
    else delete weekGoals[weekStart];
    return { ...current, weekGoals };
  });
  if (hasSession()) void pushPeriodGoals("week", weekStart, items);
}

/** 寫入某一個月的目標清單；`month` 為 `YYYY-MM`。 */
export function setMonthGoals(month: string, items: FocusItem[]): void {
  commit((current) => {
    const monthGoals = { ...current.monthGoals };
    if (items.length > 0) monthGoals[month] = items;
    else delete monthGoals[month];
    return { ...current, monthGoals };
  });
  if (hasSession()) void pushPeriodGoals("month", month, items);
}

export function toggleRoutineCheck(routineId: string, date: IsoDate): void {
  let nowChecked = false;
  commit((current) => {
    const existing = current.checks[date] ?? [];
    nowChecked = !existing.includes(routineId);
    const nextIds = nowChecked
      ? [...existing, routineId]
      : existing.filter((id) => id !== routineId);

    const checks = { ...current.checks };
    if (nextIds.length > 0) {
      checks[date] = nextIds;
    } else {
      delete checks[date];
    }
    return { ...current, checks };
  });
  if (hasSession()) void setRoutineCheckRemote(date, routineId, nowChecked);
}

export function updateProfile(patch: Partial<Profile>): void {
  commit((current) => ({
    ...current,
    settings: { ...current.settings, profile: { ...current.settings.profile, ...patch } },
  }));
  syncProfileSettings();
}

/**
 * 登出：清掉 LINE 身分、結束 Supabase session。本機的日記／事項資料仍留在這台裝置，
 * 要整包清掉請用設定裡的「清除全部資料」。
 */
export function signOut(): void {
  setSessionUserId(null);
  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      profile: { name: "", lineUserId: "", avatarUrl: null },
      recipients: [],
    },
  }));
}

function updateLineTargets(
  update: (targets: LineShareTarget[]) => LineShareTarget[],
): void {
  commit((current) => ({
    ...current,
    settings: { ...current.settings, line: { targets: update(current.settings.line.targets) } },
  }));
}

/** 同名的對象不重複建立，直接沿用既有那一筆。 */
export function addLineTarget(name: string): void {
  const trimmed = name.trim().slice(0, 30);
  if (!trimmed) return;

  const existing = cache ?? loadState();
  if (existing.settings.line.targets.some((target) => target.name === trimmed)) return;

  const target: LineShareTarget = { id: createId(), name: trimmed, lastUsedAt: null };
  updateLineTargets((targets) => [...targets, target]);
  if (hasSession()) void pushLineTarget(target);
}

export function removeLineTarget(id: string): void {
  updateLineTargets((targets) => targets.filter((target) => target.id !== id));
  if (hasSession()) void deleteLineTargetRemote(id);
}

/** 送出後記一筆時間，讓最近用過的排在前面。 */
export function markLineTargetUsed(id: string): void {
  const now = new Date().toISOString();
  let updatedTarget: LineShareTarget | null = null;
  updateLineTargets((targets) =>
    targets.map((target) => {
      if (target.id !== id) return target;
      updatedTarget = { ...target, lastUsedAt: now };
      return updatedTarget;
    }),
  );
  if (updatedTarget && hasSession()) void pushLineTarget(updatedTarget);
}

/** pepTalk 跟 profile 存在同一張 profiles 表，任何一邊變動都整包 upsert。 */
function syncProfileSettings(): void {
  if (!hasSession()) return;
  const current = cache ?? loadState();
  void pushProfileSettings(current.settings.profile, current.settings.pepTalk);
}

export function setPepTalkVisible(visible: boolean): void {
  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      pepTalk: { ...current.settings.pepTalk, visible },
    },
  }));
  syncProfileSettings();
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
  syncProfileSettings();
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
  syncProfileSettings();
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
  syncProfileSettings();
}

export function resetPepTalkQuotes(): void {
  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      pepTalk: { ...current.settings.pepTalk, quotes: null },
    },
  }));
  syncProfileSettings();
}

/**
 * 建立一張待接受的邀請，回傳邀請碼給呼叫端組成連結送出。
 * 邀請要有真實的 owner_id 才有意義，所以要求先登入；沒登入回傳 null。
 */
export async function createInvite(input: { name: string; scope: ShareScope }): Promise<ShareRecipient | null> {
  if (!hasSession()) return null;

  const token = createInviteCode();
  const ok = await createShareInviteRemote({ token, name: input.name, scope: input.scope });
  if (!ok) return null;

  const recipient: ShareRecipient = {
    id: token,
    name: input.name,
    lineUserId: null,
    avatarUrl: null,
    scope: input.scope,
    status: "pending",
    inviteCode: token,
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

/** 用 Supabase session 的 access token 呼叫 /api/shared，整包覆蓋 sharedWithMe。 */
export async function refreshSharedJournals(): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) return;

  try {
    const response = await fetch("/api/shared", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return;
    const data = (await response.json()) as { journals?: SharedJournal[] };
    commit((current) => ({ ...current, sharedWithMe: data.journals ?? current.sharedWithMe }));
  } catch {
    // 靜默失敗，畫面維持上次快取的內容。
  }
}

/** 重新整理「設定 → 分享給誰看」清單（owner 自己的待接受邀請 + 已接受的分享）。 */
export async function refreshRecipients(): Promise<void> {
  const userId = currentUserId();
  if (!userId) return;
  const recipients = await fetchRecipients(userId);
  commit((current) => ({ ...current, settings: { ...current.settings, recipients } }));
}

/**
 * 對方登入後用邀請碼接受分享；一律經 /api/invite/accept（跨使用者寫入需要 service role）。
 * 成功後順便重新整理自己的「被分享紀錄」，讓分享者馬上看到。
 */
export async function acceptInvite(
  token: string,
): Promise<{ ok: true; ownerName: string } | { ok: false; error: string }> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { ok: false, error: "這個環境還沒有設定 Supabase。" };

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) return { ok: false, error: "請先登入。" };

  try {
    const response = await fetch("/api/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ token }),
    });
    const data = (await response.json()) as { ok?: boolean; ownerName?: string; error?: string };
    if (!response.ok || !data.ok) return { ok: false, error: data.error ?? "接受邀請失敗。" };

    void refreshSharedJournals();
    return { ok: true, ownerName: data.ownerName ?? "對方" };
  } catch {
    return { ok: false, error: "連線失敗，請稍後再試。" };
  }
}

export function updateRecipient(
  id: string,
  patch: Partial<Omit<ShareRecipient, "id" | "createdAt">>,
): void {
  let updated: ShareRecipient | null = null;
  commit((current) => ({
    ...current,
    settings: {
      ...current.settings,
      recipients: current.settings.recipients.map((recipient) => {
        if (recipient.id !== id) return recipient;
        updated = { ...recipient, ...patch };
        return updated;
      }),
    },
  }));
  if (updated && hasSession()) void updateRecipientRemote(updated, { scope: patch.scope });
}

export function removeRecipient(id: string): void {
  const current = cache ?? loadState();
  const target = current.settings.recipients.find((recipient) => recipient.id === id) ?? null;

  commit((state) => ({
    ...state,
    settings: {
      ...state.settings,
      recipients: state.settings.recipients.filter((recipient) => recipient.id !== id),
    },
  }));
  if (target && hasSession()) void deleteRecipientRemote(target);
}

/**
 * 登入後把本機資料跟雲端合併：全新帳號整包上傳本機資料，回頭登入則逐筆比較新舊
 * （見 supabase-sync.ts 的 mergeStates）。也會一併拉一次「被分享紀錄」與分享名單。
 */
export async function syncOnLogin(user: {
  id: string;
  user_metadata?: Record<string, unknown> | null;
  identities?: { provider: string; identity_data?: Record<string, unknown> | null }[] | null;
}): Promise<void> {
  setSessionUserId(user.id);
  const profile = profileFromSession(user);
  const localBefore = cache ?? loadState();

  const remote = await pullRemoteState(user.id);
  const merged = mergeStates(localBefore, remote, profile);
  commit(() => merged);

  await pushWholeState(merged, user.id);
  await Promise.all([refreshRecipients(), refreshSharedJournals()]);
}

/**
 * 記下一卦並扣掉額度。
 *
 * 只在 AI 解讀成功之後才呼叫：起卦失敗或解讀失敗都不該扣額度。
 * 用點數時真正的扣款已經由伺服器做完，這裡只把它回報的餘額抄下來顯示。
 */
export function commitDivination(
  input: Omit<DivinationRecord, "id" | "createdAt" | "paidWith" | "note">,
  paid: { with: "free" } | { with: "credit"; remaining: number },
): void {
  const record: DivinationRecord = {
    ...input,
    id: createId(),
    createdAt: new Date().toISOString(),
    paidWith: paid.with,
    note: "",
  };

  commit((state) => ({
    ...state,
    divination: {
      ...state.divination,
      lastFreeCastAt: paid.with === "free" ? record.createdAt : state.divination.lastFreeCastAt,
      credits: paid.with === "credit" ? paid.remaining : state.divination.credits,
      history: [record, ...state.divination.history].slice(0, DIVINATION_HISTORY_LIMIT),
    },
  }));
}

/**
 * 改一筆卜卦紀錄的附註。卦象與解讀是當時起出來的結果，不提供修改；
 * 附註是使用者自己的欄位，事後回頭對照時就寫在這裡。
 */
export function setDivinationNote(id: string, note: string): void {
  commit((current) => ({
    ...current,
    divination: {
      ...current.divination,
      history: current.divination.history.map((record) =>
        record.id === id ? { ...record, note } : record,
      ),
    },
  }));
}

/** 綁定一組兌換碼並記下伺服器回報的餘額。 */
export function setDivinationCredits(code: string, remaining: number): void {
  commit((current) => ({
    ...current,
    divination: {
      ...current.divination,
      creditCode: code,
      credits: Math.max(0, Math.trunc(remaining)),
    },
  }));
}

export function clearDivinationCredits(): void {
  commit((current) => ({
    ...current,
    divination: { ...current.divination, creditCode: null, credits: 0 },
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
  signOut: typeof signOut;
  addLineTarget: typeof addLineTarget;
  removeLineTarget: typeof removeLineTarget;
  markLineTargetUsed: typeof markLineTargetUsed;
  setPepTalkVisible: typeof setPepTalkVisible;
  setPepTalkQuote: typeof setPepTalkQuote;
  addPepTalkQuote: typeof addPepTalkQuote;
  removePepTalkQuote: typeof removePepTalkQuote;
  resetPepTalkQuotes: typeof resetPepTalkQuotes;
  createInvite: typeof createInvite;
  acceptInvite: typeof acceptInvite;
  updateRecipient: typeof updateRecipient;
  removeRecipient: typeof removeRecipient;
  refreshRecipients: typeof refreshRecipients;
  refreshSharedJournals: typeof refreshSharedJournals;
  syncOnLogin: typeof syncOnLogin;
  commitDivination: typeof commitDivination;
  setDivinationNote: typeof setDivinationNote;
  setDivinationCredits: typeof setDivinationCredits;
  clearDivinationCredits: typeof clearDivinationCredits;
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
    signOut,
    addLineTarget,
    removeLineTarget,
    markLineTargetUsed,
    setPepTalkVisible,
    setPepTalkQuote,
    addPepTalkQuote,
    removePepTalkQuote,
    resetPepTalkQuotes,
    createInvite,
    acceptInvite,
    updateRecipient,
    removeRecipient,
    refreshRecipients,
    refreshSharedJournals,
    syncOnLogin,
    commitDivination,
    setDivinationNote,
    setDivinationCredits,
    clearDivinationCredits,
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
