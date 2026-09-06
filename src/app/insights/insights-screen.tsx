"use client";

import { useMemo, useState } from "react";

import { PeriodGoalsStatus } from "@/components/insights/period-goals-status";
import { LineChart } from "@/components/charts/line-chart";
import { Select } from "@/components/ui/field";
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
  metricCompareSeries,
  moodSeries,
  RANGE_OPTIONS,
  routineInsightChart,
  timerMinutesSeries,
  focusMinutesSeries,
  type Bucket,
  type RangeId,
} from "@/lib/series";
import type { DailyState, Routine } from "@/lib/types";
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

      {activeRoutines.length > 0 ? (
        <RoutineTrendCard
          state={state}
          buckets={window.buckets}
          routines={activeRoutines}
          rangeLabel={rangeLabel}
        />
      ) : null}

      <MetricCompareCard
        state={state}
        buckets={window.buckets}
        routines={activeRoutines}
        rangeLabel={rangeLabel}
      />

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

function RoutineTrendCard({
  state,
  buckets,
  routines,
  rangeLabel,
}: {
  state: DailyState;
  buckets: Bucket[];
  routines: Routine[];
  rangeLabel: string;
}) {
  const [selectedId, setSelectedId] = useState("rate");
  const chart = routineInsightChart(state, buckets, routines, selectedId, rangeLabel);

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="定期事項趨勢"
        description={chart.description}
        action={
          <Select
            aria-label="選擇要檢視的定期事項"
            className="w-[min(12.5rem,58vw)] sm:w-52"
            value={routines.some((routine) => routine.id === selectedId) || selectedId === "rate" ? selectedId : "rate"}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            <option value="rate">完成率（全部）</option>
            {routines.map((routine) => (
              <option key={routine.id} value={routine.id}>
                {routine.emoji} {routine.title}
              </option>
            ))}
          </Select>
        }
      />
      <div className="mt-4">
        <LineChart
          labels={buckets.map((bucket) => bucket.label)}
          series={chart.series}
          yMin={chart.yMin}
          yMax={chart.yMax}
          yTicks={chart.yTicks}
          formatValue={chart.formatValue}
          emptyHint={chart.emptyHint}
        />
      </div>
    </Card>
  );
}

function MetricCompareCard({
  state,
  buckets,
  routines,
  rangeLabel,
}: {
  state: DailyState;
  buckets: Bucket[];
  routines: Routine[];
  rangeLabel: string;
}) {
  const series = useMemo(
    () => metricCompareSeries(state, buckets, routines),
    [state, buckets, routines],
  );
  const [picked, setPicked] = useState<string[] | null>(null);

  if (series.length === 0) return null;

  const visibleIds = picked ?? series.map((item) => item.id);
  const visible = series.filter((item) => visibleIds.includes(item.id));

  const toggle = (id: string) => {
    const current = picked ?? series.map((item) => item.id);
    setPicked(
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="紀錄比較"
        description={`${rangeLabel}內可同時疊多個數值欄位，方便對照體重、腰圍這類尺寸。`}
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {series.map((item) => {
          const on = visibleIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(item.id)}
              className={
                on
                  ? "inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-tint px-2.5 py-1 text-xs font-medium text-accent"
                  : "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted"
              }
            >
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: on ? item.color : "var(--line-strong)" }}
              />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <LineChart
          labels={buckets.map((bucket) => bucket.label)}
          series={visible}
          formatValue={(value) => String(Math.round(value * 100) / 100)}
          emptyHint="先選一個以上的欄位，或這段期間還沒有填寫紀錄。"
          showLegend={false}
        />
      </div>
    </Card>
  );
}
