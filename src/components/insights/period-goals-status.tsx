"use client";

import type { ReactNode } from "react";

import { Card, SectionHeading, TextLink } from "@/components/ui/surfaces";
import { cn } from "@/components/ui/cn";
import { formatWeekRangeLabel, monthKey, startOfWeek } from "@/lib/date";
import type { DailyState, FocusItem, IsoDate } from "@/lib/types";

export function PeriodGoalsStatus({ state, today }: { state: DailyState; today: IsoDate }) {
  const weekStart = startOfWeek(today);
  const dayItems = state.entries[today]?.focus ?? [];
  const weekItems = state.weekGoals[weekStart] ?? [];
  const monthItems = state.monthGoals[monthKey(today)] ?? [];

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="目標完成狀態"
        description="本月、本週與今日目標。可在月曆或紀錄頁勾選。"
      />
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <GoalColumn
          title="月目標"
          hint={today.slice(0, 7).replace("-", " / ")}
          items={monthItems}
          emptyHint="尚未設定本月目標"
          emptyAction={<TextLink href="/">到月曆新增 →</TextLink>}
        />
        <GoalColumn
          title="週目標"
          hint={formatWeekRangeLabel(weekStart)}
          items={weekItems}
          emptyHint="尚未設定本週目標"
          emptyAction={<TextLink href="/">到月曆新增 →</TextLink>}
        />
        <GoalColumn
          title="日目標"
          hint="今天"
          items={dayItems}
          emptyHint="今天還沒寫目標"
          emptyAction={<TextLink href={`/entry/${today}`}>去紀錄頁 →</TextLink>}
        />
      </div>
    </Card>
  );
}

function GoalColumn({
  title,
  hint,
  items,
  emptyHint,
  emptyAction,
}: {
  title: string;
  hint: string;
  items: FocusItem[];
  emptyHint: string;
  emptyAction: ReactNode;
}) {
  const done = items.filter((item) => item.done).length;
  const total = items.length;
  const rate = total === 0 ? 0 : done / total;

  return (
    <div className="rounded-xl bg-surface-muted/80 px-3 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {total > 0 ? (
          <span className="text-[12px] tabular-nums text-ink-muted">
            {done}/{total}・{Math.round(rate * 100)}%
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-[11px] text-ink-subtle">{hint}</p>

      {total === 0 ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-[12px] text-ink-muted">{emptyHint}</p>
          {emptyAction}
        </div>
      ) : (
        <>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-paper-tint">
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${Math.round(rate * 100)}%` }}
            />
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-[12px] leading-snug">
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border",
                    item.done
                      ? "border-accent bg-accent text-on-accent"
                      : "border-line-strong bg-surface",
                  )}
                >
                  {item.done ? (
                    <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
                <span className={cn("min-w-0 text-ink", item.done && "text-ink-muted line-through")}>
                  {item.text || "（空白）"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
