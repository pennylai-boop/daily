"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { InfoIcon } from "@/components/icons";
import { cn } from "./cn";

/**
 * 標題旁邊的小 i。點一下才展開說明，把只需要看一次的長段文字從版面上收起來。
 *
 * 手機上是浮在底部導覽上方的小卡，桌機才是圖示下方的浮層（和心情選擇器同一套做法）：
 * 浮層以圖示為中心定位的話，圖示靠螢幕邊緣時會被切掉。
 */
export function InfoHint({
  label = "說明",
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={wrapperRef} className={cn("relative inline-flex shrink-0 align-middle", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={cn(
          "flex size-6 items-center justify-center rounded-full transition-colors",
          open ? "bg-surface-muted text-ink" : "text-ink-subtle hover:bg-surface-muted hover:text-ink",
        )}
      >
        <InfoIcon className="size-4" />
      </button>

      {open ? (
        <>
          <span
            aria-hidden
            onClick={() => setOpen(false)}
            // 底部導覽是 z-40 且在 DOM 後面，遮罩要更高才蓋得住。
            className="fixed inset-0 z-[45] bg-ink/25 sm:hidden"
          />
          <span
            role="tooltip"
            className={cn(
              "fixed inset-x-3 bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] z-50 block",
              "sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:bottom-auto sm:mt-2 sm:w-80",
            )}
          >
            <span className="card block px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted shadow-lg">
              {children}
            </span>
          </span>
        </>
      ) : null}
    </span>
  );
}
