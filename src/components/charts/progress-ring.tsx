import { cn } from "@/components/ui/cn";

/**
 * 完成度的環狀百分比。自繪 SVG，和折線圖一樣不引入圖表套件。
 *
 * `due` 為 0 代表這段期間沒有排定事項，會顯示「—」而不是 0%，
 * 這兩件事在使用者眼中完全不同。
 */
export function ProgressRing({
  label,
  done,
  due,
  size = 72,
  className,
}: {
  label: string;
  done: number;
  due: number;
  size?: number;
  className?: string;
}) {
  const rate = due === 0 ? 0 : done / due;
  const stroke = Math.max(5, Math.round(size * 0.1));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--line)"
            strokeWidth={stroke}
          />
          {/* 0% 不畫弧線：strokeLinecap="round" 會在起點留一顆圓點，看起來像已經做了一點。 */}
          {done > 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${circumference * rate} ${circumference}`}
              // 從十二點鐘方向開始順時針填。
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-[stroke-dasharray]"
            />
          ) : null}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-ink">
          {due === 0 ? "—" : `${Math.round(rate * 100)}%`}
        </span>
      </div>
      <p className="text-center text-[13px] font-medium text-ink">{label}</p>
      <p className="text-center text-xs tabular-nums text-ink-subtle">
        {due === 0 ? "沒有排定" : `${done} / ${due} 項`}
      </p>
    </div>
  );
}
