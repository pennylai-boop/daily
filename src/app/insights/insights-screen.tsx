"use client";

import Link from "next/link";
import { useState } from "react";

import { LineChart } from "@/components/charts/line-chart";
import { RangeTabs } from "@/components/ui/range-tabs";
import {
  Card,
  Chip,
  EmptyState,
  SectionHeading,
  StatTile,
  TextLink,
} from "@/components/ui/surfaces";
import { formatFullDate, formatRelativeDay, todayIso } from "@/lib/date";
import { MOODS } from "@/lib/moods";
import {
  buildRangeWindow,
  moodSeries,
  RANGE_OPTIONS,
  routineRateSeries,
  writingSeries,
  type RangeId,
} from "@/lib/series";
import {
  currentStreak,
  hasContent,
  longestStreak,
  recordedDates,
  routineProgress,
  totalWrittenBlocks,
} from "@/lib/stats";
import { useDailyStore } from "@/lib/store";
import { getTemplate, isBlockEmpty, summarizeBlock } from "@/lib/templates";
import type { DayEntry, MoodId } from "@/lib/types";

export function InsightsScreen() {
  const { state, ready } = useDailyStore();
  const [range, setRange] = useState<RangeId>("1m");

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-8 w-32 rounded-lg bg-paper-tint" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-20 rounded-xl bg-paper-tint" />
          ))}
        </div>
        <div className="h-56 rounded-xl bg-paper-tint" />
      </div>
    );
  }

  const today = todayIso();
  const dates = recordedDates(state);

  if (dates.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageTitle />
        <Card>
          <EmptyState
            emoji="📈"
            title="還沒有可以回顧的內容"
            description="寫下第一篇紀錄之後，這裡會出現心情趨勢、書寫量與定期事項完成率的比較圖表。"
            action={<TextLink href={`/entry/${today}`}>開始記錄今天 →</TextLink>}
          />
        </Card>
      </div>
    );
  }

  const window = buildRangeWindow(state, range);
  const activeRoutines = state.routines.filter((routine) => !routine.archived);

  const windowEntries = Object.values(state.entries).filter(
    (entry) => hasContent(entry) && entry.date >= window.from && entry.date <= window.to,
  );

  const moodTally = new Map<MoodId, number>();
  for (const entry of windowEntries) {
    if (entry.mood) moodTally.set(entry.mood, (moodTally.get(entry.mood) ?? 0) + 1);
  }
  const moodTotal = [...moodTally.values()].reduce((sum, count) => sum + count, 0);

  const progress = routineProgress(state, window.from, window.to).filter((item) => item.due > 0);
  const recent = [...dates].reverse().slice(0, 8);
  const rangeLabel = RANGE_OPTIONS.find((option) => option.id === range)?.label ?? "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageTitle />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="目前連續" value={currentStreak(state, today)} unit="天" />
        <StatTile label="最長連續" value={longestStreak(state)} unit="天" />
        <StatTile label="累積記錄" value={dates.length} unit="天" />
        <StatTile label="書寫段落" value={totalWrittenBlocks(state)} unit="段" />
      </div>

      <RangeTabs
        options={RANGE_OPTIONS}
        value={range}
        onChange={setRange}
        ariaLabel="統計區間"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="px-4 py-4 sm:px-5">
          <SectionHeading
            title="心情趨勢"
            description={`${rangeLabel}的心情平均分數，5 分最愉快`}
          />
          <div className="mt-4">
            <LineChart
              labels={window.buckets.map((bucket) => bucket.label)}
              series={moodSeries(state, window.buckets)}
              yMin={1}
              yMax={5}
              yTicks={4}
              formatValue={(value) => value.toFixed(1)}
              emptyHint="這段期間還沒有選過心情表情。"
            />
          </div>
        </Card>

        <Card className="px-4 py-4 sm:px-5">
          <SectionHeading title="書寫量比較" description={`${rangeLabel}內各記錄格式的字數`} />
          <div className="mt-4">
            <LineChart
              labels={window.buckets.map((bucket) => bucket.label)}
              series={writingSeries(state, window.buckets)}
              formatValue={(value) => `${Math.round(value)}`}
              emptyHint="這段期間還沒有書寫內容。"
            />
          </div>
        </Card>

        <Card className="px-4 py-4 sm:px-5 lg:col-span-2">
          <SectionHeading
            title="定期事項完成率比較"
            description={`${rangeLabel}內每個事項的完成率，只計算該做的日子`}
          />
          <div className="mt-4">
            <LineChart
              labels={window.buckets.map((bucket) => bucket.label)}
              series={routineRateSeries(state, window.buckets, activeRoutines)}
              yMax={100}
              yTicks={4}
              formatValue={(value) => `${Math.round(value)}%`}
              emptyHint="這段期間沒有排定的定期事項。"
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="px-4 py-4 sm:px-5">
          <SectionHeading title="心情分布" description={`${rangeLabel}共記錄 ${moodTotal} 次心情`} />
          {moodTotal === 0 ? (
            <p className="mt-4 text-[13px] text-ink-muted">這段期間還沒有選過心情表情。</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {MOODS.filter((mood) => (moodTally.get(mood.id) ?? 0) > 0)
                .sort((a, b) => (moodTally.get(b.id) ?? 0) - (moodTally.get(a.id) ?? 0))
                .map((mood) => {
                  const count = moodTally.get(mood.id) ?? 0;
                  return (
                    <li key={mood.id} className="flex items-center gap-3">
                      <span aria-hidden className="w-6 text-center text-lg">
                        {mood.emoji}
                      </span>
                      <span className="w-10 shrink-0 text-[13px] text-ink-muted">{mood.label}</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${(count / moodTotal) * 100}%`,
                            backgroundColor: mood.color,
                          }}
                        />
                      </span>
                      <span className="w-10 text-right text-[13px] tabular-nums text-ink-muted">
                        {count} 次
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>

        <Card className="px-4 py-4 sm:px-5">
          <SectionHeading title="區間完成率" description={`${rangeLabel}的累計數字`} />
          {progress.length === 0 ? (
            <p className="mt-4 text-[13px] text-ink-muted">這段期間沒有排定的定期事項。</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {progress
                .sort((a, b) => b.rate - a.rate)
                .map(({ routine, due, done, rate }) => (
                  <li key={routine.id} className="flex items-center gap-3">
                    <span aria-hidden className="w-6 text-center text-base">
                      {routine.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{routine.title}</span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-muted">
                        <span
                          className="block h-full rounded-full bg-accent"
                          style={{ width: `${Math.round(rate * 100)}%` }}
                        />
                      </span>
                    </span>
                    <span className="w-20 text-right text-[13px] tabular-nums text-ink-muted">
                      {done}/{due}・{Math.round(rate * 100)}%
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      <section className="space-y-3">
        <SectionHeading title="最近的紀錄" description="點一下可以回到那一天繼續寫。" />
        <ul className="space-y-2.5">
          {recent.map((date) => (
            <li key={date}>
              <EntryRow entry={state.entries[date]} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PageTitle() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">回顧</h1>
      <p className="text-sm text-ink-muted">看看這段時間留下了什麼。</p>
    </header>
  );
}

function EntryRow({ entry }: { entry: DayEntry }) {
  const mood = MOODS.find((item) => item.id === entry.mood);
  const filled = entry.blocks.filter((block) => !isBlockEmpty(block));
  const summary = filled.map(summarizeBlock).join("　") || "（只記錄了心情與目標）";
  const relative = formatRelativeDay(entry.date);

  return (
    <Link
      href={`/entry/${entry.date}`}
      className="card flex gap-3.5 px-4 py-3.5 transition-colors hover:border-line-strong hover:bg-surface-muted/50"
    >
      <span aria-hidden className="mt-0.5 w-7 shrink-0 text-center text-2xl">
        {mood?.emoji ?? "•"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">{formatFullDate(entry.date)}</span>
          {relative ? <Chip>{relative}</Chip> : null}
          {filled.map((block) => (
            <Chip key={block.id} tone="brand">
              {getTemplate(block.template).name}
            </Chip>
          ))}
        </span>
        <span className="mt-1 block truncate text-[13px] text-ink-muted">{summary}</span>
      </span>
    </Link>
  );
}
