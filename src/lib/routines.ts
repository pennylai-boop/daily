import { dayOfMonth, dayOfWeek, daysBetween, WEEKDAY_LABELS } from "./date";
import type { IsoDate, Routine, RoutineFrequency } from "./types";

export const ROUTINE_EMOJIS = [
  "❤️",
  "💭",
  "✍️",
  "🧘",
  "🏃",
  "💧",
  "📖",
  "🛏️",
  "🥗",
  "💊",
  "🧹",
  "💰",
  "📞",
  "🎯",
  "🌱",
];

/**
 * 首次使用時預設帶入的定期事項。
 * 三種書寫格式本身就是定期事項，打勾後會展開讓使用者填寫。
 */
export const DEFAULT_ROUTINES: Omit<Routine, "id" | "createdAt">[] = [
  {
    title: "五感恩",
    emoji: "❤️",
    note: "睡前回想今天",
    frequency: { kind: "daily" },
    template: "gratitude",
    archived: false,
  },
  {
    title: "觀心書",
    emoji: "💭",
    note: "情緒起伏較大的日子",
    frequency: { kind: "weekly", weekdays: [0, 3] },
    template: "mindfulness",
    archived: false,
  },
  {
    title: "寫日記",
    emoji: "✍️",
    note: "",
    frequency: { kind: "daily" },
    template: "diary",
    archived: false,
  },
];

export function isRoutineDueOn(routine: Routine, iso: IsoDate): boolean {
  const { frequency } = routine;
  switch (frequency.kind) {
    case "daily":
      return true;
    case "weekly":
      return frequency.weekdays.includes(dayOfWeek(iso));
    case "monthly":
      return frequency.days.includes(dayOfMonth(iso));
    case "interval": {
      const offset = daysBetween(frequency.startDate, iso);
      if (offset < 0) return false;
      return offset % Math.max(1, frequency.everyDays) === 0;
    }
  }
}

export function describeFrequency(frequency: RoutineFrequency): string {
  switch (frequency.kind) {
    case "daily":
      return "每天";
    case "weekly": {
      if (frequency.weekdays.length === 0) return "尚未選擇星期";
      const labels = [...frequency.weekdays]
        .sort((a, b) => a - b)
        .map((weekday) => WEEKDAY_LABELS[weekday]);
      return `每週 ${labels.join("、")}`;
    }
    case "monthly": {
      if (frequency.days.length === 0) return "尚未選擇日期";
      const labels = [...frequency.days].sort((a, b) => a - b).map((day) => `${day} 日`);
      return `每月 ${labels.join("、")}`;
    }
    case "interval":
      return `每 ${frequency.everyDays} 天`;
  }
}

export function routinesDueOn(routines: Routine[], iso: IsoDate): Routine[] {
  return routines.filter((routine) => !routine.archived && isRoutineDueOn(routine, iso));
}

/** 有設定書寫格式、但今天沒有排定的事項，仍可以臨時加寫。 */
export function writableRoutinesNotDue(routines: Routine[], iso: IsoDate): Routine[] {
  return routines.filter(
    (routine) => !routine.archived && routine.template !== null && !isRoutineDueOn(routine, iso),
  );
}
