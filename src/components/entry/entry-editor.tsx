"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { BlockEditor } from "@/components/entry/block-editor";
import { FocusList } from "@/components/entry/focus-list";
import { MoodField, MoodGlyph } from "@/components/entry/mood-picker";
import { PhotoStrip } from "@/components/entry/photo-strip";
import { VoiceFill } from "@/components/entry/voice-fill";
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon } from "@/components/icons";
import { RoutineCheckGrid } from "@/components/routines/check-grid";
import { ShareDayDialog } from "@/components/share-day-dialog";
import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { CollapsibleSection } from "@/components/ui/collapsible";
import { Chip } from "@/components/ui/surfaces";
import {
  addDays,
  canDeleteEntry,
  canEditEntry,
  formatFullDate,
  formatRelativeDay,
  formatShortDate,
  todayIso,
} from "@/lib/date";
import { DEFAULT_MOOD, findMood } from "@/lib/moods";
import { routinesDueOn, writableRoutinesNotDue } from "@/lib/routines";
import { prepareDayImage, revokePreparedImage, type PreparedDayImage } from "@/lib/share-image";
import { hasContent } from "@/lib/stats";
import { createId } from "@/lib/storage";
import { createDayEntry, useDailyStore } from "@/lib/store";
import { createEmptyContent, getTemplate, isBlockEmpty } from "@/lib/templates";
import {
  DEFAULT_MOOD_ID,
  type DayEntry,
  type EntryBlock,
  type IsoDate,
  type Routine,
  type TemplateId,
} from "@/lib/types";
import type { VoiceFillResult } from "@/server/entry-fill";

export function EntryScreen({ date }: { date: IsoDate }) {
  const { state, ready } = useDailyStore();

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-9 w-56 rounded-lg bg-paper-tint" />
        <div className="h-32 rounded-xl bg-paper-tint" />
        <div className="h-64 rounded-xl bg-paper-tint" />
      </div>
    );
  }

  return <EntryForm key={date} date={date} initial={state.entries[date] ?? createDayEntry(date)} />;
}

type SaveStatus = "idle" | "saving" | "saved" | "full";

