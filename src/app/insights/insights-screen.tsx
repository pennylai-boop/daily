"use client";

import { useState } from "react";

import { HabitHeatmaps } from "@/components/insights/habit-heatmaps";
import { PeriodGoalsStatus } from "@/components/insights/period-goals-status";
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
  type RangeId,
} from "@/lib/series";
import {
  currentStreak,
  longestStreak,
  recordedDates,
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
  const hasRoutines = state.routines.some((routine) => !routine.archived);
  const hasGoals =
    (state.entries[today]?.focus.length ?? 0) > 0 ||
    Object.values(state.weekGoals).some((items) => items.length > 0) ||
    Object.values(state.monthGoals).some((items) => items.length > 0);

  if (dates.length === 0 && !hasRoutines && !hasGoals) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeading title="回顧" description="看看這段時間留下了什麼。" />
        <Card>
          <EmptyState
            emoji="📈"
            title="還沒有可以回顧的內容"
            description="寫下第一篇紀錄或設定定期事項後，這裡會出現完成格線與心情趨勢。"
            action={<TextLink href={`/entry/${today}`}>開始記錄今天 →</TextLink>}
          />
        </Card>
      </div>
    );
  }

  const window = buildRangeWindow(state, range);
  const rangeLabel = RANGE_OPTIONS.find((option) => option.id === range)?.label ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeading title="回顧" description="看看這段時間留下了什麼。" />

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <StatTile label="目前連續" value={currentStreak(state, today)} unit="天" />
        <StatTile label="最長連續" value={longestStreak(state)} unit="天" />
        <StatTile label="累積記錄" value={dates.length} unit="天" />
        <StatTile label="書寫段落" value={totalWrittenBlocks(state)} unit="段" />
      </div>

      <HabitHeatmaps state={state} today={today} />

      <PeriodGoalsStatus state={state} today={today} />

      <Card className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeading
            title="心情趨勢"
            description={`${rangeLabel}的心情平均分數，5 分最愉快`}
          />
          <RangeTabs
            options={RANGE_OPTIONS}
            value={range}
            onChange={setRange}
            ariaLabel="心情統計區間"
          />
        </div>
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
