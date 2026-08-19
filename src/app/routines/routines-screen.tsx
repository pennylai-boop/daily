"use client";

import { useState } from "react";

import { PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { RoutineForm } from "@/components/routines/routine-form";
import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Card, Chip, EmptyState } from "@/components/ui/surfaces";
import { addDays, todayIso } from "@/lib/date";
import { describeFrequency, isRoutineDueOn } from "@/lib/routines";
import { routineProgress } from "@/lib/stats";
import { useDailyStore } from "@/lib/store";
import { getTemplate } from "@/lib/templates";
import type { Routine } from "@/lib/types";

export function RoutinesScreen() {
  const { state, ready, addRoutine, updateRoutine, deleteRoutine } = useDailyStore();
  const [mode, setMode] = useState<{ kind: "closed" } | { kind: "create" } | { kind: "edit"; id: string }>({
    kind: "closed",
  });

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-8 w-40 rounded-lg bg-paper-tint" />
        <div className="h-40 rounded-xl bg-paper-tint" />
      </div>
    );
  }

  const today = todayIso();
  const active = state.routines.filter((routine) => !routine.archived);
  const archived = state.routines.filter((routine) => routine.archived);
  const progress = routineProgress(state, addDays(todayIso(), -29), today);
  const editing =
    mode.kind === "edit" ? state.routines.find((routine) => routine.id === mode.id) : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">定期事項</h1>
          <p className="text-sm text-ink-muted">
            設定重複的頻率，天天會在該做的日子排進當天清單。想書寫的事項再選一種記錄格式，
            例如五感恩或觀心書。
          </p>
        </div>
        {mode.kind === "closed" ? (
          <Button className="w-full sm:w-auto" onClick={() => setMode({ kind: "create" })}>
            <PlusIcon className="size-4" />
            新增事項
          </Button>
        ) : null}
      </header>

      {mode.kind === "create" ? (
        <Card className="px-4 py-5 sm:px-5">
          <h2 className="mb-4 text-base font-semibold text-ink">新增定期事項</h2>
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
            title="還沒有定期事項"
            description="像是每天寫五感恩、每週兩次觀心書、每月初記帳，都可以放進來。"
            action={
              <Button size="sm" onClick={() => setMode({ kind: "create" })}>
                建立第一個事項
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
                  writeHref={routine.template ? `/entry/${today}` : null}
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
                  className="size-8 px-0 text-alert"
                  onClick={() => deleteRoutine(routine.id)}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function RoutineRow({
  routine,
  dueToday,
  doneToday,
  rate,
  writeHref,
  onEdit,
  onArchive,
  onDelete,
}: {
  routine: Routine;
  dueToday: boolean;
  doneToday: boolean;
  rate: number | null;
  /** 有記錄格式的事項才有內容可寫，null 代表只需要打勾。 */
  writeHref: string | null;
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

  const actions = (
    <div className="flex shrink-0 items-center gap-1">
      {writeHref ? (
        <LinkButton
          href={writeHref}
          size="sm"
          variant="secondary"
          className="h-9 sm:h-8"
          aria-label={`填寫今天的${routine.title}`}
        >
          填寫
        </LinkButton>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        aria-label="編輯事項設定"
        className="size-9 px-0 sm:size-8"
        onClick={onEdit}
      >
        <PencilIcon className="size-4" />
      </Button>
      <Button size="sm" variant="ghost" className="h-9 sm:h-8" onClick={onArchive}>
        封存
      </Button>
      <Button
        size="sm"
        variant="ghost"
        aria-label="刪除"
        className="size-9 px-0 text-alert sm:size-8"
        onClick={onDelete}
      >
        <TrashIcon className="size-4" />
      </Button>
    </div>
  );

  return (
    <div className="card px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-lg"
        >
          {routine.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[15px] font-semibold text-ink">{routine.title}</h3>
            {routine.template ? (
              <Chip>
                {getTemplate(routine.template).emoji} {getTemplate(routine.template).name}
              </Chip>
            ) : null}
            {dueToday ? (
              <Chip tone={doneToday ? "accent" : "brand"}>
                {doneToday ? "今天已完成" : "今天要做"}
              </Chip>
            ) : null}
          </div>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {describeFrequency(routine.frequency)}
            {routine.note ? `・${routine.note}` : ""}
          </p>
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
