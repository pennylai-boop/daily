"use client";

/**
 * 登入後把本機 DailyState 同步進 Supabase，之後每次修改鏡射過去。
 *
 * 未登入（或這個環境沒設定 Supabase）時完全不動作，App 行為與純 localStorage 時一致。
 * 合併策略（見 `mergeStates`）：第一次登入的帳號整包採用本機資料上傳；回頭登入（雲端已經
 * 有資料）時逐筆合併，entries／routines 用 `updatedAt` 比新舊，其餘沒有時間戳記的欄位
 * 採「兩邊都有就信雲端，只有一邊就保留那一邊」。不是完整的多裝置即時同步，
 * 下一次登入才會看到另一台裝置的變更。
 */

import { STANDING_INVITE_NAME } from "./storage";
import { getSupabaseBrowser } from "./supabase-browser";
import type {
  CustomMood,
  DailyState,
  DayEntry,
  LineShareTarget,
  PeriodGoalMap,
  Profile,
  Routine,
  ShareRecipient,
} from "./types";

let sessionUserId: string | null = null;

export function hasSession(): boolean {
  return sessionUserId !== null;
}

export function currentUserId(): string | null {
  return sessionUserId;
}

export function setSessionUserId(id: string | null): void {
  sessionUserId = id;
}

export interface RemoteState {
  hasRemoteProfile: boolean;
  profile: Profile;
  pepTalkVisible: boolean;
  pepTalkQuotes: string[] | null;
  lineTargets: LineShareTarget[];
  entries: Record<string, DayEntry>;
  routines: Routine[];
  checks: Record<string, string[]>;
  weekGoals: PeriodGoalMap;
  monthGoals: PeriodGoalMap;
  customMoods: CustomMood[];
}

/** 登入後把雲端的九張表整批查回來，組成跟本機資料同樣形狀的物件。 */
export async function pullRemoteState(userId: string): Promise<RemoteState> {
  const supabase = getSupabaseBrowser();
  const empty: RemoteState = {
    hasRemoteProfile: false,
    profile: { name: "", lineUserId: "", avatarUrl: null },
    pepTalkVisible: true,
    pepTalkQuotes: null,
    lineTargets: [],
    entries: {},
    routines: [],
    checks: {},
    weekGoals: {},
    monthGoals: {},
    customMoods: [],
  };
  if (!supabase) return empty;

  const [profileRes, targetsRes, entriesRes, routinesRes, checksRes, goalsRes, moodsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("line_share_targets").select("*").eq("user_id", userId),
      supabase.from("day_entries").select("*").eq("user_id", userId),
      supabase.from("routines").select("*").eq("user_id", userId),
      supabase.from("routine_checks").select("*").eq("user_id", userId),
      supabase.from("period_goals").select("*").eq("user_id", userId),
      supabase.from("custom_moods").select("*").eq("user_id", userId),
    ]);

  const profileRow = profileRes.data as ProfileRow | null;

  const entries: Record<string, DayEntry> = {};
  for (const row of (entriesRes.data ?? []) as DayEntryRow[]) {
    entries[row.date] = dayEntryFromRow(row);
  }

  const checks: Record<string, string[]> = {};
  for (const row of (checksRes.data ?? []) as { date: string; routine_id: string }[]) {
    checks[row.date] = [...(checks[row.date] ?? []), row.routine_id];
  }

  const weekGoals: PeriodGoalMap = {};
  const monthGoals: PeriodGoalMap = {};
  for (const row of (goalsRes.data ?? []) as PeriodGoalRow[]) {
    const target = row.period_type === "week" ? weekGoals : monthGoals;
    target[row.period_key] = row.items;
  }

  return {
    hasRemoteProfile: Boolean(profileRow),
    profile: profileRow
      ? { name: profileRow.name, lineUserId: profileRow.line_user_id ?? "", avatarUrl: profileRow.avatar_url }
      : empty.profile,
    pepTalkVisible: profileRow?.pep_talk_visible ?? true,
    pepTalkQuotes: profileRow?.pep_talk_quotes ?? null,
    lineTargets: ((targetsRes.data ?? []) as LineTargetRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      lastUsedAt: row.last_used_at,
    })),
    entries,
    routines: ((routinesRes.data ?? []) as RoutineRow[]).map(routineFromRow),
    checks,
    weekGoals,
    monthGoals,
    customMoods: ((moodsRes.data ?? []) as CustomMoodRow[]).map((row) => ({
      id: row.id,
      label: row.label,
      emoji: row.emoji,
      imageDataUrl: row.image_url,
      level: row.level as CustomMood["level"],
      createdAt: row.created_at,
    })),
  };
}

/**
 * 合併本機與雲端資料。全新帳號（雲端還沒有 profiles 列）整包採用本機資料，
 * 之後由呼叫端 `pushWholeState` 上傳；回頭登入才逐筆比較。
 */
