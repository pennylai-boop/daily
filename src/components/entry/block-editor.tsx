"use client";

import { TimerFields } from "@/components/entry/timer-fields";
import { CloseIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { TextArea, TextInput } from "@/components/ui/field";
import {
  createMindfulnessItem,
  getMark,
  getTemplate,
  GRATITUDE_SLOTS,
  groupMindfulnessItems,
  MINDFULNESS_MARKS,
} from "@/lib/templates";
import type { EntryBlock, MetricFieldDef, MindfulnessChannel, MindfulnessMark } from "@/lib/types";

export function BlockEditor({
  block,
  onChange,
  onRemove,
  metricFields,
  /** 掛在定期事項底下時不需要重複顯示標題列。 */
  showHeader = true,
}: {
  block: EntryBlock;
  onChange: (next: EntryBlock) => void;
  onRemove?: () => void;
  metricFields?: MetricFieldDef[];
  showHeader?: boolean;
}) {
  const meta = getTemplate(block.template);

  return (
    <section className={showHeader ? "card overflow-hidden" : ""}>
      {showHeader ? (
        <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-muted/50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-base">
              {meta.emoji}
            </span>
            <h3 className="text-sm font-semibold text-ink">{meta.name}</h3>
            <span className="hidden text-xs text-ink-subtle sm:inline">{meta.tagline}</span>
          </div>
          {onRemove ? (
            <Button
              size="sm"
              variant="ghost"
              aria-label={`移除${meta.name}`}
              className="size-8 px-0"
              onClick={onRemove}
            >
              <CloseIcon className="size-4" />
            </Button>
          ) : null}
        </header>
      ) : null}

      <div className={showHeader ? "space-y-4 px-4 py-4" : "space-y-4"}>
        {block.template === "diary" ? (
          <DiaryFields
            block={block}
            onChange={(data) => onChange({ ...block, template: "diary", data })}
          />
        ) : null}

        {block.template === "gratitude" ? (
          <GratitudeFields
            block={block}
            onChange={(data) => onChange({ ...block, template: "gratitude", data })}
          />
        ) : null}

        {block.template === "mindfulness" ? (
          <MindfulnessFields
            block={block}
            onChange={(data) => onChange({ ...block, template: "mindfulness", data })}
          />
        ) : null}

        {block.template === "timer" ? (
          <TimerFields
            block={block}
            onChange={(data) => onChange({ ...block, template: "timer", data })}
          />
        ) : null}

        {block.template === "metric" ? (
          <MetricFields
            block={block}
            extraFields={metricFields}
            onChange={(data) => onChange({ ...block, template: "metric", data })}
          />
        ) : null}
      </div>
    </section>
  );
}

function DiaryFields({
  block,
  onChange,
}: {
  block: Extract<EntryBlock, { template: "diary" }>;
  onChange: (data: Extract<EntryBlock, { template: "diary" }>["data"]) => void;
}) {
  return (
    <>
      <TextInput
        value={block.data.title}
        placeholder="標題（可留空）"
        maxLength={80}
        onChange={(event) => onChange({ ...block.data, title: event.target.value })}
      />
      <TextArea
        value={block.data.body}
        placeholder="今天想留下什麼？就從一句話開始。"
        rows={9}
        onChange={(event) => onChange({ ...block.data, body: event.target.value })}
      />
      <p className="text-right text-xs text-ink-subtle">
        {block.data.body.replace(/\s+/g, "").length} 字
      </p>
    </>
  );
}

function GratitudeFields({
  block,
  onChange,
}: {
  block: Extract<EntryBlock, { template: "gratitude" }>;
  onChange: (data: Extract<EntryBlock, { template: "gratitude" }>["data"]) => void;
}) {
  // 至少五列；寫超過五件時，多出來的列可以個別刪掉。
  const items = Array.from(
    { length: Math.max(GRATITUDE_SLOTS, block.data.items.length) },
    (_, index) => block.data.items[index] ?? "",
  );

  return (
    <div className="space-y-2.5">
      <ol className="space-y-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-tint text-[13px] font-semibold text-accent"
            >
              {index + 1}
            </span>
            <TextInput
              value={item}
              aria-label={`第 ${index + 1} 件感謝的事`}
              placeholder={GRATITUDE_PLACEHOLDERS[index] ?? "還想感謝的…"}
              onChange={(event) => {
                const next = [...items];
                next[index] = event.target.value;
                onChange({ items: next });
              }}
            />
            {index >= GRATITUDE_SLOTS ? (
              <Button
                size="sm"
                variant="ghost"
                aria-label={`刪除第 ${index + 1} 列`}
                className="size-9 shrink-0 px-0 sm:size-8"
                onClick={() => onChange({ items: items.filter((_, at) => at !== index) })}
              >
                <CloseIcon className="size-4" />
              </Button>
            ) : null}
          </li>
        ))}
      </ol>

      <Button
        size="sm"
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={() => onChange({ items: [...items, ""] })}
      >
        <PlusIcon className="size-4" />
        再加一項
      </Button>
    </div>
  );
}

