import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { cn } from "./cn";

// 手機一律 16px：iOS Safari 遇到小於 16px 的輸入框，對焦時會自動放大整個頁面。
const CONTROL_BASE =
  "w-full bg-surface text-ink placeholder:text-ink-subtle border border-line-strong rounded-lg " +
  "px-3 py-2.5 text-base sm:text-sm transition-colors hover:border-ink-subtle " +
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL_BASE, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL_BASE, "prose-zh resize-y", className)} {...props} />;
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-muted">
        {label}
      </label>
      {hint ? <p className="text-[13px] leading-relaxed text-ink-subtle">{hint}</p> : null}
      {children}
    </div>
  );
}