function EntryForm({ date, initial }: { date: IsoDate; initial: DayEntry }) {
  const { state, saveEntry, deleteEntry, toggleRoutineCheck } = useDailyStore();
  const [draft, setDraft] = useState<DayEntry>(initial);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [shareImage, setShareImage] = useState<PreparedDayImage | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [moveNotice, setMoveNotice] = useState<string | null>(null);
  const shareImageRef = useRef<PreparedDayImage | null>(null);
  shareImageRef.current = shareImage;

  const editable = canEditEntry(date);
  const deletable = canDeleteEntry(date);
  const today = todayIso();
  const isToday = date === today;

  const update = (patch: Partial<DayEntry>) => {
    if (!editable) return;
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
    setStatus("saving");
  };

  useEffect(() => {
    if (!dirty || !editable) return;
    const timer = setTimeout(() => {
      const next = { ...draft, updatedAt: new Date().toISOString() };
      // 預設心情只在這天真的有內容時才寫進去，單純點開某一天不會留下紀錄。
      if (!next.mood && hasContent(next)) next.mood = DEFAULT_MOOD_ID;

      if (!hasContent(next) && next.blocks.length === 0) {
        // 舊紀錄不可刪：只有今天可以把清空後的日子從資料裡拿掉。
        if (deletable) deleteEntry(date);
        else saveEntry(next);
        setStatus("saved");
      } else {
        setStatus(saveEntry(next) ? "saved" : "full");
      }
      setDirty(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [dirty, draft, date, editable, deletable, saveEntry, deleteEntry]);

  const checkedIds = state.checks[date] ?? [];
  const dueRoutines = routinesDueOn(state.routines, date);
  const extraRoutines = writableRoutinesNotDue(state.routines, date);
  const relative = formatRelativeDay(date);
  const moodOption = findMood(draft.mood, state.customMoods) ?? DEFAULT_MOOD;

  const blockFor = (routine: Routine) =>
    draft.blocks.find(
      (block) => block.routineId === routine.id && block.template === routine.template,
    );

  /** 內容已經沒有對應的定期事項（事項被刪除、換了格式，或來自舊備份）。 */
  const orphanBlocks = draft.blocks.filter((block) => {
    const owner = state.routines.find((routine) => routine.id === block.routineId);
    return !owner || owner.template !== block.template;
  });

  const setBlock = (next: EntryBlock) =>
    update({
      blocks: draft.blocks.map((block) => (block.id === next.id ? next : block)),
    });

  const removeBlock = (id: string) =>
    update({ blocks: draft.blocks.filter((block) => block.id !== id) });

  const toggleRoutine = (routine: Routine) => {
    if (!editable) return;
    const wasChecked = checkedIds.includes(routine.id);
    toggleRoutineCheck(routine.id, date);

    if (!routine.template) return;
    const block = blockFor(routine);

    if (!wasChecked && !block) {
      update({
        blocks: [
          ...draft.blocks,
          { id: createId(), routineId: routine.id, ...createEmptyContent(routine.template, {
            metricFields: routine.metricFields,
            timerDefaults: routine.timerDefaults,
          }) },
        ],
      });
    } else if (wasChecked && block && isBlockEmpty(block)) {
      removeBlock(block.id);
    }
  };

  // 只有「今天」的紀錄、且還在可補寫昨天的時段（中午前），才提供把單一項目改記到昨天。
  const yesterday = addDays(date, -1);
  const canMoveToYesterday = isToday && canEditEntry(yesterday);

  const moveBlockToYesterday = (block: EntryBlock) => {
    if (!canMoveToYesterday || isBlockEmpty(block)) return;

    const base = state.entries[yesterday] ?? createDayEntry(yesterday);
    const clash = base.blocks.some(
      (existing) =>
        existing.routineId === block.routineId &&
        existing.template === block.template &&
        !isBlockEmpty(existing),
    );
    if (clash) {
      setMoveNotice("昨天已經寫過這個項目了，沒有改過去。");
      return;
    }

    saveEntry({
      ...base,
      blocks: [...base.blocks, { ...block }],
      updatedAt: new Date().toISOString(),
    });

    // 定期事項的打勾也跟著改到昨天。
    const routine = state.routines.find((item) => item.id === block.routineId);
    if (routine && checkedIds.includes(routine.id)) {
      toggleRoutineCheck(routine.id, date);
      if (!(state.checks[yesterday] ?? []).includes(routine.id)) {
        toggleRoutineCheck(routine.id, yesterday);
      }
    }

    removeBlock(block.id);
    setMoveNotice("已把這個項目改記到昨天。");
  };

  useEffect(() => {
    if (!moveNotice) return;
    const timer = setTimeout(() => setMoveNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [moveNotice]);

  // 語音整理能填的欄位，就是這天可書寫的定期事項所涵蓋的格式。
  const writableRoutines = [...dueRoutines, ...extraRoutines];
  const voiceTemplates = Array.from(
    new Set(
      writableRoutines
        .map((routine) => routine.template)
        .filter((template): template is TemplateId => template !== null),
    ),
  );
  const voiceMetricLabels = Array.from(
    new Set(
      writableRoutines
        .flatMap((routine) => routine.metricFields ?? [])
        .map((field) => field.label.trim())
        .filter(Boolean),
    ),
  );

  /** 把 AI 整理出來的內容填進當天草稿：目標逐條追加，各書寫格式對到同 template 的定期事項。 */
  const applyVoiceFill = (result: VoiceFillResult) => {
    if (!editable) return;

    const routineForTemplate = (template: TemplateId) =>
      writableRoutines.find((routine) => routine.template === template);

    let blocks = draft.blocks;
    const toCheck: string[] = [];

    const ensureBlock = (template: TemplateId) => {
      const routine = routineForTemplate(template);
      if (!routine || !routine.template) return null;
      let block = blocks.find(
        (item) => item.routineId === routine.id && item.template === routine.template,
      );
      if (!block) {
        block = {
          id: createId(),
          routineId: routine.id,
          ...createEmptyContent(routine.template, {
            metricFields: routine.metricFields,
            timerDefaults: routine.timerDefaults,
          }),
        };
        blocks = [...blocks, block];
      }
      toCheck.push(routine.id);
      return { routine, block };
    };

    const replaceBlock = (id: string, next: EntryBlock) => {
      blocks = blocks.map((item) => (item.id === id ? next : item));
    };

    if (result.diary) {
      const found = ensureBlock("diary");
      if (found && found.block.template === "diary") {
        const prev = found.block.data;
        replaceBlock(found.block.id, {
          ...found.block,
          data: {
            title: prev.title || result.diary.title,
            body: [prev.body, result.diary.body].filter(Boolean).join("\n\n"),
          },
        });
      }
    }

    if (result.gratitude.length > 0) {
      const found = ensureBlock("gratitude");
      if (found && found.block.template === "gratitude") {
        const items = [...found.block.data.items];
        let cursor = 0;
        for (const text of result.gratitude) {
          while (cursor < items.length && items[cursor].trim()) cursor += 1;
          if (cursor < items.length) items[cursor] = text;
          else items.push(text);
          cursor += 1;
        }
        replaceBlock(found.block.id, { ...found.block, data: { items } });
      }
    }

    if (result.mindfulness.length > 0) {
      const found = ensureBlock("mindfulness");
      if (found && found.block.template === "mindfulness") {
        replaceBlock(found.block.id, {
          ...found.block,
          data: {
            items: [
              ...found.block.data.items,
              ...result.mindfulness.map((entry) => ({
                id: createId(),
                channel: entry.channel,
                mark: entry.mark,
                text: entry.text,
              })),
            ],
          },
        });
      }
    }

    if (result.metrics.length > 0) {
      const found = ensureBlock("metric");
      if (found && found.block.template === "metric") {
        const fields = found.block.data.fields.length
          ? found.block.data.fields
          : (found.routine.metricFields ?? []);
        const values = { ...found.block.data.values };
        for (const metric of result.metrics) {
          const field = fields.find((item) => item.label === metric.label);
          if (field) values[field.id] = metric.value;
        }
        replaceBlock(found.block.id, {
          ...found.block,
          data: { ...found.block.data, fields, values },
        });
      }
    }

    const focus =
      result.focus.length > 0
        ? [
            ...draft.focus,
            ...result.focus
              .filter(
                (text) => !draft.focus.some((item) => item.text.trim() === text.trim()),
              )
              .map((text) => ({ id: createId(), text, done: false })),
          ]
        : draft.focus;

    update({ blocks, focus });

    for (const routineId of toCheck) {
      if (!checkedIds.includes(routineId)) toggleRoutineCheck(routineId, date);
    }
  };

  // 最近傳過的排前面，最常用的那個就會是打開面板時的預設值。
  const shareTargets = useMemo(
    () =>
      [...state.settings.line.targets].sort((a, b) =>
        (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""),
      ),
    [state.settings.line.targets],
  );

  const sendToday = async () => {
    setSharing(true);
    setShareMessage(null);
    try {
      const next = await prepareDayImage(draft, state.routines, checkedIds, state.customMoods);
      setShareImage((current) => {
        revokePreparedImage(current);
        return next;
      });
      setShareOpen(true);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setShareMessage("圖片產生失敗，請再試一次。");
      }
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => () => revokePreparedImage(shareImageRef.current), []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-1.5">
          <LinkButton
            href={`/entry/${addDays(date, -1)}`}
            variant="ghost"
            size="sm"
            aria-label="前一天"
            className="size-10 shrink-0 px-0 sm:size-9"
          >
            <ChevronLeftIcon className="size-5" />
          </LinkButton>

          <div className="flex min-w-0 flex-col items-center gap-1 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              {!isToday ? (
                <Link
                  href={`/entry/${today}`}
                  className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-brand"
                  aria-label="回到今天"
                >
                  <h1 className="text-[17px] font-semibold tracking-tight text-ink sm:text-xl">
                    <span className="sm:hidden">{formatShortDate(date)}</span>
                    <span className="hidden sm:inline">{formatFullDate(date)}</span>
                  </h1>
                  <Chip tone="brand">{relative ?? "回今天"}</Chip>
                </Link>
              ) : (
                <>
                  <h1 className="text-[17px] font-semibold tracking-tight text-ink sm:text-xl">
                    <span className="sm:hidden">{formatShortDate(date)}</span>
                    <span className="hidden sm:inline">{formatFullDate(date)}</span>
                  </h1>
                  {relative ? <Chip tone="brand">{relative}</Chip> : null}
                </>
              )}
              {editable ? (
                <MoodField
                  value={draft.mood}
                  fallback={DEFAULT_MOOD}
                  onChange={(mood) => update({ mood })}
                />
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pr-2.5 pl-1.5 text-[13px] font-medium text-ink">
                  <MoodGlyph mood={moodOption} size={22} />
                  {moodOption.label}
                </span>
              )}
            </div>
            {editable ? <SaveIndicator status={status} /> : (
              <p className="text-[12px] text-ink-subtle">唯讀</p>
            )}
          </div>

          <LinkButton
            href={`/entry/${addDays(date, 1)}`}
            variant="ghost"
            size="sm"
            aria-label="後一天"
            className="size-10 shrink-0 px-0 sm:size-9"
          >
            <ChevronRightIcon className="size-5" />
          </LinkButton>
        </div>

        {!editable ? (
          <p className="rounded-lg bg-accent px-3.5 py-2.5 text-[13px] text-on-accent">
            只能書寫今天的紀錄；當天中午前還可以補寫昨天。過去的內容可以查看，但不能修改或刪除。
          </p>
        ) : null}

        {moveNotice ? (
          <p
            role="status"
            className="rounded-lg bg-brand-tint px-3.5 py-2.5 text-[13px] text-brand-strong"
          >
            {moveNotice}
          </p>
        ) : null}
      </header>

      <div className="relative">
        <fieldset disabled={!editable} className="min-w-0 space-y-5 border-0 p-0 disabled:opacity-90">
      {editable ? (
        <VoiceFill
          templates={voiceTemplates}
          metricLabels={voiceMetricLabels}
          adFreeUntil={state.settings.adFreeUntil}
          onApply={applyVoiceFill}
        />
      ) : null}

      <section className="card px-4 py-4">
        <h2 className="text-sm font-semibold text-ink">當日目標</h2>
        <p className="mt-0.5 mb-3 text-[13px] text-ink-muted">寫下想完成的事，完成後打勾。</p>
        <FocusList items={draft.focus} onChange={(focus) => update({ focus })} />
      </section>

      <CollapsibleSection
        title="定期事項"
        meta={
          <span className="text-[13px] tabular-nums text-ink-muted">
            {checkedIds.filter((id) => dueRoutines.some((routine) => routine.id === id)).length}
            {" / "}
            {dueRoutines.length}
          </span>
        }
      >
        {dueRoutines.length > 0 ? (
          <div className="space-y-2.5">
            <RoutineCheckGrid
              routines={dueRoutines}
              checkedIds={checkedIds}
              onToggle={toggleRoutine}
            />
            {dueRoutines.map((routine) => (
              <RoutinePanel
                key={routine.id}
                routine={routine}
                block={blockFor(routine)}
                checked={checkedIds.includes(routine.id)}
                onBlockChange={setBlock}
                onMoveToYesterday={canMoveToYesterday ? moveBlockToYesterday : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="card px-4 py-5 text-center">
            <p className="text-[13px] text-ink-muted">
              這天沒有排定的定期事項。書寫的格式（日記、五感恩、觀心書）都是定期事項，
              <Link href="/routines" className="font-medium text-brand hover:text-brand-strong">
                到定期事項設定
              </Link>
              後就會出現在這裡。
            </p>
          </div>
        )}
      </CollapsibleSection>

      {extraRoutines.length > 0 ? (
        <CollapsibleSection
          title="其他書寫格式"
          description="這天沒有排定，但你仍然可以臨時寫一段。"
          defaultOpen={false}
        >
          <div className="space-y-2.5">
            <RoutineCheckGrid
              routines={extraRoutines}
              checkedIds={checkedIds}
              onToggle={toggleRoutine}
            />
            {extraRoutines.map((routine) => (
              <RoutinePanel
                key={routine.id}
                routine={routine}
                block={blockFor(routine)}
                checked={checkedIds.includes(routine.id)}
                onBlockChange={setBlock}
                onMoveToYesterday={canMoveToYesterday ? moveBlockToYesterday : undefined}
              />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {orphanBlocks.length > 0 ? (
        <CollapsibleSection
          title="其他紀錄"
          description="這些內容原本的定期事項已經被刪除或更換了格式，內容仍然保留。"
        >
          {orphanBlocks.map((block) => (
            <BlockEditor
              key={block.id}
              block={block}
              onChange={setBlock}
              onRemove={() => removeBlock(block.id)}
            />
          ))}
        </CollapsibleSection>
      ) : null}

      <section className="card px-4 py-4">
        <h2 className="text-sm font-semibold text-ink">照片</h2>
        <p className="mt-0.5 mb-3 text-[13px] text-ink-muted">
          留一張當天的照片，分享成圖片時也會一起帶上。
        </p>
        <PhotoStrip photos={draft.photos} onChange={(photos) => update({ photos })} />
      </section>
        </fieldset>
        {!editable ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl bg-accent/10"
          />
        ) : null}
      </div>

      {hasContent(draft) ? (
        <footer className="space-y-3 pt-2">
          {deletable ? (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-alert hover:bg-alert/10 hover:text-alert"
                onClick={() => {
                  if (!window.confirm(`確定要刪除 ${formatFullDate(date)} 的紀錄嗎？`)) return;
                  deleteEntry(date);
                  setDraft(createDayEntry(date));
                  setDirty(false);
                  setStatus("idle");
                  setShareOpen(false);
                  setShareImage((current) => {
                    revokePreparedImage(current);
                    return null;
                  });
                }}
              >
                <TrashIcon className="size-4" />
                <span className="hidden sm:inline">刪除這天的紀錄</span>
                <span className="sm:hidden">刪除</span>
              </Button>
            </div>
          ) : null}

          <Button
            disabled={sharing}
            className="h-14 w-full rounded-xl text-lg font-bold"
            onClick={() => void sendToday()}
          >
            {sharing ? "產生圖片中…" : "傳送今天"}
          </Button>

          {shareMessage ? (
            <p className="text-center text-[13px] text-ink-muted">{shareMessage}</p>
          ) : null}
        </footer>
      ) : null}

      <ShareDayDialog
        open={shareOpen}
        image={shareImage}
        targets={shareTargets}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}

/**
 * 有書寫格式的事項打勾後展開的欄位；已經寫過內容的話取消打勾也會留著。
 * 上方勾選列一律用 `RoutineCheckGrid` 三欄並排。
 */
function RoutinePanel({
  routine,
  block,
  checked,
  onBlockChange,
  onMoveToYesterday,
}: {
  routine: Routine;
  block: EntryBlock | undefined;
  checked: boolean;
  onBlockChange: (next: EntryBlock) => void;
  /** 只有「今天」中午前才會帶進來；讓已寫的內容可以改記到昨天。 */
  onMoveToYesterday?: (block: EntryBlock) => void;
}) {
  // 完成的事項預設收合，未完成的預設展開；使用者仍可手動點開／收起。
  const [open, setOpen] = useState(!checked);
  const prevChecked = useRef(checked);

  useEffect(() => {
    if (checked === prevChecked.current) return;
    // 剛打勾 → 自動收合內容；剛取消打勾 → 自動展開方便繼續寫。
    setOpen(!checked);
    prevChecked.current = checked;
  }, [checked]);

  if (!block) return null;
  if (!checked && isBlockEmpty(block)) return null;

  const meta = routine.template ? getTemplate(routine.template) : null;

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center gap-x-2 gap-y-0.5 bg-surface-muted/50 px-4 py-2.5 text-left",
          open && "border-b border-line",
        )}
      >
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-ink-subtle transition-transform",
            !open && "-rotate-90",
          )}
          strokeWidth={2.2}
        />
        <span aria-hidden className="text-base">
          {routine.emoji}
        </span>
        <h3 className="text-sm font-semibold text-ink">{routine.title}</h3>
        {meta ? (
          <span className="hidden text-xs text-ink-subtle sm:inline">{meta.tagline}</span>
        ) : null}
        {checked ? (
          <span
            className="ml-auto flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent"
            aria-label="已完成"
            title="已完成"
          >
            <CheckIcon className="size-3.5" strokeWidth={2.6} />
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="space-y-3 px-4 py-4">
          <BlockEditor
            block={block}
            metricFields={routine.metricFields}
            onChange={onBlockChange}
            showHeader={false}
          />
          {onMoveToYesterday && !isBlockEmpty(block) ? (
            <div className="flex justify-end border-t border-line pt-3">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-ink-muted"
                onClick={() => onMoveToYesterday(block)}
              >
                改記到昨天
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "full") {
    return (
      <p className="text-xs font-semibold text-alert">裝置儲存空間不足，這次的變更沒有存進去</p>
    );
  }

  const text = status === "saving" ? "儲存中…" : status === "saved" ? "已自動儲存" : "自動儲存";
  return (
    <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
      <span
        aria-hidden
        className={
          status === "saving"
            ? "size-1.5 rounded-full bg-brand"
            : status === "saved"
              ? "size-1.5 rounded-full bg-accent"
              : "size-1.5 rounded-full bg-line-strong"
        }
      />
      {text}
    </p>
  );
}
