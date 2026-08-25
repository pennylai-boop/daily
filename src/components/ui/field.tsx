"use client";

import type { ComponentProps, ReactNode } from "react";

import { InfoHint } from "./info-hint";
import { cn } from "./cn";

// 手機一律 16px：iOS Safari 遇到小於 16px 的輸入框，對焦時會自動放大整個頁面。
const CONTROL_BASE =
  "w-full bg-surface text-ink placeholder:text-ink-subtle border border-line-strong rounded-lg " +
  "px-3 py-2.5 text-base sm:text-sm transition-colors hover:border-ink-subtle " +
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL_BASE, className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL_BASE, "prose-zh resize-y", className)} {...props} />;
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex min-w-0 items-center gap-1">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-muted">
          {label}
        </label>
        {hint ? <InfoHint label={`${label}的說明`}>{hint}</InfoHint> : null}
      </div>
      {children}
    </div>
  );
}
