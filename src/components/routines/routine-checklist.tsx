"use client";

import Link from "next/link";

import { CheckIcon, ChevronRightIcon } from "@/components/icons";
import { cn } from "@/components/ui/cn";
import { describeFrequency } from "@/lib/routines";
import { getTemplate } from "@/lib/templates";
import type { IsoDate, Routine } from "@/lib/types";

/**
 * 今日定期目標清單：一律三欄並排（容器夠寬時），書寫型連到紀錄頁、其餘直接打勾。
 *
 * 欄數用容器查詢：日曆側欄窄時退回兩欄，紀錄頁寬欄可維持三欄。
 */
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
  if (routines.length === 0) return null;

  return (
    <div className="@container">
      <ul className="grid grid-cols-2 gap-2 @3xs:grid-cols-3">
        {routines.map((routine) => {
          const checked = checkedIds.includes(routine.id);
          const writing = Boolean(routine.template);
          const meta = writing && routine.template ? getTemplate(routine.template) : null;
          const detail = [
            meta && meta.name !== routine.title ? meta.name : null,
            describeFrequency(routine.frequency),
            routine.note || null,
          ]
            .filter(Boolean)
            .join("・");

          const className = cn(
            "flex min-h-11 w-full flex-col items-start gap-1 rounded-xl border px-2 py-1.5 text-left transition-colors @sm:flex-row @sm:items-center @sm:gap-1.5",
            checked
              ? "border-accent/40 bg-accent-tint font-medium text-accent"
              : "border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-muted",
          );

          const body = (
            <>
              <span className="flex shrink-0 items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 items-center justify-center rounded-md border transition-colors",
                    checked
                      ? "border-accent bg-accent text-on-accent"
                      : "border-line-strong bg-surface",
                  )}
                >
                  {checked ? <CheckIcon className="size-3.5" strokeWidth={2.6} /> : null}
                </span>
                <span aria-hidden className="text-[15px]">
                  {routine.emoji}
                </span>
              </span>
              <span className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-tight break-words">
                {routine.title}
              </span>
              {writing ? (
                <ChevronRightIcon className="hidden size-3.5 shrink-0 text-ink-subtle @sm:block" />
              ) : null}
            </>
          );

          return (
            <li key={routine.id}>
              {writing ? (
                <Link
                  href={`/entry/${date}`}
                  title={detail ? `${routine.title}・${detail}` : routine.title}
                  className={className}
                >
                  {body}
                </Link>
              ) : (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  title={detail ? `${routine.title}・${detail}` : routine.title}
                  onClick={() => onToggle(routine.id, date)}
                  className={className}
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
