"use client";

import Link from "next/link";
import { useState } from "react";

import { LineChart } from "@/components/charts/line-chart";
import { ProgressRing } from "@/components/charts/progress-ring";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { RangeTabs } from "@/components/ui/range-tabs";
import {
  Card,
  Chip,
  EmptyState,
  SectionHeading,
  StatTile,
  TextLink,
} from "@/components/ui/surfaces";
import {
  addMonths,
  buildMonthGrid,
  dayOfMonth,
  endOfMonth,
  formatMonthLabel,
  isSameMonth,
  startOfMonth,
  todayIso,
  CALENDAR_WEEKDAY_LABELS,
  WEEKDAY_LABELS,
} from "@/lib/date";
import { describeFrequency, isRoutineDueOn } from "@/lib/routines";
import {
  buildRangeWindow,
  RANGE_OPTIONS,
  routineRateSeries,
  routineWordSeries,
  type RangeId,
} from "@/lib/series";
import {
  isRoutineDone,
  routineCompletion,
  routineDoneTotal,
  routineLongestStreak,
  routineStreak,
  routineWeekdayCompletion,
} from "@/lib/stats";
import { useDailyStore } from "@/lib/store";
import { countWords, getTemplate } from "@/lib/templates";
import type { DailyState, IsoDate, Routine } from "@/lib/types";

export function RoutineDetailScreen({ id }: { id: string }) {
  const { state, ready } = useDailyStore();

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy>
        <div className="h-9 w-48 rounded-lg bg-paper-tint" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-20 rounded-xl bg-paper-tint" />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-paper-tint" />
      </div>
    );
  }

  const routine = state.routines.find((item) => item.id === id);

  if (!routine) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <EmptyState
            emoji="🔍"
            title="找不到這個定期目標"
            description="它可能已經被刪除了。回到列表看看目前有哪些事項。"
            action={<TextLink href="/routines">回到定期目標 →</TextLink>}
          />
        </Card>
      </div>
    );
  }

  return <RoutineDetail state={state} routine={routine} />;
}

