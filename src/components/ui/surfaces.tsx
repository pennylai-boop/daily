import Link from "next/link";
import type { ReactNode } from "react";

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

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="text-[13px] text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
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
  return (
    <div className="card px-4 py-3.5">
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight text-ink">{value}</span>
        {unit ? <span className="text-[13px] text-ink-subtle">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  );
}
