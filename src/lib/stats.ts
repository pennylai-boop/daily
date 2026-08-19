import { addDays, isSameMonth, todayIso } from "./date";
import { isBlockEmpty } from "./templates";
import type { DailyState, DayEntry, IsoDate, MoodId, Routine } from "./types";
import { isRoutineDueOn } from "./routines";

export function hasContent(entry: DayEntry | null | undefined): boolean {
  if (!entry) return false;
  if (entry.mood) return true;
  if (entry.focus.length > 0) return true;
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
