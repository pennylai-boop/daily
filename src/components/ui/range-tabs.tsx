"use client";

import { cn } from "./cn";

export interface RangeOption<T extends string> {
  id: T;
  label: string;
}

export function RangeTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly RangeOption<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="no-scrollbar flex flex-nowrap gap-1 overflow-x-auto border-b border-line"
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3.5 py-2 text-[13px] font-medium transition-colors",
              selected
                ? "border-accent text-accent"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