export function mergeStates(local: DailyState, remote: RemoteState, sessionProfile: Profile): DailyState {
  if (!remote.hasRemoteProfile) {
    return {
      ...local,
      settings: {
        ...local.settings,
        profile: {
          name: local.settings.profile.name || sessionProfile.name,
          lineUserId: sessionProfile.lineUserId,
          avatarUrl: sessionProfile.avatarUrl ?? local.settings.profile.avatarUrl,
        },
      },
    };
  }

  const entries = mergeByKey(
    local.entries,
    remote.entries,
    (a, b) => (a.updatedAt >= b.updatedAt ? a : b),
  );

  const routines = mergeByArrayKey(
    local.routines,
    remote.routines,
    (r) => r.id,
    (a, b) => (a.updatedAt >= b.updatedAt ? a : b),
  );

  const customMoods = mergeByArrayKey(
    local.customMoods,
    remote.customMoods,
    (m) => m.id,
    (_local, remoteValue) => remoteValue,
  );

  const lineTargets = mergeByArrayKey(
    local.settings.line.targets,
    remote.lineTargets,
    (t) => t.name,
    (a, b) => ((a.lastUsedAt ?? "") >= (b.lastUsedAt ?? "") ? a : b),
  );

  const checks: DailyState["checks"] = {};
  for (const date of new Set([...Object.keys(local.checks), ...Object.keys(remote.checks)])) {
    const merged = new Set([...(local.checks[date] ?? []), ...(remote.checks[date] ?? [])]);
    if (merged.size > 0) checks[date] = [...merged];
  }

  const weekGoals = mergeByKey(local.weekGoals, remote.weekGoals, (_a, b) => b);
  const monthGoals = mergeByKey(local.monthGoals, remote.monthGoals, (_a, b) => b);

  const localQuotes = local.settings.pepTalk.quotes;
  const pepTalkQuotes =
    localQuotes !== null && remote.pepTalkQuotes !== null
      ? remote.pepTalkQuotes
      : (localQuotes ?? remote.pepTalkQuotes);

  return {
    ...local,
    entries,
    routines,
    checks,
    weekGoals,
    monthGoals,
    customMoods,
    settings: {
      ...local.settings,
      profile: {
        name: local.settings.profile.name || sessionProfile.name || remote.profile.name,
        lineUserId: sessionProfile.lineUserId,
        avatarUrl: sessionProfile.avatarUrl ?? remote.profile.avatarUrl,
      },
      line: { targets: lineTargets },
      pepTalk: { visible: remote.pepTalkVisible, quotes: pepTalkQuotes },
    },
  };
}

function mergeByKey<T>(
  local: Record<string, T>,
  remote: Record<string, T>,
  pick: (local: T, remote: T) => T,
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const a = local[key];
    const b = remote[key];
    result[key] = a && b ? pick(a, b) : (a ?? b);
  }
  return result;
}

function mergeByArrayKey<T>(
  local: T[],
  remote: T[],
  keyOf: (item: T) => string,
  pick: (local: T, remote: T) => T,
): T[] {
  const localMap = new Map(local.map((item) => [keyOf(item), item]));
  const remoteMap = new Map(remote.map((item) => [keyOf(item), item]));
  const result: T[] = [];
  for (const key of new Set([...localMap.keys(), ...remoteMap.keys()])) {
    const a = localMap.get(key);
    const b = remoteMap.get(key);
    result.push(a && b ? pick(a, b) : (a ?? b)!);
  }
  return result;
}

/** 登入後把合併結果整包 upsert 回 Supabase（次數少，用整包覆蓋比逐筆比對簡單可靠）。 */
export async function pushWholeState(state: DailyState, userId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;

  await Promise.all([
    pushProfileSettings(state.settings.profile, state.settings.pepTalk),
    ...state.settings.line.targets.map((target) => pushLineTarget(target)),
    ...Object.values(state.entries).map((entry) => pushEntry(entry)),
    ...state.routines.map((routine) => pushRoutine(routine)),
    ...state.customMoods.map((mood) => pushCustomMood(mood)),
    ...Object.entries(state.weekGoals).map(([key, items]) => pushPeriodGoals("week", key, items)),
    ...Object.entries(state.monthGoals).map(([key, items]) => pushPeriodGoals("month", key, items)),
  ]);

  const checkRows = Object.entries(state.checks).flatMap(([date, ids]) =>
    ids.map((routineId) => ({ user_id: userId, date, routine_id: routineId })),
  );
  await supabase.from("routine_checks").delete().eq("user_id", userId);
  if (checkRows.length > 0) await supabase.from("routine_checks").insert(checkRows);
}

