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
  metricCompareGroups,
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
            description="寫下第一篇紀錄或設定定期事項後，這裡會出現完成率與紀錄比較。"
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
  const groups = useMemo(
    () => metricCompareGroups(state, buckets, routines),
    [state, buckets, routines],
  );
  const [picked, setPicked] = useState<string | null>(null);

  if (groups.length === 0) return null;

  const fallback = `all:${groups[0].routineId}`;
  const choice =
    picked &&
    groups.some(
      (group) =>
        picked === `all:${group.routineId}` ||
        group.series.some((item) => picked === `field:${item.id}`),
    )
      ? picked
      : fallback;
  const visible = seriesForChoice(groups, choice);

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="紀錄比較"
        description={`${rangeLabel}一次看一項。可以選單一欄位（例如體脂），也可以選整份紀錄（例如體重紀錄的所有欄位）。`}
        action={
          <Select
            aria-label="選擇要比較的紀錄"
            className="w-[min(14rem,70vw)] sm:w-56"
            value={choice}
            onChange={(event) => setPicked(event.target.value)}
          >
            {groups.map((group) => (
              <optgroup key={group.routineId} label={group.label}>
                <option value={`all:${group.routineId}`}>{group.label}（全部）</option>
                {group.series.map((item) => (
                  <option key={item.id} value={`field:${item.id}`}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        }
      />
      <div className="mt-4">
        <LineChart
          labels={buckets.map((bucket) => bucket.label)}
          series={visible}
          yScale="fit"
          yTicks={3}
          formatValue={(value) => String(Math.round(value * 100) / 100)}
          emptyHint="這段期間還沒有填寫這項紀錄。"
          showLegend={visible.length > 1}
        />
      </div>
    </Card>
  );
}

function seriesForChoice(
  groups: ReturnType<typeof metricCompareGroups>,
  choice: string,
) {
  if (choice.startsWith("all:")) {
    const routineId = choice.slice(4);
    return groups.find((group) => group.routineId === routineId)?.series ?? [];
  }
  const fieldId = choice.startsWith("field:") ? choice.slice(6) : choice;
  for (const group of groups) {
    const found = group.series.find((item) => item.id === fieldId);
    if (found) return [found];
  }
  return groups[0]?.series ?? [];
}
