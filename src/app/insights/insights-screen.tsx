"use client";

import { useState } from "react";

import { LineChart } from "@/components/charts/line-chart";
import { RangeTabs } from "@/components/ui/range-tabs";
import {
  Card,
  EmptyState,
  PageHeading,
  SectionHeading,
  StatTile,
  TextLink,
} from "@/components/ui/surfaces";
import { todayIso } from "@/lib/date";
import {
  buildRangeWindow,
  moodSeries,
  RANGE_OPTIONS,
  routineRateSeries,
  type RangeId,
} from "@/lib/series";
import {
  currentStreak,
  longestStreak,
  recordedDates,
  routineProgress,
  totalWrittenBlocks,
} from "@/lib/stats";
import { useDailyStore } from "@/lib/store";

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
        <PageHeading title="回顧" description="看看這段時間留下了什麼。" />
        <Card>
          <EmptyState
            emoji="📈"
            title="還沒有可以回顧的內容"
            description="寫下第一篇紀錄之後，這裡會出現心情趨勢與定期事項完成率的比較圖表。"
            action={<TextLink href={`/entry/${today}`}>開始記錄今天 →</TextLink>}
          />
        </Card>
      </div>
    );
  }

  const window = buildRangeWindow(state, range);
  const activeRoutines = state.routines.filter((routine) => !routine.archived);
  const progress = routineProgress(state, window.from, window.to).filter((item) => item.due > 0);
  const rangeLabel = RANGE_OPTIONS.find((option) => option.id === range)?.label ?? "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeading title="回顧" description="看看這段時間留下了什麼。" />

      {/* 四張並列，手機也不折成 2×2：這四個數字是一組，一眼掃完比排得漂亮重要。 */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
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

        <Card className="px-4 py-4 sm:px-5 lg:col-span-2">
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
    </div>
  );
}
