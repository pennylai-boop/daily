"use client";

import Link from "next/link";
import { useState } from "react";

import { FocusList } from "@/components/entry/focus-list";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import { RoutineForm } from "@/components/routines/routine-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { InfoHint } from "@/components/ui/info-hint";
import { Card, Chip, EmptyState, SectionHeading } from "@/components/ui/surfaces";
import {
  addDays,
  addMonths,
  formatMonthLabel,
  formatWeekRangeLabel,
  monthKey,
  startOfMonth,
  startOfWeek,
  todayIso,
} from "@/lib/date";
import { describeFrequency, isRoutineDueOn } from "@/lib/routines";
import { routineProgress } from "@/lib/stats";
import { useDailyStore } from "@/lib/store";
import { getTemplate } from "@/lib/templates";
import type { IsoDate, Routine } from "@/lib/types";

export function RoutinesScreen() {
  const {
    state,
    ready,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    setWeekGoals,
    setMonthGoals,
  } = useDailyStore();
  const [mode, setMode] = useState<{ kind: "closed" } | { kind: "create" } | { kind: "edit"; id: string }>({
    kind: "closed",
  });
  const [weekCursor, setWeekCursor] = useState<IsoDate>(() => startOfWeek(todayIso()));
  const [monthCursor, setMonthCursor] = useState<IsoDate>(() => startOfMonth(todayIso()));

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-8 w-40 rounded-lg bg-paper-tint" />
        <div className="h-40 rounded-xl bg-paper-tint" />
      </div>
    );
  }

  const today = todayIso();
  const weekItems = state.weekGoals[weekCursor] ?? [];
  const month = monthKey(monthCursor);
  const monthItems = state.monthGoals[month] ?? [];
  const active = state.routines.filter((routine) => !routine.archived);
  const archived = state.routines.filter((routine) => routine.archived);
  const progress = routineProgress(state, addDays(todayIso(), -29), today);
  const editing =
    mode.kind === "edit" ? state.routines.find((routine) => routine.id === mode.id) : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">定期目標</h1>
        <InfoHint label="定期目標是什麼">
          上面寫本月／本週想完成的事，打勾就劃掉。下面放會重複出現的目標，天天會在該做的日子排進當天清單；想書寫的再選一種記錄格式。
        </InfoHint>
      </header>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading
          title="月目標"
          description="條列該月想完成的事，勾選後會劃掉。可用右上角切換不同月份。"
          action={
            <PeriodNav
              label={formatMonthLabel(monthCursor)}
              prevLabel="上一月"
              nextLabel="下一月"
              onPrev={() => setMonthCursor(addMonths(monthCursor, -1))}
              onNext={() => setMonthCursor(addMonths(monthCursor, 1))}
            />
          }
        />
        <div className="mt-3">
          <FocusList
            items={monthItems}
            placeholder="新增一個這月想完成的目標"
            onChange={(next) => setMonthGoals(month, next)}
          />
        </div>
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading
          title="週目標"
          description="條列該週想完成的事，勾選後會劃掉。可用右上角切換不同週。"
          action={
            <PeriodNav
              label={formatWeekRangeLabel(weekCursor)}
              prevLabel="上一週"
              nextLabel="下一週"
              onPrev={() => setWeekCursor(addDays(weekCursor, -7))}
              onNext={() => setWeekCursor(addDays(weekCursor, 7))}
            />
          }
        />
        <div className="mt-3">
          <FocusList
            items={weekItems}
            placeholder="新增一個這週想完成的目標"
            onChange={(next) => setWeekGoals(weekCursor, next)}
          />
        </div>
      </Card>

      <div className="flex items-center gap-2 px-1">
        <h2 className="text-base font-semibold tracking-tight text-ink">每日目標</h2>
        <InfoHint label="重複目標是什麼">
          設定頻率後，天天會在該做的日子排進當天清單。點一列可以看完成統計。
        </InfoHint>
        {mode.kind === "closed" ? (
          <Button size="sm" className="ml-auto" onClick={() => setMode({ kind: "create" })}>
            <PlusIcon className="size-4" />
            新增目標
          </Button>
        ) : null}
      </div>

      {mode.kind === "create" ? (
        <Card className="px-4 py-5 sm:px-5">
          <h2 className="mb-4 text-base font-semibold text-ink">新增定期目標</h2>
          <RoutineForm
            submitLabel="建立"
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={(draft) => {
              addRoutine(draft);
              setMode({ kind: "closed" });
            }}
          />
        </Card>
      ) : null}

      {editing ? (
        <Card className="px-4 py-5 sm:px-5">
          <h2 className="mb-4 text-base font-semibold text-ink">編輯「{editing.title}」</h2>
          <RoutineForm
            submitLabel="儲存變更"
            initial={{
              title: editing.title,
              emoji: editing.emoji,
              note: editing.note,
              frequency: editing.frequency,
              template: editing.template,
              metricFields: editing.metricFields,
              timerDefaults: editing.timerDefaults,
              archived: editing.archived,
            }}
            onCancel={() => setMode({ kind: "closed" })}
            onSubmit={(draft) => {
              updateRoutine(editing.id, draft);
              setMode({ kind: "closed" });
            }}
          />
        </Card>
      ) : null}

      {active.length === 0 && mode.kind === "closed" ? (
        <Card>
          <EmptyState
            emoji="🔁"
            title="還沒有重複目標"
            description="像是每天寫五感恩、每週兩次觀心書、每月初記帳，都可以放進來。"
            action={
              <Button size="sm" onClick={() => setMode({ kind: "create" })}>
                建立第一個目標
              </Button>
            }
          />
        </Card>
      ) : null}

      {active.length > 0 ? (
        <ul className="space-y-2.5">
          {active.map((routine) => {
            const stats = progress.find((item) => item.routine.id === routine.id);
            return (
              <li key={routine.id}>
                <RoutineRow
                  routine={routine}
                  dueToday={isRoutineDueOn(routine, today)}
                  doneToday={(state.checks[today] ?? []).includes(routine.id)}
                  rate={stats && stats.due > 0 ? stats.rate : null}
                  onEdit={() => setMode({ kind: "edit", id: routine.id })}
                  onArchive={() => updateRoutine(routine.id, { archived: true })}
                  onDelete={() => {
                    if (!window.confirm(`刪除「${routine.title}」會一併清除它的完成紀錄，確定嗎？`)) {
                      return;
                    }
                    deleteRoutine(routine.id);
                  }}
                />
              </li>
            );
          })}
        </ul>
      ) : null}

      {archived.length > 0 ? (
        <section className="space-y-2.5">
          <h2 className="px-1 text-sm font-semibold text-ink-muted">已封存</h2>
          <ul className="space-y-2">
            {archived.map((routine) => (
              <li
                key={routine.id}
                className="card flex items-center gap-3 px-4 py-3 opacity-70"
              >
                <span aria-hidden className="text-base">
                  {routine.emoji}
                </span>
                <span className="flex-1 truncate text-sm text-ink">{routine.title}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => updateRoutine(routine.id, { archived: false })}
                >
                  復原
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`刪除 ${routine.title}`}
                  className="size-10 px-0 text-alert"
                  onClick={() => deleteRoutine(routine.id)}
                >
                  <TrashIcon className="size-6" strokeWidth={2} />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function PeriodNav({
  label,
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
}: {
  label: string;
  prevLabel: string;
  nextLabel: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button
        size="sm"
        variant="ghost"
        aria-label={prevLabel}
        className="size-10 shrink-0 p-0"
        onClick={onPrev}
      >
        <ChevronLeftIcon className="size-8" strokeWidth={2.2} />
      </Button>
      <span className="min-w-0 max-w-[11rem] truncate px-1 text-center text-[13px] text-ink-muted sm:max-w-none">
        {label}
      </span>
      <Button
        size="sm"
        variant="ghost"
        aria-label={nextLabel}
        className="size-10 shrink-0 p-0"
        onClick={onNext}
      >
        <ChevronRightIcon className="size-8" strokeWidth={2.2} />
      </Button>
    </div>
  );
}

function RoutineRow({
  routine,
  dueToday,
  doneToday,
  rate,
  onEdit,
  onArchive,
  onDelete,
}: {
  routine: Routine;
  dueToday: boolean;
  doneToday: boolean;
  rate: number | null;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const rateBar =
    rate === null ? null : (
      <div className="flex flex-1 items-center gap-2 sm:flex-none">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line sm:w-16 sm:flex-none">
          <span
            className={cn("block h-full rounded-full", rate >= 0.6 ? "bg-accent" : "bg-brand")}
            style={{ width: `${Math.round(rate * 100)}%` }}
          />
        </span>
        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-ink-muted">
          {Math.round(rate * 100)}%
        </span>
      </div>
    );

  // relative z-10：整張卡片是連往統計頁的連結（下方的 overlay），按鈕要疊在它上面才點得到。
  const actions = (
    <div className="relative z-10 flex shrink-0 items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        aria-label={`編輯「${routine.title}」的設定`}
        className="size-10 shrink-0 px-0"
        onClick={onEdit}
      >
        <PencilIcon className="size-6" strokeWidth={2} />
      </Button>
      <Button size="sm" variant="ghost" className="h-8" onClick={onArchive}>
        封存
      </Button>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`刪除「${routine.title}」`}
        className="size-10 shrink-0 px-0 text-alert"
        onClick={onDelete}
      >
        <TrashIcon className="size-6" strokeWidth={2} />
      </Button>
    </div>
  );

  return (
    <div className="card group relative px-4 py-3.5 transition-colors hover:border-line-strong">
      {/*
        整張卡片點下去進統計頁。用覆蓋整塊的連結而不是把整張卡包成 <a>：
        卡片裡有編輯／封存／刪除按鈕，連結裡不能再放按鈕。
      */}
      <Link
        href={`/routines/${routine.id}`}
        className="absolute inset-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span className="sr-only">查看「{routine.title}」的統計</span>
      </Link>

      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-lg"
        >
          {routine.emoji}
        </span>

        <div className="min-w-0 flex-1">
          {/* 頻率與備註和標題同一列：只有「每天」兩個字的話，多佔一整行很浪費。 */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[15px] font-semibold text-ink group-hover:text-brand-strong">
              {routine.title}
            </h3>
            {routine.template && getTemplate(routine.template).name !== routine.title ? (
              <Chip>
                {getTemplate(routine.template).emoji} {getTemplate(routine.template).name}
              </Chip>
            ) : null}
            {dueToday ? (
              <Chip tone={doneToday ? "accent" : "brand"}>
                {doneToday ? "今天已完成" : "今天要做"}
              </Chip>
            ) : null}
            <span className="text-[13px] text-ink-muted">
              {describeFrequency(routine.frequency)}
              {routine.note ? `・${routine.note}` : ""}
            </span>
          </div>
        </div>

        {/* 桌機：完成率與操作按鈕跟在同一行。 */}
        <div className="hidden items-center gap-3 sm:flex">
          {rateBar}
          {actions}
        </div>
      </div>

      {/* 手機：另起一行，避免標題被壓成兩三個字。 */}
      <div className="mt-2.5 flex items-center gap-3 sm:hidden">
        {rateBar ?? <span className="flex-1" />}
        {actions}
      </div>
    </div>
  );
}