function RoutineDetail({ state, routine }: { state: DailyState; routine: Routine }) {
  const today = todayIso();
  const [monthIso, setMonthIso] = useState(startOfMonth(today));
  const [range, setRange] = useState<RangeId>("1m");

  const template = routine.template ? getTemplate(routine.template) : null;
  const month = routineCompletion(state, routine, startOfMonth(monthIso), endOfMonth(monthIso));
  const window = buildRangeWindow(state, range);
  const rangeLabel = RANGE_OPTIONS.find((option) => option.id === range)?.label ?? "";
  const weekdays = routineWeekdayCompletion(state, routine, window.from, window.to);
  const months = recentMonths(monthIso, 6);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <TextLink href="/routines">← 定期目標</TextLink>
      </div>

      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-2xl"
        >
          {routine.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{routine.title}</h1>
            {template ? (
              <Chip>
                {template.emoji} {template.name}
              </Chip>
            ) : (
              <Chip>只打勾</Chip>
            )}
            <Chip tone={isRoutineDueOn(routine, today) ? "brand" : "neutral"}>
              {describeFrequency(routine.frequency)}
            </Chip>
          </div>
          {routine.note ? (
            <p className="mt-1 text-[13px] text-ink-muted">{routine.note}</p>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <StatTile label="目前連續" value={routineStreak(state, routine, today)} unit="次" />
        <StatTile label="最長連續" value={routineLongestStreak(state, routine, today)} unit="次" />
        <StatTile label="累積完成" value={routineDoneTotal(state, routine)} unit="次" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-3 py-2.5 sm:px-4">
          <h2 className="text-[15px] font-semibold text-ink">{formatMonthLabel(monthIso)}</h2>
          <div className="ml-auto flex items-center gap-1">
            {!isSameMonth(monthIso, today) ? (
              <Button size="sm" variant="ghost" onClick={() => setMonthIso(startOfMonth(today))}>
                今天
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              aria-label="上一個月"
              className="size-8 shrink-0 border border-line-strong px-0"
              onClick={() => setMonthIso(addMonths(monthIso, -1))}
            >
              <ChevronLeftIcon className="size-6" strokeWidth={2} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="下一個月"
              className="size-8 shrink-0 border border-line-strong px-0"
              onClick={() => setMonthIso(addMonths(monthIso, 1))}
            >
              <ChevronRightIcon className="size-6" strokeWidth={2} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 px-3 py-3 sm:px-4">
          <ProgressRing label="這個月" done={month.done} due={month.due} size={64} />
          <div className="min-w-0 flex-1 space-y-1 text-[13px] text-ink-muted">
            <p className="flex items-center gap-2 whitespace-nowrap">
              <span aria-hidden className="w-5 text-center text-base">
                {routine.emoji}
              </span>
              已完成
            </p>
            <p className="flex items-center gap-2 whitespace-nowrap">
              <span aria-hidden className="flex w-5 justify-center">
                <span className="size-4 rounded-full border-2 border-dashed border-line-strong" />
              </span>
              該做沒打勾
            </p>
            <p className="flex items-center gap-2 whitespace-nowrap">
              <span aria-hidden className="flex w-5 justify-center">
                <span className="size-1.5 rounded-full bg-line-strong" />
              </span>
              沒有排定
            </p>
            {template ? (
              <p className="pt-0.5 text-xs text-ink-subtle">數字是當天寫的字數。</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-7 border-y border-line bg-surface-muted/60">
          {CALENDAR_WEEKDAY_LABELS.map((label, index) => (
            <div
              key={label}
              className={cn(
                "py-1.5 text-center text-xs font-medium",
                index === 5 || index === 6 ? "text-brand" : "text-ink-muted",
              )}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-line p-px">
          {buildMonthGrid(monthIso).map((date) => (
            <DayCell
              key={date}
              date={date}
              monthIso={monthIso}
              today={today}
              state={state}
              routine={routine}
              showWords={template !== null}
            />
          ))}
        </div>
      </Card>

      <RangeTabs options={RANGE_OPTIONS} value={range} onChange={setRange} ariaLabel="統計區間" />

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="完成率" description={`${rangeLabel}內的完成率，只計算該做的日子`} />
        <div className="mt-4">
          <LineChart
            labels={window.buckets.map((bucket) => bucket.label)}
            series={routineRateSeries(state, window.buckets, [routine])}
            yMax={100}
            yTicks={4}
            formatValue={(value) => `${Math.round(value)}%`}
            emptyHint="這段期間沒有排定這個事項。"
          />
        </div>
      </Card>

      {template ? (
        <Card className="px-4 py-4 sm:px-5">
          <SectionHeading title="書寫量" description={`${rangeLabel}內這個事項寫下的字數`} />
          <div className="mt-4">
            <LineChart
              labels={window.buckets.map((bucket) => bucket.label)}
              series={routineWordSeries(state, window.buckets, routine)}
              formatValue={(value) => `${Math.round(value)} 字`}
              emptyHint="這段期間還沒有寫下內容。"
            />
          </div>
        </Card>
      ) : null}

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="星期分布" description={`${rangeLabel}內在星期幾比較做得到`} />
        {weekdays.every((weekday) => weekday.due === 0) ? (
          <p className="mt-4 text-[13px] text-ink-muted">這段期間沒有排定這個事項。</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {weekdays.map((weekday, index) => (
              <li key={index} className="flex items-center gap-3">
                <span className="w-6 text-center text-[13px] text-ink-muted">
                  {WEEKDAY_LABELS[index]}
                </span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  {weekday.due > 0 ? (
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${Math.round(weekday.rate * 100)}%` }}
                    />
                  ) : null}
                </span>
                <span className="w-24 text-right text-[13px] tabular-nums text-ink-muted">
                  {weekday.due === 0
                    ? "沒有排定"
                    : `${weekday.done}/${weekday.due}・${Math.round(weekday.rate * 100)}%`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="每月統計" description="從你正在看的月份往回算六個月" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-muted">
                <th scope="col" className="py-2 pr-3 font-medium">
                  月份
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  該做
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  完成
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  完成率
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((monthStart) => {
                const stats = routineCompletion(
                  state,
                  routine,
                  monthStart,
                  endOfMonth(monthStart),
                );
                return (
                  <tr key={monthStart} className="border-b border-line/70 last:border-0">
                    <th scope="row" className="py-2 pr-3 text-left font-medium text-ink">
                      {formatMonthLabel(monthStart)}
                    </th>
                    <td className="py-2 pr-3 text-right tabular-nums text-ink-muted">
                      {stats.due}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-ink-muted">
                      {stats.done}
                    </td>
                    <td className="py-2 text-right tabular-nums font-medium text-ink">
                      {stats.due === 0 ? "—" : `${Math.round(stats.rate * 100)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DayCell({
  date,
  monthIso,
  today,
  state,
  routine,
  showWords,
}: {
  date: IsoDate;
  monthIso: IsoDate;
  today: IsoDate;
  state: DailyState;
  routine: Routine;
  showWords: boolean;
}) {
  const inMonth = isSameMonth(date, monthIso);
  const isToday = date === today;
  const due = isRoutineDueOn(routine, date);
  const done = isRoutineDone(state, routine, date);
  // 還沒到的日子不算「沒打勾」，畫得更淡一點，不然整個月看起來都是漏掉的。
  const upcoming = date > today;
  const words = showWords
    ? (state.entries[date]?.blocks ?? [])
        .filter((block) => block.routineId === routine.id)
        .reduce((sum, block) => sum + countWords(block), 0)
    : 0;

  return (
    <Link
      href={`/entry/${date}`}
      aria-label={`${date}・${
        due ? (done ? "已完成" : upcoming ? "之後要做" : "該做但沒有打勾") : "沒有排定"
      }`}
      className={cn(
        "flex min-h-[62px] flex-col items-center gap-0.5 bg-surface px-1 pt-1.5 pb-1 transition-colors hover:bg-surface-muted",
        !inMonth && "opacity-40",
      )}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full text-[11px] tabular-nums",
          isToday ? "bg-brand font-semibold text-on-brand" : "text-ink-muted",
        )}
      >
        {dayOfMonth(date)}
      </span>

      {done ? (
        <span aria-hidden className="text-base leading-none">
          {routine.emoji}
        </span>
      ) : due ? (
        <span
          aria-hidden
          className={cn(
            "mt-0.5 size-4 rounded-full border-2 border-dashed",
            upcoming ? "border-line" : "border-line-strong",
          )}
        />
      ) : (
        <span aria-hidden className="mt-1.5 size-1.5 rounded-full bg-line-strong" />
      )}

      {done && showWords && words > 0 ? (
        <span className="text-[10px] tabular-nums text-ink-subtle">{words}</span>
      ) : null}
    </Link>
  );
}

/** 從 `monthIso` 往回數的月份起始日，新的在前面。 */
function recentMonths(monthIso: IsoDate, count: number): IsoDate[] {
  return Array.from({ length: count }, (_, index) => addMonths(startOfMonth(monthIso), -index));
}
