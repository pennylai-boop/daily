import type { IsoDate } from "./types";

/**
 * 對應 `Date#getDay()`：0＝日、1＝一…6＝六。
 * 頻率設定、完整日期文案都用這組。
 */
export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

/** 月曆表頭順序：週一～週日（週日在最右側）。 */
export const CALENDAR_WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

export function toIsoDate(date: Date): IsoDate {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 以本地時區解析，避免 `new Date('2026-08-17')` 被當成 UTC 午夜。 */
export function fromIsoDate(iso: IsoDate): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function addDays(iso: IsoDate, amount: number): IsoDate {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + amount);
  return toIsoDate(date);
}

export function addMonths(iso: IsoDate, amount: number): IsoDate {
  const date = fromIsoDate(iso);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return toIsoDate(date);
}

export function startOfMonth(iso: IsoDate): IsoDate {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso: IsoDate): IsoDate {
  return addDays(addMonths(startOfMonth(iso), 1), -1);
}

/** 以週一為一週的開始，與月曆的排列一致。 */
export function startOfWeek(iso: IsoDate): IsoDate {
  const dow = dayOfWeek(iso);
  const offset = dow === 0 ? 6 : dow - 1;
  return addDays(iso, -offset);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  const ms = fromIsoDate(to).getTime() - fromIsoDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function isFuture(iso: IsoDate): boolean {
  return daysBetween(todayIso(), iso) > 0;
}

/**
 * 是否可書寫該日紀錄。
 * 只能寫今天；當天中午（12:00）前仍可補寫昨天。更早或未來的日子唯讀。
 */
export function canEditEntry(iso: IsoDate, now: Date = new Date()): boolean {
  const today = toIsoDate(now);
  if (iso === today) return true;
  if (iso === addDays(today, -1) && now.getHours() < 12) return true;
  return false;
}

/** 舊紀錄不可刪；只有「今天」的紀錄可以刪除。 */
export function canDeleteEntry(iso: IsoDate, now: Date = new Date()): boolean {
  return iso === toIsoDate(now);
}

/**
 * 產生月曆需要的 6 x 7 日期格，週一為每週第一天。
 */
export function buildMonthGrid(monthIso: IsoDate): IsoDate[] {
  const first = fromIsoDate(startOfMonth(monthIso));
  const dow = first.getDay();
  const offset = dow === 0 ? 6 : dow - 1;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return toIsoDate(date);
  });
}

export function isSameMonth(a: IsoDate, b: IsoDate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function formatMonthLabel(iso: IsoDate): string {
  const [year, month] = iso.split("-");
  return `${year} 年 ${Number(month)} 月`;
}

/** 月目標的 map key，例如 `2026-08`。 */
export function monthKey(iso: IsoDate): string {
  return iso.slice(0, 7);
}

/** 一週區間標籤，例如「8 月 17 日 – 8 月 23 日」。 */
export function formatWeekRangeLabel(weekStart: IsoDate): string {
  const weekEnd = addDays(weekStart, 6);
  const start = fromIsoDate(weekStart);
  const end = fromIsoDate(weekEnd);
  return `${start.getMonth() + 1} 月 ${start.getDate()} 日 – ${end.getMonth() + 1} 月 ${end.getDate()} 日`;
}

export function formatDayLabel(iso: IsoDate): string {
  const date = fromIsoDate(iso);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

export function formatFullDate(iso: IsoDate): string {
  const date = fromIsoDate(iso);
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 星期${
    WEEKDAY_LABELS[date.getDay()]
  }`;
}

/** 手機版標題用的短日期，例如「8 月 17 日 週一」。 */
export function formatShortDate(iso: IsoDate): string {
  const date = fromIsoDate(iso);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日 週${WEEKDAY_LABELS[date.getDay()]}`;
}

export function formatRelativeDay(iso: IsoDate): string | null {
  const diff = daysBetween(todayIso(), iso);
  if (diff === 0) return "今天";
  if (diff === -1) return "昨天";
  if (diff === -2) return "前天";
  if (diff === 1) return "明天";
  return null;
}

export function dayOfWeek(iso: IsoDate): number {
  return fromIsoDate(iso).getDay();
}

export function dayOfMonth(iso: IsoDate): number {
  return Number(iso.slice(8, 10));
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toIsoDate(fromIsoDate(value)) === value;
}
