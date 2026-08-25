"use client";

import { useEffect, useState } from "react";

import { BlockReader } from "@/components/entry/block-reader";
import { MoodGlyph } from "@/components/entry/mood-picker";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/components/ui/cn";
import { Card, Chip, EmptyState, PageHeading, SectionHeading, TextLink } from "@/components/ui/surfaces";
import { formatFullDate, formatRelativeDay } from "@/lib/date";
import { findMood } from "@/lib/moods";
import { hasContent } from "@/lib/stats";
import { refreshSharedJournals, useDailyStore } from "@/lib/store";
import { isBlockEmpty } from "@/lib/templates";
import type { DayEntry, SharedJournal } from "@/lib/types";

export function SharedScreen() {
  const { state, ready } = useDailyStore();
  const lineUserId = state.settings.profile.lineUserId;

  // 對方可能在別的裝置剛接受邀請、或紀錄剛更新，進頁面時跟雲端拿最新的一份。
  useEffect(() => {
    if (lineUserId) void refreshSharedJournals();
  }, [lineUserId]);

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-8 w-40 rounded-lg bg-paper-tint" />
        <div className="h-40 rounded-xl bg-paper-tint" />
      </div>
    );
  }

  const journals = state.sharedWithMe;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeading
        title="被分享紀錄"
        description="你在 LINE 上收到邀請並按下接受之後，對方的紀錄就會出現在這裡。"
      />

      {journals.length === 0 ? (
        <Card>
          <EmptyState
            emoji="📬"
            title="還沒有人分享紀錄給你"
            description="請對方在「設定 → 分享給誰看」用 LINE 送出邀請，你點開連結接受之後內容就會出現在這裡。"
            action={<TextLink href="/settings">前往設定 →</TextLink>}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {journals.map((journal) => (
            <JournalSection key={journal.id} journal={journal} />
          ))}
        </div>
      )}
    </div>
  );
}

function JournalSection({ journal }: { journal: SharedJournal }) {
  const entries = [...journal.entries].filter(hasContent).sort((a, b) => b.date.localeCompare(a.date));
  const [expanded, setExpanded] = useState<string | null>(entries[0]?.date ?? null);

  return (
    <section className="space-y-3">
      <div className="card flex flex-wrap items-center gap-3 px-4 py-3.5">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xl"
        >
          {journal.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold text-ink">{journal.ownerName}</h2>
            <Chip tone={journal.scope === "full" ? "brand" : "neutral"}>
              {journal.scope === "full" ? "分享完整內容" : "只分享心情"}
            </Chip>
          </div>
          <p className="mt-0.5 truncate text-[13px] text-ink-muted">透過 LINE 分享給你</p>
        </div>
        <span className="text-[13px] tabular-nums text-ink-subtle">{entries.length} 天</span>
      </div>

      {entries.length === 0 ? (
        <p className="px-1 text-[13px] text-ink-muted">對方目前還沒有可以查看的紀錄。</p>
      ) : (
        <ul className="space-y-2.5">
          {entries.map((entry) => (
            <li key={entry.date}>
              <SharedEntryCard
                entry={entry}
                scope={journal.scope}
                open={expanded === entry.date}
                onToggle={() => setExpanded(expanded === entry.date ? null : entry.date)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SharedEntryCard({
  entry,
  scope,
  open,
  onToggle,
}: {
  entry: DayEntry;
  scope: SharedJournal["scope"];
  open: boolean;
  onToggle: () => void;
}) {
  // 對方的自訂心情不會跟著紀錄傳過來，解不到時就只顯示圓點。
  const mood = findMood(entry.mood);
  const blocks = entry.blocks.filter((block) => !isBlockEmpty(block));
  const relative = formatRelativeDay(entry.date);
  const doneFocus = entry.focus.filter((item) => item.done).length;

  return (
    <div className={cn("card overflow-hidden", open && "border-line-strong")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-surface-muted/50"
      >
        <span aria-hidden className="flex w-7 shrink-0 justify-center text-2xl">
          {mood ? <MoodGlyph mood={mood} size={26} /> : "•"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-ink">{formatFullDate(entry.date)}</span>
            {relative ? <Chip>{relative}</Chip> : null}
            {mood ? <span className="text-[13px] text-ink-muted">{mood.label}</span> : null}
          </span>
          <span className="mt-0.5 block text-xs text-ink-subtle">
            {scope === "full"
              ? `${blocks.length} 段書寫${entry.focus.length > 0 ? `・目標 ${doneFocus}/${entry.focus.length}` : ""}`
              : "對方只分享心情"}
          </span>
        </span>
      </button>

      {open ? (
        <div className="space-y-5 border-t border-line px-4 py-4">
          {scope === "mood" ? (
            <p className="text-[13px] text-ink-muted">
              對方只分享了心情，書寫的內容不會顯示。
            </p>
          ) : (
            <>
              {entry.focus.length > 0 ? (
                <section className="space-y-2">
                  <SectionHeading title="當日目標" />
                  <ul className="space-y-1.5">
                    {entry.focus.map((item) => (
                      <li key={item.id} className="flex items-center gap-2 text-sm">
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-4.5 shrink-0 items-center justify-center rounded border",
                            item.done
                              ? "border-accent bg-accent text-on-accent"
                              : "border-line-strong bg-surface",
                          )}
                        >
                          {item.done ? <CheckIcon className="size-3" strokeWidth={3} /> : null}
                        </span>
                        <span className={item.done ? "text-ink-subtle line-through" : "text-ink"}>
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {blocks.length > 0 ? (
                blocks.map((block) => <BlockReader key={block.id} block={block} />)
              ) : (
                <p className="text-[13px] text-ink-muted">這天只記錄了心情與目標。</p>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
