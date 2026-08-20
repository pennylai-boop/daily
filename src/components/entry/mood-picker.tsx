"use client";

import { useEffect, useRef, useState } from "react";

import { CloseIcon } from "@/components/icons";
import { cn } from "@/components/ui/cn";
import { moodOptions, type MoodOption } from "@/lib/moods";
import { useDailyStore } from "@/lib/store";
import type { MoodId } from "@/lib/types";

/** 心情的圖樣：自訂心情可能是上傳的小圖，其餘是 emoji。 */
export function MoodGlyph({
  mood,
  className,
  size = 24,
}: {
  mood: MoodOption;
  className?: string;
  size?: number;
}) {
  if (mood.image) {
    return (
      // 自訂心情是使用者上傳的 data URL，next/image 沒有可優化的空間。
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mood.image}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span aria-hidden className={cn("leading-none", className)} style={{ fontSize: size }}>
      {mood.emoji}
    </span>
  );
}

export function MoodPicker({
  value,
  onChange,
  size = "md",
  allowClear = true,
}: {
  value: MoodId | null;
  onChange: (mood: MoodId | null) => void;
  size?: "sm" | "md";
  /** 再點一次已選的心情就取消。日曆側欄需要，紀錄頁有預設心情所以不需要。 */
  allowClear?: boolean;
}) {
  const { state, removeCustomMood } = useDailyStore();
  const options = moodOptions(state.customMoods);

  return (
    <div role="radiogroup" aria-label="心情" className="flex flex-wrap gap-1.5 sm:gap-2">
      {options.map((mood) => {
        const selected = value === mood.id;
        return (
          <div key={mood.id} className="relative">
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              title={mood.label}
              onClick={() => onChange(selected && allowClear ? null : mood.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border transition-all",
                size === "sm" ? "w-11 px-1 py-1.5" : "w-13 px-1.5 py-2",
                selected
                  ? "border-accent bg-surface-muted ring-2 ring-line"
                  : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted",
              )}
            >
              <MoodGlyph mood={mood} size={size === "sm" ? 20 : 24} />
              <span
                className={cn(
                  "max-w-full truncate text-[11px]",
                  selected ? "font-medium text-accent" : "text-ink-muted",
                )}
              >
                {mood.label}
              </span>
            </button>

            {mood.custom ? (
              <button
                type="button"
                aria-label={`刪除自訂心情 ${mood.label}`}
                onClick={() => {
                  if (!window.confirm(`刪除「${mood.label}」？用過它的日子會變成沒有心情。`)) {
                    return;
                  }
                  removeCustomMood(mood.id);
                }}
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border border-line bg-surface text-ink-subtle shadow-sm transition-colors hover:text-alert"
              >
                <CloseIcon className="size-3" strokeWidth={2.4} />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 紀錄頁用的心情欄位：平常只是日期旁邊的一顆按鈕，點開才展開選擇器。
 * 沒有選過心情時顯示預設心情，看起來就像那天本來就是這個心情。
 */
export function MoodField({
  value,
  fallback,
  onChange,
}: {
  value: MoodId | null;
  fallback: MoodOption;
  onChange: (mood: MoodId) => void;
}) {
  const { state } = useDailyStore();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const options = moodOptions(state.customMoods);
  const current = options.find((mood) => mood.id === value) ?? fallback;

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
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`心情：${current.label}，點選可更換`}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1.5 transition-colors",
          open
            ? "border-accent bg-accent-tint"
            : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted",
        )}
      >
        <MoodGlyph mood={current} size={22} />
        <span className={cn("text-[13px] font-medium", open ? "text-accent" : "text-ink")}>
          {current.label}
        </span>
      </button>

      {open ? (
        <>
          {/* 手機上改成從底部升起：面板貼齊螢幕邊界，不會因為按鈕靠右而被切掉。 */}
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            // 底部導覽也是 z-40 且在 DOM 後面，遮罩要更高才蓋得住。
            className="fixed inset-0 z-[45] bg-ink/25 sm:hidden"
          />
          <div
            className={cn(
              // 手機的底部導覽是 64px 高的 fixed 元素，面板往上讓開才不會蓋掉一半。
              "fixed inset-x-3 bottom-[calc(66px+env(safe-area-inset-bottom)+12px)] z-50",
              "sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:bottom-auto sm:mt-2 sm:w-84",
            )}
          >
            <div className="card space-y-3 px-3.5 py-3.5 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] text-ink-muted">選一個心情，它會出現在日曆上。</p>
                <button
                  type="button"
                  aria-label="關閉"
                  onClick={() => setOpen(false)}
                  className="-mr-1 flex size-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink sm:hidden"
                >
                  <CloseIcon className="size-4" />
                </button>
              </div>
              <MoodPicker
                value={value}
                allowClear={false}
                onChange={(mood) => {
                  if (!mood) return;
                  onChange(mood);
                  setOpen(false);
                }}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
