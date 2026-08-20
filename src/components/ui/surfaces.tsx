"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { InfoHint } from "./info-hint";
import { cn } from "./cn";

/** 純文字的導向連結。手機上撐開高度，才有足夠的觸控範圍。 */
export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-9 items-center text-[13px] font-medium text-accent underline-offset-4 hover:underline sm:min-h-0",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("card", className)}>{children}</section>;
}

/**
 * 區塊標題。說明文字收進旁邊的小 i，版面只留標題本身。
 * `description` 可以是字串或節點（回顧頁會依區間動態組句）。
 */
export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-1">
        <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <InfoHint label={`${title}的說明`}>{description}</InfoHint> : null}
      </div>
      {action}
    </div>
  );
}

/** 頁面大標，說明同樣收進小 i。 */
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <div className="flex min-w-0 items-center gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <InfoHint label={`${title}的說明`}>{description}</InfoHint> : null}
      </div>
      {action ? <div className="ml-auto shrink-0">{action}</div> : null}
    </header>
  );
}

export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span aria-hidden className="text-4xl">
        {emoji}
      </span>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="max-w-xs text-[13px] leading-relaxed text-ink-muted">{description}</p>
      {action}
    </div>
  );
}

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "accent";
  className?: string;
}) {
  const tones = {
    neutral: "bg-paper text-ink-muted",
    brand: "bg-brand-tint text-brand-strong",
    accent: "bg-accent-tint text-accent",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
}) {
  // 手機上會四張並列，每張只剩 80px 左右，所以留白與字級都先縮一號。
  return (
    <div className="card px-2 py-3 sm:px-4 sm:py-3.5">
      <p className="text-xs whitespace-nowrap text-ink-muted sm:text-[13px]">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{value}</span>
        {unit ? <span className="text-xs text-ink-subtle sm:text-[13px]">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  );
}
