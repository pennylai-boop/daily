"use client";

import { CheckIcon } from "@/components/icons";
import { Card, SectionHeading } from "@/components/ui/surfaces";
import { cn } from "@/components/ui/cn";
import {
  addDays,
  buildMonthGrid,
  CALENDAR_WEEKDAY_LABELS,
  dayOfMonth,
  endOfMonth,
  formatMonthLabel,
  formatWeekRangeLabel,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "@/lib/date";
import { isRoutineDueOn } from "@/lib/routines";
import { isRoutineDone } from "@/lib/stats";
import type { DailyState, IsoDate, Routine } from "@/lib/types";

/** 設計系統允許的橘／藍／灰輪替，讓各事項在格線上可區分。 */
const HABIT_TONES = [
  { fill: "var(--brand)", soft: "var(--brand-tint)", on: "var(--on-brand)" },
  { fill: "var(--accent)", soft: "var(--accent-tint)", on: "var(--on-accent)" },
  { fill: "var(--brand-strong)", soft: "var(--brand-tint)", on: "var(--on-brand)" },
  { fill: "var(--ink-muted)", soft: "var(--paper-tint)", on: "var(--surface)" },
  { fill: "var(--accent-strong)", soft: "var(--accent-tint)", on: "var(--on-accent)" },
] as const;

function toneFor(index: number) {
  return HABIT_TONES[index % HABIT_TONES.length];
}

function monthStats(state: DailyState, routine: Routine, monthIso: IsoDate, today: IsoDate) {
  const from = startOfMonth(monthIso);
  const to = endOfMonth(monthIso);
  const end = to > today ? today : to;
  let due = 0;
  let done = 0;
  for (let cursor = from; cursor <= end; cursor = addDays(cursor, 1)) {
    if (!isRoutineDueOn(routine, cursor)) continue;
    due += 1;
    if (isRoutineDone(state, routine, cursor)) done += 1;
  }
  return { due, done, rate: due === 0 ? 0 : done / due };
}

export function HabitHeatmaps({ state, today }: { state: DailyState; today: IsoDate }) {
  const routines = state.routines.filter((routine) => !routine.archived);
  const weekStart = startOfWeek(today);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const monthIso = startOfMonth(today);

  if (routines.length === 0) {
    return (
      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="定期事項" description="本週打勾與本月熱圖" />
        <p className="mt-4 text-[13px] text-ink-muted">還沒有定期事項。到「定期目標」新增後，這裡會出現完成格線。</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
      <Card className="px-3 py-4 sm:px-4">
        <SectionHeading
          title="本週定期事項"
          description={`${formatWeekRangeLabel(weekStart)}，實心＝已完成`}
        />
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[280px]">
            <div
              className="mb-1.5 grid items-center gap-x-2"
              style={{ gridTemplateColumns: "minmax(5.5rem,1.2fr) repeat(7,minmax(1.35rem,1.6rem))" }}
            >
              <span className="sr-only">事項</span>
              {CALENDAR_WEEKDAY_LABELS.map((label) => (
                <span
                  key={label}
                  className="text-center text-[11px] font-medium text-ink-subtle"
                >
                  {label}
                </span>
              ))}
            </div>
            <ul className="space-y-1">
              {routines.map((routine, index) => {
                const tone = toneFor(index);
                return (
                  <li
                    key={routine.id}
                    className="grid items-center gap-x-2"
                    style={{
                      gridTemplateColumns: "minmax(5.5rem,1.2fr) repeat(7,minmax(1.35rem,1.6rem))",
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span aria-hidden className="shrink-0 text-[13px] leading-none">
                        {routine.emoji}
                      </span>
                      <span className="truncate text-[12px] text-ink sm:text-[13px]">
                        {routine.title}
                      </span>
                    </div>
                    {weekDays.map((day) => {
                      const due = isRoutineDueOn(routine, day);
                      const done = isRoutineDone(state, routine, day);
                      const future = day > today;
                      return (
                        <span
                          key={day}
                          title={`${routine.title}・${day}${done ? "・已完成" : due ? "・未完成" : "・未排定"}`}
                          className={cn(
                            "mx-auto block size-[1.35rem] rounded-[5px] sm:size-6 sm:rounded-md",
                            !due && "bg-paper-tint/70",
                            due && !done && "opacity-90",
                            future && due && !done && "opacity-50",
                          )}
                          style={
                            due
                              ? {
                                  backgroundColor: done ? tone.fill : tone.soft,
                                }
                              : undefined
                          }
                        />
                      );
                    })}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {routines.map((routine, index) => (
          <HabitMonthCard
            key={routine.id}
            state={state}
            routine={routine}
            monthIso={monthIso}
            today={today}
            tone={toneFor(index)}
          />
        ))}
      </div>
    </div>
  );
}

function HabitMonthCard({
  state,
  routine,
  monthIso,
  today,
  tone,
}: {
  state: DailyState;
  routine: Routine;
  monthIso: IsoDate;
  today: IsoDate;
  tone: (typeof HABIT_TONES)[number];
}) {
  const grid = buildMonthGrid(monthIso);
  const { due, done, rate } = monthStats(state, routine, monthIso, today);

  return (
    <Card className="px-3.5 py-3.5 sm:px-4">
      <h3 className="flex items-center justify-center gap-1.5 text-center text-[13px] font-medium text-ink">
        <span aria-hidden>{routine.emoji}</span>
        <span className="truncate">{routine.title}</span>
      </h3>
      <p className="mt-0.5 text-center text-[11px] text-ink-subtle">{formatMonthLabel(monthIso)}</p>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {grid.map((day) => {
          const inMonth = isSameMonth(day, monthIso);
          if (!inMonth) {
            return <span key={day} className="aspect-square" aria-hidden />;
          }
          const dueDay = isRoutineDueOn(routine, day);
          const doneDay = isRoutineDone(state, routine, day);
          const future = day > today;
          const showNumber = !doneDay;
          return (
            <span
              key={day}
              title={`${day}${doneDay ? "・已完成" : dueDay ? "・未完成" : "・未排定"}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-[5px] text-[10px] tabular-nums sm:rounded-md sm:text-[11px]",
                future && !doneDay && "opacity-55",
              )}
              style={{
                backgroundColor: doneDay
                  ? tone.fill
                  : dueDay
                    ? tone.soft
                    : "var(--paper-tint)",
                color: doneDay ? tone.on : "var(--ink-muted)",
              }}
            >
              {showNumber ? dayOfMonth(day) : null}
            </span>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-5 border-t border-line pt-2.5 text-[13px] tabular-nums text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <RateGlyph />
          <span>{Math.round(rate * 100)}%</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex size-4 items-center justify-center rounded-full border border-current">
            <CheckIcon className="size-2.5" strokeWidth={2.2} />
          </span>
          <span>
            {done}
            {due > 0 ? <span className="text-ink-subtle">/{due}</span> : null}
          </span>
        </span>
      </div>
    </Card>
  );
}

function RateGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 8V4.5" strokeLinecap="round" />
      <path d="M8 8l3 2" strokeLinecap="round" />
    </svg>
  );
}
