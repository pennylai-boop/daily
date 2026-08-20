"use client";

import { CheckIcon } from "@/components/icons";
import { cn } from "@/components/ui/cn";
import { describeFrequency } from "@/lib/routines";
import type { Routine } from "@/lib/types";

/**
 * 定期事項勾選格：三欄並排（容器夠寬時）。
 *
 * 欄數用**容器查詢**而不是螢幕寬度決定：同一個元件會出現在紀錄頁的寬欄與日曆頁
 * 桌機版的窄側欄，用 `sm:` 之類的螢幕寬度斷點一定會有一邊排壞。
 * 容器窄到 256px 以下才退回兩欄。
 */
export function RoutineCheckGrid({
  routines,
  checkedIds,
  onToggle,
}: {
  routines: Routine[];
  checkedIds: string[];
  onToggle: (routine: Routine) => void;
}) {
  return (
    <div className="@container">
      <ul className="grid grid-cols-2 gap-2 @3xs:grid-cols-3">
        {routines.map((routine) => {
          const checked = checkedIds.includes(routine.id);

          return (
            <li key={routine.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                // 頻率與備註移到 tooltip，並排的格子裡只留看得懂的名字。
                title={`${routine.title}・${describeFrequency(routine.frequency)}${
                  routine.note ? `・${routine.note}` : ""
                }`}
                onClick={() => onToggle(routine)}
                className={cn(
                  // 窄容器時名字換到第二行，才拿得到整格的寬度：和方框並排的話，
                  //「喝滿 2000ml 水」只剩 45px 可用，會被截成「喝滿 20…」。
                  "flex min-h-11 w-full flex-col items-start gap-1 rounded-xl border px-2 py-1.5 text-left transition-colors @sm:flex-row @sm:items-center @sm:gap-1.5",
                  checked
                    ? "border-accent/40 bg-accent-tint font-medium text-accent"
                    : "border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-muted",
                )}
              >
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
                <span className="line-clamp-2 min-w-0 text-[13px] leading-tight break-words">
                  {routine.title}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
