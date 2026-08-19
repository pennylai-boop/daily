"use client";

import { cn } from "@/components/ui/cn";
import { MOODS } from "@/lib/moods";
import type { MoodId } from "@/lib/types";

export function MoodPicker({
  value,
  onChange,
  size = "md",
}: {
  value: MoodId | null;
  onChange: (mood: MoodId | null) => void;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      aria-label="今天的心情"
      className="flex flex-wrap gap-1.5 sm:gap-2"
    >
      {MOODS.map((mood) => {
        const selected = value === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={mood.label}
            onClick={() => onChange(selected ? null : mood.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl border transition-all",
              size === "sm" ? "w-11 px-1 py-1.5" : "w-13 px-1.5 py-2",
              selected
                ? "border-accent bg-surface-muted ring-2 ring-line"
                : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted",
            )}
          >
            <span aria-hidden className={size === "sm" ? "text-xl" : "text-2xl"}>
              {mood.emoji}
            </span>
            <span
              className={cn(
                "text-[11px]",
                selected ? "font-medium text-accent" : "text-ink-muted",
              )}
            >
              {mood.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
