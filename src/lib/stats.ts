import { addDays, dayOfWeek, isSameMonth, todayIso } from "./date";
import { isBlockEmpty } from "./templates";
import type { DailyState, DayEntry, IsoDate, MoodId, Routine } from "./types";
import { isRoutineDueOn } from "./routines";

export function hasContent(entry: DayEntry | null | undefined): boolean {
  if (!entry) return false;
  if (entry.mood) return true;
  if (entry.focus.length > 0) return true;
  if (entry.photos.length > 0) return true;
  return entry.blocks.some((block) => !isBlockEmpty(block));
}

export function recordedDates(state: DailyState): IsoDate[] {
  return Object.values(state.entries)
    .filter(hasContent)
    .map((entry) => entry.date)
    .sort();
}

/** 從今天（或昨天，允許今天還沒寫）往回算連續紀錄天數。 */
export function currentStreak(state: DailyState, today: IsoDate = todayIso()): number {
  const recorded = new Set(recordedDates(state));
  let cursor = recorded.has(today) ? today : addDays(today, -1);
  if (!recorded.has(cursor)) return 0;

  let streak = 0;
  while (recorded.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(state: DailyState): number {
  const dates = recordedDates(state);
  let best = 0;
  let run = 0;
  let previous: IsoDate | null = null;

  for (const date of dates) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

export function monthEntryCount(state: DailyState, monthIso: IsoDate): number {
  return recordedDates(state).filter((date) => isSameMonth(date, monthIso)).length;
}

export function moodCounts(state: DailyState, monthIso?: IsoDate): Map<MoodId, number> {
  const counts = new Map<MoodId, number>();
  for (const entry of Object.values(state.entries)) {
    if (!entry.mood) continue;
    if (monthIso && !isSameMonth(entry.date, monthIso)) continue;
    counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
  }
  return counts;
}

export function totalWrittenBlocks(state: DailyState): number {
  return Object.values(state.entries).reduce(
    (sum, entry) => sum + entry.blocks.filter((block) => !isBlockEmpty(block)).length,
    0,
  );
}

export interface RoutineProgress {
  routine: Routine;
  due: number;
  done: number;
  rate: number;
}

/** 計算某段期間內每個定期事項的完成率（僅計算到今天為止）。 */
export function routineProgress(
  state: DailyState,
  fromDate: IsoDate,
  toDate: IsoDate,
): RoutineProgress[] {
  const today = todayIso();
  const end = toDate > today ? today : toDate;

  return state.routines
    .filter((routine) => !routine.archived)
    .map((routine) => {
      let due = 0;
      let done = 0;
      for (let cursor = fromDate; cursor <= end; cursor = addDays(cursor, 1)) {
        if (!isRoutineDueOn(routine, cursor)) continue;
        due += 1;
        if ((state.checks[cursor] ?? []).includes(routine.id)) done += 1;
      }
      return { routine, due, done, rate: due === 0 ? 0 : done / due };
    });
}

export function checkedCount(state: DailyState, date: IsoDate): number {
  return (state.checks[date] ?? []).length;
}

export interface Completion {
  /** 這段期間內該做的次數（同一個事項每次該做都算一次）。 */
  due: number;
  done: number;
  /** 0–1；`due` 為 0 時是 0，呼叫端可用 `due === 0` 區分「沒排定」與「都沒做」。 */
  rate: number;
}

/**
 * 一段期間內所有定期事項的完成度，日／週／月的百分比都用這一個函式算。
 *
 * 只計算到今天為止：未來的日子還沒到，算進去只會讓百分比看起來很難看。
 */
export function completion(state: DailyState, fromDate: IsoDate, toDate: IsoDate): Completion {
  const today = todayIso();
  const end = toDate > today ? today : toDate;
  const routines = state.routines.filter((routine) => !routine.archived);

  let due = 0;
  let done = 0;

  for (let cursor = fromDate; cursor <= end; cursor = addDays(cursor, 1)) {
    const checked = state.checks[cursor] ?? [];
    for (const routine of routines) {
      if (!isRoutineDueOn(routine, cursor)) continue;
      due += 1;
      if (checked.includes(routine.id)) done += 1;
    }
  }

  return { due, done, rate: due === 0 ? 0 : done / due };
}

/** 單一定期事項在一段期間內的完成度，供事項統計頁使用。 */
export function routineCompletion(
  state: DailyState,
  routine: Routine,
  fromDate: IsoDate,
  toDate: IsoDate,
): Completion {
  const today = todayIso();
  const end = toDate > today ? today : toDate;

  let due = 0;
  let done = 0;
  for (let cursor = fromDate; cursor <= end; cursor = addDays(cursor, 1)) {
    if (!isRoutineDueOn(routine, cursor)) continue;
    due += 1;
    if (isRoutineDone(state, routine, cursor)) done += 1;
  }

  return { due, done, rate: due === 0 ? 0 : done / due };
}

export function isRoutineDone(state: DailyState, routine: Routine, date: IsoDate): boolean {
  return (state.checks[date] ?? []).includes(routine.id);
}

/**
 * 連續完成幾次。只看「該做的日子」，所以每週兩次的事項連兩週做滿也算 4 次，
 * 不會因為中間那些本來就不用做的日子被判定中斷。
 *
 * 今天該做但還沒打勾不算斷：這一天還沒過完，把連續歸零只會讓人不想打開。
 */
export function routineStreak(
  state: DailyState,
  routine: Routine,
  today: IsoDate = todayIso(),
): number {
  const start = trackingStart(state, routine);
  let cursor =
    isRoutineDueOn(routine, today) && !isRoutineDone(state, routine, today)
      ? addDays(today, -1)
      : today;

  let streak = 0;
  while (cursor >= start) {
    if (isRoutineDueOn(routine, cursor)) {
      if (!isRoutineDone(state, routine, cursor)) break;
      streak += 1;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function routineLongestStreak(
  state: DailyState,
  routine: Routine,
  today: IsoDate = todayIso(),
): number {
  let best = 0;
  let run = 0;

  for (let cursor = trackingStart(state, routine); cursor <= today; cursor = addDays(cursor, 1)) {
    if (!isRoutineDueOn(routine, cursor)) continue;
    if (isRoutineDone(state, routine, cursor)) {
      run += 1;
      best = Math.max(best, run);
    } else if (cursor !== today) {
      run = 0;
    }
  }
  return best;
}

/** 累積完成次數，不限期間。 */
export function routineDoneTotal(state: DailyState, routine: Routine): number {
  let total = 0;
  for (const ids of Object.values(state.checks)) {
    if (ids.includes(routine.id)) total += 1;
  }
  return total;
}

/** 星期分布，index 0 是週日，用來看「星期幾最容易做到」。 */
export function routineWeekdayCompletion(
  state: DailyState,
  routine: Routine,
  fromDate: IsoDate,
  toDate: IsoDate,
): Completion[] {
  const today = todayIso();
  const end = toDate > today ? today : toDate;
  const buckets: Completion[] = Array.from({ length: 7 }, () => ({ due: 0, done: 0, rate: 0 }));

  for (let cursor = fromDate; cursor <= end; cursor = addDays(cursor, 1)) {
    if (!isRoutineDueOn(routine, cursor)) continue;
    const bucket = buckets[dayOfWeek(cursor)];
    bucket.due += 1;
    if (isRoutineDone(state, routine, cursor)) bucket.done += 1;
  }

  for (const bucket of buckets) {
    bucket.rate = bucket.due === 0 ? 0 : bucket.done / bucket.due;
  }
  return buckets;
}

/**
 * 往回找的下界。事項的建立時間是一個上限，但示範資料與匯入的備份會有比建立時間更早的
 * 打勾紀錄，所以取兩者較早的那一個，連續天數才不會被硬生生截斷。
 */
function trackingStart(state: DailyState, routine: Routine): IsoDate {
  const created = routine.createdAt.slice(0, 10);
  const firstCheck = Object.keys(state.checks).sort()[0];
  return firstCheck && firstCheck < created ? firstCheck : created;
}
