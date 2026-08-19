"use client";

import { useState } from "react";

import { MonthCalendar, MoodLegend } from "@/components/calendar/month-calendar";
import { MoodPicker } from "@/components/entry/mood-picker";
import { PencilIcon } from "@/components/icons";
import { RoutineChecklist } from "@/components/routines/routine-checklist";
import { LinkButton } from "@/components/ui/button";
import { Chip, EmptyState, TextLink } from "@/components/ui/surfaces";
import { formatFullDate, formatMonthLabel, startOfMonth, todayIso } from "@/lib/date";
import { routinesDueOn } from "@/lib/routines";
import { currentStreak, hasContent, monthEntryCount } from "@/lib/stats";
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
        </div>
        <p className="text-sm text-ink-muted">{formatFullDate(today)}</p>
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
          <MoodLegend />
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
