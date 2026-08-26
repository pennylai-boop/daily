"use client";

import Link from "next/link";

import { HexagramIcon } from "@/components/icons";
import { cn } from "@/components/ui/cn";
import type { DivinationState } from "@/lib/types";

/**
 * 剩餘的卜卦點數，常駐在手機版右上角與桌機側欄。
 *
 * 只在使用者跟卜卦有過關係時才出現（綁過兌換碼、有點數，或卜過卦）：
 * 從來不用卜卦的人不需要在每一頁看到一個點數餘額。
 */
export function PointsBadge({
  divination,
  className,
}: {
  divination: DivinationState;
  className?: string;
}) {
  const engaged =
    divination.creditCode !== null || divination.credits > 0 || divination.history.length > 0;
  if (!engaged) return null;

  return (
    <Link
      href="/divination/credits"
      aria-label={`剩餘卜卦點數 ${divination.credits} 點，前往儲值`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold tabular-nums text-brand-strong transition-opacity hover:opacity-80",
        className,
      )}
    >
      <HexagramIcon className="size-3.5" strokeWidth={2} />
      {divination.credits} 點
    </Link>
  );
}
