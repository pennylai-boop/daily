"use client";

import { useState } from "react";

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
  metricSeries,
  moodSeries,
  RANGE_OPTIONS,
  routineRateSeries,
  timerMinutesSeries,
  focusMinutesSeries,
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
  const hasFocus = (state.focus?.sessions.length ?? 0) > 0;

  if (dates.length === 0 && !hasRoutines && !hasGoals && !hasFocus) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeading title="回顧" description="看看這段時間留下了什麼。" />
        <Card>
          <EmptyState
            emoji="📈"
            title="還沒有可以回顧的內容"
            description="寫下第一篇紀錄或設定定期事項後，這裡會出現完成率與心情趨勢。"
            action={<TextLink href={`/entry/${today}`}>開始記錄今天 →</TextLink>}
          />
        </Card>
      </div>
    );
  }

  const window = buildRangeWindow(state, range);
  const activeRoutines = state.routines.filter((routine) => !routine.archived);
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

      <RangeTabs
        options={RANGE_OPTIONS}
        value={range}
        onChange={setRange}
        ariaLabel="統計區間"
      />

      <Card className="px-4 py-4 sm:px-5">
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

      <PeriodGoalsStatus state={state} today={today} />

      {hasFocus ? (
        <Card className="px-4 py-4 sm:px-5">
          <SectionHeading title="專心模式" description={`${rangeLabel}的工作時長（分鐘）`} />
          <div className="mt-4">
            <LineChart
              labels={window.buckets.map((bucket) => bucket.label)}
              series={focusMinutesSeries(state, window.buckets)}
              formatValue={(value) => `${Math.round(value * 10) / 10} 分`}
              emptyHint="這段期間還沒有專心紀錄。"
            />
          </div>
        </Card>
      ) : null}

      {activeRoutines
        .filter((routine) => routine.template === "timer")
        .map((routine) => (
          <Card key={routine.id} className="px-4 py-4 sm:px-5">
            <SectionHeading
              title={`${routine.emoji} ${routine.title}`}
              description={`${rangeLabel}的計時分鐘`}
            />
            <div className="mt-4">
              <LineChart
                labels={window.buckets.map((bucket) => bucket.label)}
                series={timerMinutesSeries(state, window.buckets, routine)}
                formatValue={(value) => `${Math.round(value * 10) / 10} 分`}
                emptyHint="這段期間還沒有計時紀錄。"
              />
            </div>
          </Card>
        ))}

      {activeRoutines
        .filter((routine) => routine.template === "metric")
        .map((routine) => {
          const series = metricSeries(state, window.buckets, routine);
          return (
            <Card key={routine.id} className="px-4 py-4 sm:px-5">
              <SectionHeading
                title={`${routine.emoji} ${routine.title}`}
                description={`${rangeLabel}的數值變化`}
              />
              <div className="mt-4">
                <LineChart
                  labels={window.buckets.map((bucket) => bucket.label)}
                  series={series}
                  formatValue={(value) => String(Math.round(value * 100) / 100)}
                  emptyHint="這段期間還沒有填寫紀錄。"
                />
              </div>
            </Card>
          );
        })}

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
