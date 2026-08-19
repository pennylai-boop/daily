import type { ChartSeries } from "@/components/charts/line-chart";
import { SERIES_COLORS } from "@/components/charts/line-chart";

import {
  addDays,
  addMonths,
  daysBetween,
  endOfMonth,
  startOfMonth,
  startOfWeek,
  todayIso,
} from "./date";
import { findMood } from "./moods";
import { isRoutineDueOn } from "./routines";
import { countWords, TEMPLATES } from "./templates";
import type { DailyState, IsoDate, Routine } from "./types";

export type RangeId = "1w" | "2w" | "1m" | "1q" | "6m" | "1y" | "3y" | "all";

export const RANGE_OPTIONS: readonly { id: RangeId; label: string; days: number | null }[] = [
  { id: "1w", label: "一週", days: 7 },
  { id: "2w", label: "2週", days: 14 },
  { id: "1m", label: "一月", days: 30 },
  { id: "1q", label: "一季", days: 90 },
  { id: "6m", label: "6個月", days: 182 },
  { id: "1y", label: "1年", days: 365 },
  { id: "3y", label: "3年", days: 1095 },
  { id: "all", label: "全部", days: null },
];

export interface Bucket {
  label: string;
  from: IsoDate;
  to: IsoDate;
}

export interface RangeWindow {
  from: IsoDate;
  to: IsoDate;
  buckets: Bucket[];
}

/** 依照區間長度決定 `全部` 的起點：最早一筆紀錄，沒有資料時退回一個月。 */
function earliestDate(state: DailyState): IsoDate | null {
  const dates = [...Object.keys(state.entries), ...Object.keys(state.checks)].sort();
  return dates[0] ?? null;
}

export function buildRangeWindow(state: DailyState, range: RangeId): RangeWindow {
  const to = todayIso();
  const option = RANGE_OPTIONS.find((item) => item.id === range) ?? RANGE_OPTIONS[2];

  const from =
    option.days === null ? (earliestDate(state) ?? addDays(to, -29)) : addDays(to, -(option.days - 1));

  const span = daysBetween(from, to) + 1;
  const buckets =
    span <= 31 ? dayBuckets(from, to) : span <= 130 ? weekBuckets(from, to) : monthBuckets(from, to, span);

  return { from, to, buckets };
}

function dayBuckets(from: IsoDate, to: IsoDate): Bucket[] {
  const buckets: Bucket[] = [];
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    buckets.push({ label: shortLabel(cursor), from: cursor, to: cursor });
  }
  return buckets;
}

function weekBuckets(from: IsoDate, to: IsoDate): Bucket[] {
  const buckets: Bucket[] = [];
  for (let cursor = startOfWeek(from); cursor <= to; cursor = addDays(cursor, 7)) {
    const start = cursor < from ? from : cursor;
    const end = addDays(cursor, 6);
    buckets.push({ label: shortLabel(start), from: start, to: end > to ? to : end });
  }
  return buckets;
}

function monthBuckets(from: IsoDate, to: IsoDate, span: number): Bucket[] {
  const buckets: Bucket[] = [];
  for (let cursor = startOfMonth(from); cursor <= to; cursor = addMonths(cursor, 1)) {
    const start = cursor < from ? from : cursor;
    const end = endOfMonth(cursor);
    const month = Number(cursor.slice(5, 7));
    buckets.push({
      label: span > 365 ? `${cursor.slice(2, 4)}/${month}` : `${month}月`,
      from: start,
      to: end > to ? to : end,
    });
  }
  return buckets;
}

function shortLabel(iso: IsoDate): string {
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

function eachDay(bucket: Bucket, limit: IsoDate): IsoDate[] {
  const days: IsoDate[] = [];
  const end = bucket.to > limit ? limit : bucket.to;
  for (let cursor = bucket.from; cursor <= end; cursor = addDays(cursor, 1)) days.push(cursor);
  return days;
}

/** 每個定期事項一條曲線，數值為該區間的完成率（%）。 */
export function routineRateSeries(
  state: DailyState,
  buckets: Bucket[],
  routines: Routine[],
): ChartSeries[] {
  const today = todayIso();

  return routines.map((routine, index) => ({
    id: routine.id,
    label: `${routine.emoji} ${routine.title}`,
    color: SERIES_COLORS[index % SERIES_COLORS.length],
    values: buckets.map((bucket) => {
      let due = 0;
      let done = 0;
      for (const day of eachDay(bucket, today)) {
        if (!isRoutineDueOn(routine, day)) continue;
        due += 1;
        if ((state.checks[day] ?? []).includes(routine.id)) done += 1;
      }
      return due === 0 ? null : (done / due) * 100;
    }),
  }));
}

/** 每種記錄格式一條曲線，數值為該區間的書寫字數。 */
export function writingSeries(state: DailyState, buckets: Bucket[]): ChartSeries[] {
  const today = todayIso();

  return TEMPLATES.map((template, index) => ({
    id: template.id,
    label: `${template.emoji} ${template.name}`,
    color: SERIES_COLORS[index % SERIES_COLORS.length],
    values: buckets.map((bucket) => {
      let total = 0;
      for (const day of eachDay(bucket, today)) {
        const entry = state.entries[day];
        if (!entry) continue;
        for (const block of entry.blocks) {
          if (block.template === template.id) total += countWords(block);
        }
      }
      return total;
    }),
  }));
}

/** 單一事項每個區間的書寫字數；只打勾的事項沒有內容，值一律是 0。 */
export function routineWordSeries(
  state: DailyState,
  buckets: Bucket[],
  routine: Routine,
): ChartSeries[] {
  const today = todayIso();

  return [
    {
      id: `${routine.id}-words`,
      label: "書寫字數",
      color: SERIES_COLORS[1],
      values: buckets.map((bucket) => {
        let total = 0;
        for (const day of eachDay(bucket, today)) {
          for (const block of state.entries[day]?.blocks ?? []) {
            if (block.routineId === routine.id) total += countWords(block);
          }
        }
        return total;
      }),
    },
  ];
}

/** 心情平均分數（1–5），沒有選心情的區間為 null。 */
export function moodSeries(state: DailyState, buckets: Bucket[]): ChartSeries[] {
  const today = todayIso();

  return [
    {
      id: "mood",
      label: "心情平均分數",
      color: SERIES_COLORS[0],
      values: buckets.map((bucket) => {
        const scores: number[] = [];
        for (const day of eachDay(bucket, today)) {
          const mood = findMood(state.entries[day]?.mood, state.customMoods);
          if (mood) scores.push(mood.score);
        }
        if (scores.length === 0) return null;
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }),
    },
  ];
}
