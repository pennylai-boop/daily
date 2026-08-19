import type { IsoDate } from "./types";

export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

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

/** 以週日為一週的開始，與月曆的排列一致。 */
export function startOfWeek(iso: IsoDate): IsoDate {
  return addDays(iso, -dayOfWeek(iso));
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  const ms = fromIsoDate(to).getTime() - fromIsoDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function isFuture(iso: IsoDate): boolean {
  return daysBetween(todayIso(), iso) > 0;
}

/**
 * 產生月曆需要的 6 x 7 日期格，週日為每週第一天（台灣日曆慣例）。
 */
export function buildMonthGrid(monthIso: IsoDate): IsoDate[] {
  const first = fromIsoDate(startOfMonth(monthIso));
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());

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
