"use client";

import { useState, type ReactNode } from "react";

import { ChevronDownIcon } from "@/components/icons";

import { cn } from "./cn";

/**
 * 可收合的區塊標題。
 *
 * 收合狀態刻意不寫進 localStorage：它是「現在想不想看這一段」的即時操作，
 * 不是使用者設定，換一天重新展開才符合每天從頭寫的節奏。
 */
export function CollapsibleSection({
  title,
  meta,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  /** 標題右側的補充資訊，例如完成度。 */
  meta?: ReactNode;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="group flex min-h-9 items-center gap-1.5 text-left"
        >
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-ink-subtle transition-transform group-hover:text-ink-muted",
              !open && "-rotate-90",
            )}
            strokeWidth={2.2}
          />
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </button>
        {meta}
      </div>

      {open ? (
        <>
          {description ? <p className="px-1 text-[13px] text-ink-muted">{description}</p> : null}
          {children}
        </>
      ) : null}
    </section>
  );
}
