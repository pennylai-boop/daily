"use client";

import Link from "next/link";

import { CheckIcon, ChevronRightIcon } from "@/components/icons";
import { RoutineCheckGrid } from "@/components/routines/check-grid";
import { cn } from "@/components/ui/cn";
import { describeFrequency } from "@/lib/routines";
import { getTemplate } from "@/lib/templates";
import type { IsoDate, Routine } from "@/lib/types";

const ROW_BASE = "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors";

export function RoutineChecklist({
  routines,
  checkedIds,
  date,
  onToggle,
}: {
  routines: Routine[];
  checkedIds: string[];
  date: IsoDate;
  onToggle: (routineId: string, date: IsoDate) => void;
}) {
  // 需要書寫的事項不在這裡打勾，改為導到當天的編輯頁填寫內容，所以各佔一列並帶箭頭；
  // 只打勾的事項沒有下一步，交給 RoutineCheckGrid 並排，這張卡片才不會被拉得很長。
  const writing = routines.filter((routine) => routine.template);
  const checkOnly = routines.filter((routine) => !routine.template);

  return (
    <div className="space-y-2">
      {writing.length > 0 ? (
        <ul className="space-y-1.5">
          {writing.map((routine) => {
            const checked = checkedIds.includes(routine.id);

            return (
              <li key={routine.id}>
                <Link
                  href={`/entry/${date}`}
                  className={cn(
                    ROW_BASE,
                    checked
                      ? "border-accent/40 bg-accent-tint"
                      : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted",
                  )}
                >
                  <StatusDot checked={checked} />
                  <RoutineLabel routine={routine} checked={checked} />
                  <ChevronRightIcon className="size-4 shrink-0 text-ink-subtle" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      {checkOnly.length > 0 ? (
        <RoutineCheckGrid
          routines={checkOnly}
          checkedIds={checkedIds}
          onToggle={(routine) => onToggle(routine.id, date)}
        />
      ) : null}
    </div>
  );
}

function StatusDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
        checked ? "border-accent bg-accent text-on-accent" : "border-line-strong bg-surface",
      )}
    >
      {checked ? <CheckIcon className="size-3.5" strokeWidth={2.6} /> : null}
    </span>
  );
}

function RoutineLabel({ routine, checked }: { routine: Routine; checked: boolean }) {
  const meta = routine.template ? getTemplate(routine.template) : null;

  return (
    <>
      <span aria-hidden className="text-base">
        {routine.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn("block truncate text-sm font-medium", checked ? "text-accent" : "text-ink")}
        >
          {routine.title}
        </span>
        <span className="block truncate text-xs text-ink-subtle">
          {meta ? `${meta.name}・` : ""}
          {describeFrequency(routine.frequency)}
          {routine.note ? `・${routine.note}` : ""}
        </span>
      </span>
    </>
  );
}