const GRATITUDE_PLACEHOLDERS = [
  "感謝今天遇到的一個人…",
  "感謝身體為我做的一件事…",
  "感謝一件順利完成的小事…",
  "感謝一個平凡卻美好的片刻…",
  "感謝自己今天的哪一個決定…",
];

/** 記號的配色：做得好用綠、要調整用紅、要練習用棕。 */
const MARK_STYLES: Record<MindfulnessMark, string> = {
  plus: "border-accent/50 bg-accent-tint text-accent",
  minus: "border-alert/40 bg-alert/10 text-alert",
  todo: "border-brand/40 bg-brand-tint text-brand-strong",
};

function MindfulnessFields({
  block,
  onChange,
}: {
  block: Extract<EntryBlock, { template: "mindfulness" }>;
  onChange: (data: Extract<EntryBlock, { template: "mindfulness" }>["data"]) => void;
}) {
  const items = block.data.items;

  const add = (channel: MindfulnessChannel, mark: MindfulnessMark) =>
    onChange({ items: [...items, createMindfulnessItem(channel, mark)] });

  const setText = (id: string, text: string) =>
    onChange({ items: items.map((item) => (item.id === id ? { ...item, text } : item)) });

  const remove = (id: string) => onChange({ items: items.filter((item) => item.id !== id) });

  return (
    <div className="space-y-4">
      {groupMindfulnessItems(items).map(({ key, label, hint, items: channelItems }) => (
        <section key={key} className="rounded-xl border border-line bg-surface-muted/40 p-3">
          <div className="flex items-baseline gap-2">
            <h4 className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-on-accent">
              {label}
            </h4>
            <p className="text-[13px] text-ink-subtle">{hint}</p>
          </div>

          {channelItems.length > 0 ? (
            <ul className="mt-2.5 space-y-2">
              {channelItems.map((item) => {
                const mark = getMark(item.mark);
                return (
                  <li key={item.id} className="flex items-center gap-2">
                    <span
                      aria-label={mark.label}
                      title={mark.label}
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg border text-[13px] font-semibold",
                        MARK_STYLES[item.mark],
                      )}
                    >
                      {mark.symbol}
                    </span>
                    <TextInput
                      value={item.text}
                      aria-label={`${label}・${mark.label}`}
                      placeholder={mark.placeholder}
                      onChange={(event) => setText(item.id, event.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`刪除這一項${label}的${mark.label}`}
                      className="size-9 shrink-0 px-0 sm:size-8"
                      onClick={() => remove(item.id)}
                    >
                      <CloseIcon className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {MINDFULNESS_MARKS.map((mark) => (
              <button
                key={mark.key}
                type="button"
                onClick={() => add(key, mark.key)}
                className={cn(
                  "flex h-9 items-center justify-center gap-1 rounded-xl border border-dashed text-[13px] font-medium transition-colors hover:border-solid",
                  MARK_STYLES[mark.key],
                )}
              >
                <span aria-hidden>{mark.symbol}</span>
                {mark.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MetricFields({
  block,
  extraFields,
  onChange,
}: {
  block: Extract<EntryBlock, { template: "metric" }>;
  extraFields?: MetricFieldDef[];
  onChange: (data: Extract<EntryBlock, { template: "metric" }>["data"]) => void;
}) {
  const fields = mergeMetricFields([...(extraFields ?? []), ...block.data.fields]);

  if (fields.length === 0) {
    return (
      <p className="text-[13px] text-ink-muted">
        這個事項還沒設定要記錄的項目。請到定期目標裡編輯，寫上體重、腰圍等欄位。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <label key={field.id} className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-sm text-ink-muted">{field.label}</span>
          <TextInput
            inputMode="decimal"
            value={block.data.values[field.id] ?? ""}
            placeholder="數字"
            aria-label={field.label}
            onChange={(event) =>
              onChange({
                ...block.data,
                fields,
                values: { ...block.data.values, [field.id]: event.target.value },
              })
            }
          />
          {field.unit ? <span className="w-12 shrink-0 text-sm text-ink-subtle">{field.unit}</span> : null}
        </label>
      ))}
    </div>
  );
}

function mergeMetricFields(fields: MetricFieldDef[]): MetricFieldDef[] {
  const seen = new Set<string>();
  const next: MetricFieldDef[] = [];
  for (const field of fields) {
    if (!field.label.trim() || seen.has(field.id)) continue;
    seen.add(field.id);
    next.push(field);
  }
  return next;
}