// ── 逐筆鏡射：store.ts 的每個 mutation 在本機寫入成功後呼叫，失敗只 log 不擋 UI。 ──

export async function pushEntry(entry: DayEntry): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId) return;
  const { error } = await supabase.from("day_entries").upsert({
    user_id: userId,
    date: entry.date,
    mood: entry.mood,
    blocks: entry.blocks,
    focus: entry.focus,
    photos: entry.photos,
  });
  if (error) console.error("[supabase-sync] pushEntry", error);
}

export async function deleteEntryRemote(date: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId) return;
  const { error } = await supabase.from("day_entries").delete().eq("user_id", userId).eq("date", date);
  if (error) console.error("[supabase-sync] deleteEntryRemote", error);
}

export async function pushRoutine(routine: Routine): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId) return;
  const { error } = await supabase.from("routines").upsert({
    id: routine.id,
    user_id: userId,
    title: routine.title,
    emoji: routine.emoji,
    note: routine.note,
    frequency: routine.frequency,
    template: routine.template,
    metric_fields: routine.metricFields ?? null,
    timer_defaults: routine.timerDefaults ?? null,
    archived: routine.archived,
  });
  if (error) console.error("[supabase-sync] pushRoutine", error);
}

export async function deleteRoutineRemote(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase || !sessionUserId) return;
  const { error } = await supabase.from("routines").delete().eq("id", id);
  if (error) console.error("[supabase-sync] deleteRoutineRemote", error);
}

export async function setRoutineCheckRemote(
  date: string,
  routineId: string,
  checked: boolean,
): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId) return;
  const error = checked
    ? (await supabase.from("routine_checks").upsert({ user_id: userId, date, routine_id: routineId })).error
    : (
        await supabase
          .from("routine_checks")
          .delete()
          .eq("user_id", userId)
          .eq("date", date)
          .eq("routine_id", routineId)
      ).error;
  if (error) console.error("[supabase-sync] setRoutineCheckRemote", error);
}

export async function pushPeriodGoals(
  periodType: "week" | "month",
  periodKey: string,
  items: unknown,
): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId) return;

  const isEmpty = Array.isArray(items) && items.length === 0;
  const error = isEmpty
    ? (
        await supabase
          .from("period_goals")
          .delete()
          .eq("user_id", userId)
          .eq("period_type", periodType)
          .eq("period_key", periodKey)
      ).error
    : (
        await supabase
          .from("period_goals")
          .upsert({ user_id: userId, period_type: periodType, period_key: periodKey, items })
      ).error;
  if (error) console.error("[supabase-sync] pushPeriodGoals", error);
}

export async function pushCustomMood(mood: CustomMood): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId) return;
  const { error } = await supabase.from("custom_moods").upsert({
    id: mood.id,
    user_id: userId,
    label: mood.label,
    emoji: mood.emoji,
    image_url: mood.imageDataUrl,
    level: mood.level,
  });
  if (error) console.error("[supabase-sync] pushCustomMood", error);
}

export async function deleteCustomMoodRemote(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase || !sessionUserId) return;
  const { error } = await supabase.from("custom_moods").delete().eq("id", id);
  if (error) console.error("[supabase-sync] deleteCustomMoodRemote", error);
}

export async function pushLineTarget(target: LineShareTarget): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId) return;
  const { error } = await supabase.from("line_share_targets").upsert({
    id: target.id,
    user_id: userId,
    name: target.name,
    last_used_at: target.lastUsedAt,
  });
  if (error) console.error("[supabase-sync] pushLineTarget", error);
}

export async function deleteLineTargetRemote(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase || !sessionUserId) return;
  const { error } = await supabase.from("line_share_targets").delete().eq("id", id);
  if (error) console.error("[supabase-sync] deleteLineTargetRemote", error);
}

export async function pushProfileSettings(
  profile: Profile,
  pepTalk: { visible: boolean; quotes: string[] | null },
): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId) return;
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    line_user_id: profile.lineUserId || null,
    name: profile.name,
    avatar_url: profile.avatarUrl,
    pep_talk_visible: pepTalk.visible,
    pep_talk_quotes: pepTalk.quotes,
  });
  if (error) console.error("[supabase-sync] pushProfileSettings", error);
}

// ── 分享邀請／分享關係：owner 對自己的列有完整 RLS 權限，不需要 Route Handler。 ──
// 「接受邀請」是唯一跨使用者的寫入，那一步在 src/server/sharing.ts 用 service role 處理。

export async function createShareInviteRemote(input: {
  token: string;
  name: string;
  scope: ShareRecipient["scope"];
}): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId) return false;
  const { error } = await supabase.from("share_invites").insert({
    token: input.token,
    owner_id: userId,
    name: input.name,
    scope: input.scope,
  });
  if (error) {
    console.error("[supabase-sync] createShareInviteRemote", error);
    return false;
  }
  return true;
}

