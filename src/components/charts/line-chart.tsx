"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";

export interface ChartSeries {
  id: string;
  label: string;
  color: string;
  /** 與 labels 等長；null 代表該區間沒有資料，折線會在此斷開。 */
  values: (number | null)[];
}

const PAD_TOP = 12;

/**
 * 以容器的實際像素寬度當作 viewBox 寬度，讓 1 個 SVG 單位等於 1 CSS px。
 * 若固定 viewBox 寬度再縮放，手機上的座標軸文字會被壓到 5、6px 而無法閱讀。
 */
function useMeasuredWidth(fallback: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

export function LineChart({
  labels,
  series,
  height,
  yMin = 0,
  yMax,
  yTicks = 4,
  formatValue = (value) => `${Math.round(value)}`,
  emptyHint = "這段期間還沒有資料。",
}: {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  yMin?: number;
  yMax?: number;
  yTicks?: number;
  formatValue?: (value: number) => string;
  emptyHint?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { ref, width } = useMeasuredWidth(640);

  const compact = width < 420;
  const chartHeight = height ?? (compact ? 196 : 232);
  const padLeft = compact ? 34 : 44;
  const padRight = compact ? 10 : 14;
  const padBottom = compact ? 24 : 28;
  const axisSize = compact ? 10 : 11;

  const allValues = series.flatMap((item) =>
    item.values.filter((value): value is number => value !== null),
  );
  const hasData = allValues.length > 0;

  const bottom = Math.min(yMin, hasData ? Math.min(...allValues) : 0);
  const top = yMax ?? niceTop(hasData ? Math.max(...allValues) - bottom : 1, yTicks) + bottom;
  const span = top - bottom || 1;

  const plotWidth = Math.max(1, width - padLeft - padRight);
  const plotHeight = chartHeight - PAD_TOP - padBottom;
  const step = labels.length > 1 ? plotWidth / (labels.length - 1) : 0;

  const xAt = (index: number) =>
    labels.length > 1 ? padLeft + index * step : padLeft + plotWidth / 2;
  const yAt = (value: number) => PAD_TOP + plotHeight * (1 - (value - bottom) / span);

  const ticks = Array.from(
    { length: yTicks + 1 },
    (_, index) => bottom + (span / yTicks) * index,
  );

  // 依可用寬度決定要放幾個 x 軸標籤，每個標籤大約需要 40–46px。
  const maxLabels = Math.max(2, Math.floor(plotWidth / (compact ? 40 : 46)));
  const labelStride = Math.max(1, Math.ceil(labels.length / maxLabels));

  return (
    <div className="space-y-3" ref={ref}>
      <ul className="flex flex-wrap gap-x-3.5 gap-y-1.5">
        {series.map((item) => (
          <li key={item.id} className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span
              aria-hidden
              className="h-0.5 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </li>
        ))}
      </ul>

      {hasData ? (
        <div
          className="relative"
          onPointerLeave={() => setHovered(null)}
          onPointerCancel={() => setHovered(null)}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) * width;
            const index = Math.round((x - padLeft) / (step || plotWidth));
            setHovered(Math.min(labels.length - 1, Math.max(0, index)));
          }}
        >
          <svg
            viewBox={`0 0 ${width} ${chartHeight}`}
            width={width}
            height={chartHeight}
            className="h-auto w-full touch-pan-y select-none"
            role="img"
            aria-label={`折線圖，包含 ${series.map((item) => item.label).join("、")}`}
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                  stroke="var(--line)"
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 6}
                  y={yAt(tick) + 3.5}
                  textAnchor="end"
                  fontSize={axisSize}
                  className="fill-[var(--ink-subtle)] tabular-nums"
                >
                  {formatValue(tick)}
                </text>
              </g>
            ))}

            {labels.map((label, index) =>
              index % labelStride === 0 || index === labels.length - 1 ? (
                <text
                  key={`${label}-${index}`}
                  x={clamp(xAt(index), padLeft, width - padRight)}
                  y={chartHeight - 8}
                  textAnchor={
                    index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"
                  }
                  fontSize={axisSize}
                  className="fill-[var(--ink-subtle)] tabular-nums"
                >
                  {label}
                </text>
              ) : null,
            )}

            {hovered !== null ? (
              <line
                x1={xAt(hovered)}
                x2={xAt(hovered)}
                y1={PAD_TOP}
                y2={PAD_TOP + plotHeight}
                stroke="var(--line-strong)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            ) : null}

            {series.map((item) => (
              <g key={item.id}>
                {buildSegments(item.values).map((segment, index) => (
                  <polyline
                    key={index}
                    points={segment.map(({ i, v }) => `${xAt(i)},${yAt(v)}`).join(" ")}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {item.values.map((value, index) =>
                  value === null ? null : step >= 12 || index === hovered ? (
                    <circle
                      key={index}
                      cx={xAt(index)}
                      cy={yAt(value)}
                      r={index === hovered ? 4 : 2.5}
                      fill={item.color}
                    />
                  ) : null,
                )}
              </g>
            ))}
          </svg>

          {hovered !== null ? (
            <Tooltip
              label={labels[hovered]}
              index={hovered}
              series={series}
              formatValue={formatValue}
              leftPercent={(xAt(hovered) / width) * 100}
            />
          ) : null}
        </div>
      ) : (
        <p className="py-10 text-center text-[13px] text-ink-muted">{emptyHint}</p>
      )}
    </div>
  );
}

function Tooltip({
  label,
  index,
  series,
  formatValue,
  leftPercent,
}: {
  label: string;
  index: number;
  series: ChartSeries[];
  formatValue: (value: number) => string;
  leftPercent: number;
}) {
  const rows = series.filter((item) => item.values[index] !== null);
  if (rows.length === 0) return null;

  const alignRight = leftPercent > 55;

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-1 z-10 min-w-24 max-w-[min(15rem,70%)] rounded-xl border border-line bg-surface px-3 py-2 shadow-card",
        alignRight ? "-translate-x-full" : "",
      )}
      style={{ left: `${clamp(leftPercent, 2, 98)}%` }}
    >
      <p className="text-[11px] font-medium text-ink-muted">{label}</p>
      <ul className="mt-1 space-y-0.5">
        {rows.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-[11px]">
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate text-ink-muted">{item.label}</span>
            <span className="ml-auto shrink-0 font-medium tabular-nums text-ink">
              {formatValue(item.values[index] as number)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 把含 null 的資料切成多段連續折線。 */
function buildSegments(values: (number | null)[]): { i: number; v: number }[][] {
  const segments: { i: number; v: number }[][] = [];
  let current: { i: number; v: number }[] = [];

  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) segments.push(current);
      current = [];
      return;
    }
    current.push({ i: index, v: value });
  });
  if (current.length > 0) segments.push(current);

  return segments.filter((segment) => segment.length > 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 找一個能被刻度數整除的上限，讓 y 軸出現 0/20/40 這類好讀的數字。 */
function niceTop(range: number, ticks: number): number {
  if (range <= 0) return ticks;
  const rough = range / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((value) => value >= rough) ??
    10 * magnitude;
  return step * ticks;
}

/** 折線色票依 docs/UI_design_system2.md §1.2：橘、藍在前，其餘為灰與藍紫階。 */
export const SERIES_COLORS = [
  "#e86e2c",
  "#262f8b",
  "#6b7280",
  "#4a5499",
  "#ca8a04",
  "#b44716",
  "#8a96b8",
  "#9ca3af",
];
