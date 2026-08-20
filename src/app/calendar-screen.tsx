"use client";

import { useState } from "react";

import { CompletionLegend, MonthCalendar } from "@/components/calendar/month-calendar";
import { ProgressRing } from "@/components/charts/progress-ring";
import { MoodPicker } from "@/components/entry/mood-picker";
import { CheckIcon, PencilIcon } from "@/components/icons";
import { RoutineChecklist } from "@/components/routines/routine-checklist";
import { LinkButton } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import { Chip, EmptyState, TextLink } from "@/components/ui/surfaces";
import {
  endOfMonth,
  formatFullDate,
  formatMonthLabel,
  isSameMonth,
  monthKey,
  startOfMonth,
  startOfWeek,
  todayIso,
} from "@/lib/date";
import { routinesDueOn } from "@/lib/routines";
import { completion, currentStreak, hasContent, monthEntryCount } from "@/lib/stats";
import { createDayEntry, setMonthGoals, setWeekGoals, useDailyStore } from "@/lib/store";
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

  const weekStart = startOfWeek(today);
  const weekGoals = state.weekGoals[weekStart] ?? [];
  const monthGoals = state.monthGoals[monthKey(today)] ?? [];
  const doneWeek = weekGoals.filter((item) => item.done);
  const doneMonth = monthGoals.filter((item) => item.done);
  const doneFocus = (todayEntry?.focus ?? []).filter((item) => item.done);
  const hasCompletedGoals = doneWeek.length > 0 || doneMonth.length > 0 || doneFocus.length > 0;

  const setMood = (mood: MoodId | null) => {
    const base = todayEntry ?? createDayEntry(today);
    saveEntry({ ...base, mood, updatedAt: new Date().toISOString() });
  };

  const toggleFocusDone = (id: string) => {
    const base = todayEntry ?? createDayEntry(today);
    const focus = base.focus.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item,
    );
    saveEntry({ ...base, focus, updatedAt: new Date().toISOString() });
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
              <div className="flex items-center gap-1">
                <h2 className="text-sm font-semibold text-ink">預定計畫完成度</h2>
                <InfoHint label="預定計畫完成度的說明">
                  只計算該做的日子，未來的日子不計入。
                </InfoHint>
              </div>
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
            <div className="flex items-center gap-1">
              <h2 className="text-sm font-semibold text-ink">今天的心情</h2>
              <InfoHint label="今天的心情的說明">選一個表情，它會出現在日曆上。</InfoHint>
            </div>
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
              <h2 className="text-sm font-semibold text-ink">今日定期目標</h2>
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
                title="今天沒有排定的目標"
                description="建立定期目標後，天天會在該做的日子提醒你。"
                action={<TextLink href="/routines">設定定期目標 →</TextLink>}
              />
            )}
          </section>

          {hasCompletedGoals ? (
            <section className="card overflow-hidden">
              <header className="border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">已完成的目標</h2>
              </header>
              <ul className="divide-y divide-line px-4 py-1">
                {doneFocus.map((item) => (
                  <CompletedGoalRow
                    key={`focus-${item.id}`}
                    label={item.text}
                    badge="今日目標"
                    onToggle={() => toggleFocusDone(item.id)}
                  />
                ))}
                {doneWeek.map((item) => (
                  <CompletedGoalRow
                    key={`week-${item.id}`}
                    label={item.text}
                    badge="本週"
                    onToggle={() =>
                      setWeekGoals(
                        weekStart,
                        weekGoals.map((current) =>
                          current.id === item.id ? { ...current, done: false } : current,
                        ),
                      )
                    }
                  />
                ))}
                {doneMonth.map((item) => (
                  <CompletedGoalRow
                    key={`month-${item.id}`}
                    label={item.text}
                    badge="本月"
                    onToggle={() =>
                      setMonthGoals(
                        monthKey(today),
                        monthGoals.map((current) =>
                          current.id === item.id ? { ...current, done: false } : current,
                        ),
                      )
                    }
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CompletedGoalRow({
  label,
  badge,
  onToggle,
}: {
  label: string;
  badge: string;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-center gap-2.5 py-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked
        aria-label={`取消完成：${label}`}
        onClick={onToggle}
        className="flex size-[18px] shrink-0 items-center justify-center rounded border border-accent bg-accent text-on-accent"
      >
        <CheckIcon className="size-3" strokeWidth={2.6} />
      </button>
      <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink-subtle line-through">
        {label}
      </span>
      <span className="shrink-0 text-[11px] text-ink-subtle">{badge}</span>
    </li>
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
