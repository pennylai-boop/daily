"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import {
  BEST_VALUE_PACK_ID,
  CREDIT_PACKS,
  formatPricePerCredit,
  type CreditPack,
} from "@/lib/divination-credits";
import { getMethod, type SponsorMethod } from "@/lib/support";

/**
 * 五檔儲值方案。儲值頁和卜卦頁（免費額度用完時）共用同一份排版，
 * 免得兩邊的價格或「最划算」標記走鐘。
 */
export function CreditPackGrid({
  method = "credit",
  disabled = false,
  pendingPackId,
  onBuy,
  className,
}: {
  method?: SponsorMethod;
  disabled?: boolean;
  pendingPackId?: string | null;
  onBuy: (pack: CreditPack) => void;
  className?: string;
}) {
  const limits = getMethod(method);

  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", className)}>
      {CREDIT_PACKS.map((pack) => (
        <PackCard
          key={pack.id}
          pack={pack}
          best={pack.id === BEST_VALUE_PACK_ID}
          outOfRange={pack.amount < limits.min || pack.amount > limits.max}
          methodLabel={limits.label}
          disabled={disabled || (pendingPackId ?? null) !== null}
          pending={pendingPackId === pack.id}
          onBuy={() => onBuy(pack)}
        />
      ))}
    </ul>
  );
}

function PackCard({
  pack,
  best,
  outOfRange,
  methodLabel,
  disabled,
  pending,
  onBuy,
}: {
  pack: CreditPack;
  best: boolean;
  outOfRange: boolean;
  methodLabel: string;
  disabled: boolean;
  pending: boolean;
  onBuy: () => void;
}) {
  return (
    <li
      className={cn(
        "flex flex-col rounded-xl border px-3.5 py-3.5",
        best ? "border-brand bg-brand-tint/30" : "border-line-strong",
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-sm font-semibold text-ink">{pack.label}</p>
        {best ? (
          <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-on-brand">
            最划算
          </span>
        ) : null}
      </div>

      <p className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums text-ink">
          {pack.amount.toLocaleString("zh-TW")}
        </span>
        <span className="text-[13px] text-ink-muted">元</span>
      </p>
      <p className="text-[13px] tabular-nums text-ink-muted">
        {pack.credits.toLocaleString("zh-TW")} 點
      </p>
      <p className="text-[12px] tabular-nums text-ink-subtle">約 {formatPricePerCredit(pack)} 元/點</p>

      <div className="mt-3.5">
        {outOfRange ? (
          <p className="text-[12px] leading-relaxed text-ink-subtle">
            這個金額不能用{methodLabel}，請改用信用卡。
          </p>
        ) : (
          <Button
            variant={best ? "primary" : "outline"}
            className="w-full"
            disabled={disabled}
            onClick={onBuy}
          >
            {pending ? "前往付款…" : "立即付款"}
          </Button>
        )}
      </div>
    </li>
  );
}
