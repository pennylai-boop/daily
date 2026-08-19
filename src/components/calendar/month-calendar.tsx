"use client";

import Link from "next/link";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  addMonths,
  buildMonthGrid,
  dayOfMonth,
  formatMonthLabel,
  isSameMonth,
  startOfMonth,
  WEEKDAY_LABELS,
} from "@/lib/date";
import { getMood } from "@/lib/moods";
import { routinesDueOn } from "@/lib/routines";
import { hasContent } from "@/lib/stats";
import type { DailyState, IsoDate } from "@/lib/types";

interface MonthCalendarProps {
  monthIso: IsoDate;
  today: IsoDate;
  state: DailyState;
  onMonthChange: (monthIso: IsoDate) => void;
}

export function MonthCalendar({ monthIso, today, state, onMonthChange }: MonthCalendarProps) {
  const grid = buildMonthGrid(monthIso);
  const showTodayButton = !isSameMonth(monthIso, today);

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3.5 sm:px-5">
        <h2 className="text-[17px] font-semibold tracking-tight text-ink">
          {formatMonthLabel(monthIso)}
        </h2>
        <div className="flex items-center gap-1.5">
          {showTodayButton ? (
            <Button size="sm" variant="secondary" onClick={() => onMonthChange(startOfMonth(today))}>
              回到本月
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            aria-label="上一個月"
            className="size-10 px-0 sm:size-8"
            onClick={() => onMonthChange(addMonths(monthIso, -1))}
          >
            <ChevronLeftIcon className="size-5 sm:size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="下一個月"
            className="size-10 px-0 sm:size-8"
            onClick={() => onMonthChange(addMonths(monthIso, 1))}
          >
            <ChevronRightIcon className="size-5 sm:size-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-line bg-surface-muted/60">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              "py-2 text-center text-xs font-medium",
              index === 0 || index === 6 ? "text-brand" : "text-ink-muted",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-line p-px">
        {grid.map((date) => (
          <DayCell
            key={date}
            date={date}
            monthIso={monthIso}
            today={today}
            state={state}
          />
        ))}
      </div>
    </section>
  );
}

function DayCell({
  date,
  monthIso,
  today,
  state,
}: {
  date: IsoDate;
  monthIso: IsoDate;
  today: IsoDate;
  state: DailyState;
}) {
  const entry = state.entries[date] ?? null;
  const recorded = hasContent(entry);
  const mood = getMood(entry?.mood);
  const inMonth = isSameMonth(date, monthIso);
  const isToday = date === today;
  const isFutureDay = date > today;

  const due = routinesDueOn(state.routines, date).length;
  const done = due === 0 ? 0 : (state.checks[date] ?? []).length;

  return (
    <Link
      href={`/entry/${date}`}
      aria-label={`${date}${recorded ? `，心情：${mood?.label ?? "已記錄"}` : "，尚未記錄"}`}
      className={cn(
        "group relative flex aspect-[5/6] flex-col items-center gap-1 bg-surface px-1 pt-1.5 pb-2",
        "transition-colors sm:aspect-square sm:gap-1.5 sm:pt-2",
        inMonth ? "hover:bg-surface-muted" : "bg-paper-tint/40 hover:bg-paper-tint",
        !inMonth && "opacity-55",
      )}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
          isToday && "bg-brand text-on-brand",
          !isToday && inMonth && "text-ink-muted",
          !isToday && !inMonth && "text-ink-subtle",
          isFutureDay && !isToday && "text-ink-subtle",
        )}
      >
        {dayOfMonth(date)}
      </span>

      <span className="flex flex-1 items-center justify-center">
        {mood ? (
          <span
            aria-hidden
            title={mood.label}
            className="text-xl leading-none sm:text-[26px] lg:text-[28px]"
          >
            {mood.emoji}
          </span>
        ) : recorded ? (
          <span
            aria-hidden
            className="size-2 rounded-full bg-brand/45"
            title="已記錄，未選心情"
          />
        ) : null}
      </span>

      {due > 0 ? (
        <span
          aria-hidden
          title={`定期事項 ${done}/${due}`}
          className="h-1 w-8 overflow-hidden rounded-full bg-line-strong/50 sm:w-10"
        >
          <span
            className="block h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${(done / due) * 100}%` }}
          />
        </span>
      ) : (
        <span aria-hidden className="h-1" />
      )}
    </Link>
  );
}

export function MoodLegend() {
  return (
    <div className="card px-4 py-3.5">
      <p className="text-[13px] font-medium text-ink">心情圖樣</p>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2">
        {[
          { emoji: "😄", label: "燦爛" },
          { emoji: "😌", label: "平靜" },
          { emoji: "🥰", label: "感恩" },
          { emoji: "😪", label: "疲累" },
          { emoji: "😰", label: "焦慮" },
          { emoji: "😢", label: "低落" },
        ].map(({ emoji, label }) => (
          <li key={label} className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span aria-hidden>{emoji}</span>
            {label}
          </li>
        ))}
        <li className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span aria-hidden className="h-1 w-6 rounded-full bg-accent" />
          定期事項完成度
        </li>
      </ul>
    </div>
  );
}
