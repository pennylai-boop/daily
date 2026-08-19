"use client";

import Link from "next/link";
import { Fragment } from "react";

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
import { MoodGlyph } from "@/components/entry/mood-picker";
import { findMood } from "@/lib/moods";
import { routinesDueOn } from "@/lib/routines";
import { completion, hasContent } from "@/lib/stats";
import type { DailyState, IsoDate } from "@/lib/types";

interface MonthCalendarProps {
  monthIso: IsoDate;
  today: IsoDate;
  state: DailyState;
  onMonthChange: (monthIso: IsoDate) => void;
}

export function MonthCalendar({ monthIso, today, state, onMonthChange }: MonthCalendarProps) {
  const grid = buildMonthGrid(monthIso);
  const weeks = Array.from({ length: grid.length / 7 }, (_, index) =>
    grid.slice(index * 7, index * 7 + 7),
  );
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

      <div className={cn(GRID_COLUMNS, "border-b border-line bg-surface-muted/60")}>
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
        <div className="py-2 text-center text-xs font-medium text-ink-subtle" title="整週的完成度">
          週
        </div>
      </div>

      <div className={cn(GRID_COLUMNS, "gap-px bg-line p-px")}>
        {weeks.map((week) => (
          <Fragment key={week[0]}>
            {week.map((date) => (
              <DayCell key={date} date={date} monthIso={monthIso} today={today} state={state} />
            ))}
            <WeekCell week={week} state={state} />
          </Fragment>
        ))}
      </div>
    </section>
  );
}

/** 七天 + 一欄週完成度。週那一欄固定窄寬度，日期格子才不會被壓扁。 */
const GRID_COLUMNS = "grid grid-cols-[repeat(7,minmax(0,1fr))_2.25rem] sm:grid-cols-[repeat(7,minmax(0,1fr))_3rem]";

function WeekCell({ week, state }: { week: IsoDate[]; state: DailyState }) {
  const { done, due, rate } = completion(state, week[0], week[week.length - 1]);
  const percent = Math.round(rate * 100);

  return (
    <div
      title={due === 0 ? "這週沒有排定的事項" : `這週定期事項 ${done}/${due}`}
      className="flex flex-col items-center justify-center gap-1 bg-surface-muted/60 px-0.5"
    >
      {due === 0 ? (
        <span className="text-[11px] text-ink-subtle">—</span>
      ) : (
        <>
          <span className="text-[11px] font-semibold tabular-nums text-ink-muted">{percent}%</span>
          <span aria-hidden className="h-1 w-6 overflow-hidden rounded-full bg-line-strong/50">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${percent}%` }}
            />
          </span>
        </>
      )}
    </div>
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
  const mood = findMood(entry?.mood, state.customMoods);
  const inMonth = isSameMonth(date, monthIso);
  const isToday = date === today;
  const isFutureDay = date > today;

  const due = routinesDueOn(state.routines, date).length;
  const done = due === 0 ? 0 : (state.checks[date] ?? []).length;
  const percent = due === 0 ? 0 : Math.round((done / due) * 100);

  return (
    <Link
      href={`/entry/${date}`}
      aria-label={[
        date,
        recorded ? `心情：${mood?.label ?? "已記錄"}` : "尚未記錄",
        due > 0 ? `定期事項完成 ${percent}%（${done}/${due}）` : null,
      ]
        .filter(Boolean)
        .join("，")}
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

      <span className="flex flex-1 items-center justify-center" title={mood?.label}>
        {mood ? (
          <MoodGlyph mood={mood} size={24} />
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
          title={`定期事項 ${percent}%（${done}/${due}）`}
          className="h-1 w-8 overflow-hidden rounded-full bg-line-strong/50 sm:w-10"
        >
          <span
            className="block h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </span>
      ) : (
        <span aria-hidden className="h-1" />
      )}
    </Link>
  );
}

/**
 * 日格子下緣那條細線的圖例。心情表情不需要圖例（右側面板本來就列著全部的心情與名稱），
 * 所以只留完成度這一條，跟在日期後面就好，不用一張卡片。
 */
export function CompletionLegend({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-ink-muted", className)}>
      <span aria-hidden className="h-1 w-6 shrink-0 rounded-full bg-accent" />
      定期事項完成度
    </p>
  );
}
