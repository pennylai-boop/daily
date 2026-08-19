"use client";

import { useState } from "react";

import { CompletionLegend, MonthCalendar } from "@/components/calendar/month-calendar";
import { ProgressRing } from "@/components/charts/progress-ring";
import { MoodPicker } from "@/components/entry/mood-picker";
import { PencilIcon } from "@/components/icons";
import { RoutineChecklist } from "@/components/routines/routine-checklist";
import { LinkButton } from "@/components/ui/button";
import { Chip, EmptyState, TextLink } from "@/components/ui/surfaces";
import {
  endOfMonth,
  formatFullDate,
  formatMonthLabel,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  todayIso,
} from "@/lib/date";
import { routinesDueOn } from "@/lib/routines";
import { completion, currentStreak, hasContent, monthEntryCount } from "@/lib/stats";
import { createDayEntry, useDailyStore } from "@/lib/store";
import type { MoodId } from "@/lib/types";

export function CalendarScreen() {
  const { state, ready, saveEntry, toggleRoutineCheck } = useDailyStore();
  const [monthIso, setMonthIso] = useState(() => startOfMonth(todayIso()));

  if (!ready) return <PageSkeleton />;

  const today = todayIso();

  const todayEntry = state.entries[today] ?? null;
  const dueToday = routinesDueOn(state.routines, today);
  const checkedToday = state.checks[today] ?? [];
  const streak = currentStreak(state, today);
  const monthCount = monthEntryCount(state, monthIso);

  const dayRate = completion(state, today, today);
  const weekRate = completion(state, startOfWeek(today), today);
  // 月的環跟著使用者正在看的月份走，週與日一律是「現在」。
  const monthRate = completion(state, startOfMonth(monthIso), endOfMonth(monthIso));

  const setMood = (mood: MoodId | null) => {
    const base = todayEntry ?? createDayEntry(today);
    saveEntry({ ...base, mood, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">今天</h1>
          {streak > 0 ? <Chip tone="brand">🔥 連續 {streak} 天</Chip> : null}
          {hasContent(todayEntry) ? <Chip tone="accent">已記錄</Chip> : null}
          <LinkButton href={`/entry/${today}`} className="ml-auto">
            <PencilIcon className="size-4" />
            {hasContent(todayEntry) ? "繼續寫今天" : "寫今天的日記"}
          </LinkButton>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-sm text-ink-muted">{formatFullDate(today)}</p>
          <CompletionLegend />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <MonthCalendar
            monthIso={monthIso}
            today={today}
            state={state}
            onMonthChange={setMonthIso}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-[13px] text-ink-muted">
              {formatMonthLabel(monthIso)}已記錄
              <span className="mx-1 font-semibold text-ink">{monthCount}</span>
              天
            </p>
            <TextLink href="/insights">查看回顧 →</TextLink>
          </div>

          <section className="card px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="text-sm font-semibold text-ink">預定計畫完成度</h2>
              <p className="text-xs text-ink-subtle">只計算該做的日子，未來的日子不計入</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
              <ProgressRing label="今天" done={dayRate.done} due={dayRate.due} />
              <ProgressRing label="本週" done={weekRate.done} due={weekRate.due} />
              <ProgressRing
                label={isSameMonth(monthIso, today) ? "本月" : formatMonthLabel(monthIso)}
                done={monthRate.done}
                due={monthRate.due}
              />
          </div>
        </section>
      </div>

        <div className="space-y-4">
          <section className="card px-4 py-4">
            <h2 className="text-sm font-semibold text-ink">今天的心情</h2>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              選一個表情，它會出現在日曆上。
            </p>
            <div className="mt-3">
              <MoodPicker value={todayEntry?.mood ?? null} onChange={setMood} size="sm" />
            </div>
            <LinkButton href={`/entry/${today}`} className="mt-4 w-full">
              <PencilIcon className="size-4" />
              {hasContent(todayEntry) ? "繼續寫今天的紀錄" : "寫下今天的紀錄"}
            </LinkButton>
          </section>

          <section className="card overflow-hidden">
            <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">今日定期事項</h2>
              {dueToday.length > 0 ? (
                <span className="text-[13px] tabular-nums text-ink-muted">
                  {checkedToday.filter((id) => dueToday.some((routine) => routine.id === id)).length}
                  {" / "}
                  {dueToday.length}
                </span>
              ) : null}
            </header>
            {dueToday.length > 0 ? (
              <div className="px-3 py-3">
                <RoutineChecklist
                  routines={dueToday}
                  checkedIds={checkedToday}
                  date={today}
                  onToggle={toggleRoutineCheck}
                />
              </div>
            ) : (
              <EmptyState
                emoji="🌱"
                title="今天沒有排定的事項"
                description="建立定期事項後，天天會在該做的日子提醒你。"
                action={<TextLink href="/routines">設定定期事項 →</TextLink>}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="space-y-2">
        <div className="h-8 w-24 rounded-lg bg-paper-tint" />
        <div className="h-4 w-48 rounded bg-paper-tint" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="h-[26rem] rounded-xl bg-paper-tint" />
        <div className="h-64 rounded-xl bg-paper-tint" />
      </div>
    </div>
  );
}
