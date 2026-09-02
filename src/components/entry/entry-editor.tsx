"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BlockEditor } from "@/components/entry/block-editor";
import { FocusList } from "@/components/entry/focus-list";
import { MoodField, MoodGlyph } from "@/components/entry/mood-picker";
import { PhotoStrip } from "@/components/entry/photo-strip";
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from "@/components/icons";
import { RoutineCheckGrid } from "@/components/routines/check-grid";
import { Button, LinkButton } from "@/components/ui/button";
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
import { shareDayImage } from "@/lib/share-image";
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
} from "@/lib/types";

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
  const { state, saveEntry, deleteEntry, toggleRoutineCheck, markLineTargetUsed } =
    useDailyStore();
  const [draft, setDraft] = useState<DayEntry>(initial);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sentGroups, setSentGroups] = useState<string[]>([]);

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
      const { result, previewUrl: nextPreview } = await shareDayImage(
        draft,
        state.routines,
        checkedIds,
        state.customMoods,
      );
      setPreviewUrl(nextPreview);
      const names = shareTargets.map((target) => target.name);
      setSentGroups(names);
      for (const target of shareTargets) markLineTargetUsed(target.id);
      if (result === "downloaded") {
        setShareMessage(
          names.length > 0
            ? `已下載圖片，傳到 LINE 的「${names.join("、")}」即可。`
            : "已下載圖片，可以直接傳到 LINE。",
        );
      } else if (names.length > 0) {
        setShareMessage(`分享面板開好了，選 LINE →「${names.join("、")}」送出。`);
      }
    } catch (error) {
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
      </header>

      <div className="relative">
        <fieldset disabled={!editable} className="min-w-0 space-y-5 border-0 p-0 disabled:opacity-90">
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
                  setPreviewUrl(null);
                  setSentGroups([]);
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

          {previewUrl ? (
            <div className="space-y-3 rounded-xl border border-line bg-surface px-3 py-3">
              <p className="text-[13px] font-medium text-ink-muted">傳送預覽</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`${formatFullDate(date)} 的分享圖`}
                className="mx-auto max-h-[28rem] w-full rounded-lg border border-line object-contain"
              />
              {sentGroups.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-ink">已傳給</p>
                  <div className="flex flex-wrap gap-2">
                    {sentGroups.map((name) => (
                      <Chip key={name} tone="brand">
                        {name}
                      </Chip>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-ink-muted">
                  還沒記下群組。可到設定新增，之後這裡會列出已傳的對象。
                </p>
              )}
            </div>
          ) : null}

          {shareMessage ? (
            <p className="text-center text-[13px] text-ink-muted">{shareMessage}</p>
          ) : null}
        </footer>
      ) : null}
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
        <BlockEditor
          block={block}
          metricFields={routine.metricFields}
          onChange={onBlockChange}
          showHeader={false}
        />
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
