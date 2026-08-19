"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BlockEditor } from "@/components/entry/block-editor";
import { FocusList } from "@/components/entry/focus-list";
import { MoodField } from "@/components/entry/mood-picker";
import { PhotoStrip } from "@/components/entry/photo-strip";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  TrashIcon,
} from "@/components/icons";
import { RoutineCheckGrid } from "@/components/routines/check-grid";
import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { CollapsibleSection } from "@/components/ui/collapsible";
import { Chip } from "@/components/ui/surfaces";
import {
  addDays,
  formatFullDate,
  formatRelativeDay,
  formatShortDate,
  isFuture,
} from "@/lib/date";
import { DEFAULT_MOOD } from "@/lib/moods";
import { describeFrequency, routinesDueOn, writableRoutinesNotDue } from "@/lib/routines";
import { shareDayImage } from "@/lib/share-image";
import { hasContent } from "@/lib/stats";
import { createId } from "@/lib/storage";
import { createDayEntry, useDailyStore } from "@/lib/store";
import { createEmptyContent, getTemplate, isBlockEmpty } from "@/lib/templates";
import { DEFAULT_MOOD_ID, type DayEntry, type EntryBlock, type IsoDate, type Routine } from "@/lib/types";

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

  const update = (patch: Partial<DayEntry>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
    setStatus("saving");
  };

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      const next = { ...draft, updatedAt: new Date().toISOString() };
      // 預設心情只在這天真的有內容時才寫進去，單純點開某一天不會留下紀錄。
      if (!next.mood && hasContent(next)) next.mood = DEFAULT_MOOD_ID;

      if (!hasContent(next) && next.blocks.length === 0) {
        deleteEntry(date);
        setStatus("saved");
      } else {
        setStatus(saveEntry(next) ? "saved" : "full");
      }
      setDirty(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [dirty, draft, date, saveEntry, deleteEntry]);

  const checkedIds = state.checks[date] ?? [];
  const dueRoutines = routinesDueOn(state.routines, date);
  // 只打勾的事項並排成格狀，有書寫格式的仍然是一列小方框（打勾後要在下方展開欄位）。
  const writingRoutines = dueRoutines.filter((routine) => routine.template);
  const checkOnlyRoutines = dueRoutines.filter((routine) => !routine.template);
  const extraRoutines = writableRoutinesNotDue(state.routines, date);
  const relative = formatRelativeDay(date);

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
    const wasChecked = checkedIds.includes(routine.id);
    toggleRoutineCheck(routine.id, date);

    if (!routine.template) return;
    const block = blockFor(routine);

    if (!wasChecked && !block) {
      update({
        blocks: [
          ...draft.blocks,
          { id: createId(), routineId: routine.id, ...createEmptyContent(routine.template) },
        ],
      });
    } else if (wasChecked && block && isBlockEmpty(block)) {
      removeBlock(block.id);
    }
  };

  const { line } = state.settings;
  const lineTarget = line.enabled && line.groupName.trim() ? line.groupName.trim() : null;

  const share = async () => {
    setSharing(true);
    setShareMessage(null);
    try {
      const result = await shareDayImage(draft, state.routines, checkedIds, state.customMoods);
      if (result === "downloaded") {
        setShareMessage("已下載圖片，可以直接傳到 LINE 或其他地方。");
      }
    } catch (error) {
      // 使用者在系統分享面板按取消時會拋出 AbortError，不需要提示。
      if ((error as Error).name !== "AbortError") {
        setShareMessage("圖片產生失敗，請再試一次。");
      }
    } finally {
      setSharing(false);
    }
  };

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
              <h1 className="text-[17px] font-semibold tracking-tight text-ink sm:text-xl">
                <span className="sm:hidden">{formatShortDate(date)}</span>
                <span className="hidden sm:inline">{formatFullDate(date)}</span>
              </h1>
              {relative ? <Chip tone="brand">{relative}</Chip> : null}
              <MoodField
                value={draft.mood}
                fallback={DEFAULT_MOOD}
                onChange={(mood) => update({ mood })}
              />
            </div>
            <SaveIndicator status={status} />
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

        {isFuture(date) ? (
          <p className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13px] text-ink-muted">
            這是未來的日期，你可以先寫下想達成的目標。
          </p>
        ) : null}
      </header>

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
            {writingRoutines.length > 0 ? (
              <RoutineChips
                routines={writingRoutines}
                checkedIds={checkedIds}
                onToggle={toggleRoutine}
              />
            ) : null}
            {checkOnlyRoutines.length > 0 ? (
              <RoutineCheckGrid
                routines={checkOnlyRoutines}
                checkedIds={checkedIds}
                onToggle={toggleRoutine}
              />
            ) : null}
            {dueRoutines.map((routine) => (
              <RoutinePanel
                key={routine.id}
                routine={routine}
                block={blockFor(routine)}
                checked={checkedIds.includes(routine.id)}
                onBlockChange={setBlock}
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
            <RoutineChips
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

      {hasContent(draft) ? (
        <footer className="space-y-2 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3">
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
              }}
            >
              <TrashIcon className="size-4" />
              <span className="hidden sm:inline">刪除這天的紀錄</span>
              <span className="sm:hidden">刪除</span>
            </Button>

            <Button
              size="sm"
              disabled={sharing}
              className="min-w-0 shrink"
              onClick={() => void share()}
            >
              <ImageIcon className="size-4 shrink-0" />
              <span className="truncate">
                {sharing ? "產生圖片中…" : lineTarget ? `分享到 ${lineTarget}` : "分享成圖片"}
              </span>
            </Button>
          </div>
          {shareMessage ? (
            <p className="text-right text-xs text-ink-muted">{shareMessage}</p>
          ) : lineTarget ? (
            <p className="text-right text-xs text-ink-subtle">
              在分享面板選 LINE →「{lineTarget}」即可送出整頁圖片。
            </p>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}

/**
 * 有書寫格式的事項用的小方框，一列可以並排好幾個、寬度隨名字長度。
 *
 * 每個事項各佔一張卡片時，光是「今天要做什麼」就吃掉整個螢幕。這裡不排成固定欄數的格狀：
 * 打勾後下方會展開對應欄位（`RoutinePanel`），並排會看不出勾了哪一個對應哪一段。
 * 只打勾的事項則交給 `RoutineCheckGrid` 三欄並排。
 */
function RoutineChips({
  routines,
  checkedIds,
  onToggle,
}: {
  routines: Routine[];
  checkedIds: string[];
  onToggle: (routine: Routine) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {routines.map((routine) => {
        const checked = checkedIds.includes(routine.id);
        return (
          <li key={routine.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={checked}
              // 頻率與備註移到 tooltip：清單上只留看得懂的名字。
              title={`${describeFrequency(routine.frequency)}${routine.note ? `・${routine.note}` : ""}`}
              onClick={() => onToggle(routine)}
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-xl border py-1.5 pr-3 pl-2 text-sm transition-colors",
                checked
                  ? "border-accent/40 bg-accent-tint font-medium text-accent"
                  : "border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-muted",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  checked
                    ? "border-accent bg-accent text-on-accent"
                    : "border-line-strong bg-surface",
                )}
              >
                {checked ? <CheckIcon className="size-3.5" strokeWidth={2.6} /> : null}
              </span>
              <span aria-hidden className="text-base">
                {routine.emoji}
              </span>
              <span className="max-w-44 truncate">{routine.title}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** 有書寫格式的事項打勾後展開的欄位；已經寫過內容的話取消打勾也會留著。 */
function RoutinePanel({
  routine,
  block,
  checked,
  onBlockChange,
}: {
  routine: Routine;
  block: EntryBlock | undefined;
  checked: boolean;
  onBlockChange: (next: EntryBlock) => void;
}) {
  if (!block) return null;
  if (!checked && isBlockEmpty(block)) return null;

  const meta = routine.template ? getTemplate(routine.template) : null;

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-line bg-surface-muted/50 px-4 py-2.5">
        <span aria-hidden className="text-base">
          {routine.emoji}
        </span>
        <h3 className="text-sm font-semibold text-ink">{routine.title}</h3>
        {meta ? <span className="text-xs text-ink-subtle">{meta.tagline}</span> : null}
      </header>
      <div className="px-4 py-4">
        <BlockEditor block={block} onChange={onBlockChange} showHeader={false} />
      </div>
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