interface ShareInviteRow {
  token: string;
  name: string;
  scope: ShareRecipient["scope"];
  created_at: string;
}

interface ShareRow {
  invite_token: string | null;
  name: string;
  viewer_line_user_id: string;
  avatar_url: string | null;
  scope: ShareRecipient["scope"];
  created_at: string;
}

/** 「設定 → 分享給誰看」清單：owner 自己的待接受邀請 + 已接受的分享關係。 */
export async function fetchRecipients(userId: string): Promise<ShareRecipient[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const [invitesRes, sharesRes] = await Promise.all([
    supabase
      .from("share_invites")
      .select("*")
      .eq("owner_id", userId)
      .eq("status", "pending")
      .neq("name", STANDING_INVITE_NAME),
    supabase.from("shares").select("*").eq("owner_id", userId),
  ]);

  const pending: ShareRecipient[] = ((invitesRes.data ?? []) as ShareInviteRow[]).map((row) => ({
    id: row.token,
    name: row.name,
    lineUserId: null,
    avatarUrl: null,
    scope: row.scope,
    status: "pending",
    inviteCode: row.token,
    createdAt: row.created_at,
    acceptedAt: null,
  }));

  const accepted: ShareRecipient[] = ((sharesRes.data ?? []) as ShareRow[]).map((row) => ({
    id: row.invite_token ?? createFallbackId(),
    name: row.name,
    lineUserId: row.viewer_line_user_id || null,
    avatarUrl: row.avatar_url,
    scope: row.scope,
    status: "accepted",
    inviteCode: row.invite_token ?? "",
    createdAt: row.created_at,
    acceptedAt: row.created_at,
  }));

  return [...pending, ...accepted];
}

function createFallbackId(): string {
  return `share-${Math.random().toString(36).slice(2, 10)}`;
}

/** 依 recipient 目前的狀態改到對應的表（pending → share_invites，accepted → shares）。 */
export async function updateRecipientRemote(
  recipient: ShareRecipient,
  patch: { scope?: ShareRecipient["scope"] },
): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId || !recipient.inviteCode) return;

  const error =
    recipient.status === "pending"
      ? (await supabase.from("share_invites").update(patch).eq("token", recipient.inviteCode)).error
      : (
          await supabase
            .from("shares")
            .update(patch)
            .eq("owner_id", userId)
            .eq("invite_token", recipient.inviteCode)
        ).error;
  if (error) console.error("[supabase-sync] updateRecipientRemote", error);
}

export async function deleteRecipientRemote(recipient: ShareRecipient): Promise<void> {
  const supabase = getSupabaseBrowser();
  const userId = sessionUserId;
  if (!supabase || !userId || !recipient.inviteCode) return;

  const error =
    recipient.status === "pending"
      ? (await supabase.from("share_invites").delete().eq("token", recipient.inviteCode)).error
      : (
          await supabase
            .from("shares")
            .delete()
            .eq("owner_id", userId)
            .eq("invite_token", recipient.inviteCode)
        ).error;
  if (error) console.error("[supabase-sync] deleteRecipientRemote", error);
}

// ── DB row ↔ 前端型別 ──

interface ProfileRow {
  id: string;
  line_user_id: string | null;
  name: string;
  avatar_url: string | null;
  pep_talk_visible: boolean;
  pep_talk_quotes: string[] | null;
}

interface LineTargetRow {
  id: string;
  name: string;
  last_used_at: string | null;
}

interface DayEntryRow {
  date: string;
  mood: string | null;
  blocks: DayEntry["blocks"];
  focus: DayEntry["focus"];
  photos: DayEntry["photos"];
  created_at: string;
  updated_at: string;
}

function dayEntryFromRow(row: DayEntryRow): DayEntry {
  return {
    date: row.date,
    mood: row.mood,
    blocks: row.blocks ?? [],
    focus: row.focus ?? [],
    photos: row.photos ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface RoutineRow {
  id: string;
  title: string;
  emoji: string;
  note: string;
  frequency: Routine["frequency"];
  template: Routine["template"];
  metric_fields: Routine["metricFields"] | null;
  timer_defaults: Routine["timerDefaults"] | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

function routineFromRow(row: RoutineRow): Routine {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    note: row.note,
    frequency: row.frequency,
    template: row.template,
    metricFields: row.metric_fields ?? undefined,
    timerDefaults: row.timer_defaults ?? undefined,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface PeriodGoalRow {
  period_type: "week" | "month";
  period_key: string;
  items: PeriodGoalMap[string];
}

interface CustomMoodRow {
  id: string;
  label: string;
  emoji: string | null;
  image_url: string | null;
  level: string;
  created_at: string;
}
