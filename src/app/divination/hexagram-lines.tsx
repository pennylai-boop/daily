"use client";

import { cn } from "@/components/ui/cn";
import { HEXAGRAM_LINE_COUNT } from "@/lib/hexagram";

/** 六爻由下到上算，畫的時候要反過來：初爻在最下面一列。 */
const TOP_DOWN_POSITIONS = Array.from({ length: HEXAGRAM_LINE_COUNT }, (_, i) => HEXAGRAM_LINE_COUNT - 1 - i);

export function HexagramLines({
  lines,
  movingLine,
  revealed = HEXAGRAM_LINE_COUNT,
  className,
}: {
  lines: readonly number[];
  /** 第幾爻是動爻（1～6）；不給就不標。 */
  movingLine?: number;
  /** 已經畫出來的爻數，用在起卦時一爻一爻浮出來。 */
  revealed?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("flex flex-col gap-1.5", className)}>
      {TOP_DOWN_POSITIONS.map((position) => {
        const yang = lines[position] === 1;
        const moving = movingLine === position + 1;
        const visible = position < revealed;
        const bar = cn("h-full rounded-sm transition-colors", moving ? "bg-brand" : "bg-ink");

        return (
          <div
            key={position}
            className={cn(
              "flex h-2.5 items-center gap-1.5 transition-all duration-300",
              visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
            )}
          >
            {yang ? (
              <span className={cn(bar, "w-full")} />
            ) : (
              <>
                <span className={cn(bar, "flex-1")} />
                <span className={cn(bar, "flex-1")} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 卦象加卦名，結果頁的本卦／變卦都用這個。 */
export function HexagramFigure({
  name,
  caption,
  lines,
  movingLine,
  revealed,
}: {
  name: string;
  caption?: string;
  lines: readonly number[];
  movingLine?: number;
  revealed?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <HexagramLines lines={lines} movingLine={movingLine} revealed={revealed} className="w-28" />
      <div className="text-center">
        <p className="text-sm font-semibold text-ink">{name}</p>
        {caption ? <p className="text-[12px] text-ink-subtle">{caption}</p> : null}
      </div>
    </div>
  );
}
