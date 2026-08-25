"use client";

import { useState } from "react";

import { CloseIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Field, TextInput } from "@/components/ui/field";
import { todayIso, WEEKDAY_LABELS } from "@/lib/date";
import { ROUTINE_EMOJIS } from "@/lib/routines";
import { TEMPLATES } from "@/lib/templates";
import { createId } from "@/lib/storage";
import { DEFAULT_TIMER, type MetricFieldDef, type Routine, type RoutineFrequency, type TimerDefaults } from "@/lib/types";

type RoutineDraft = Omit<Routine, "id" | "createdAt">;

const FREQUENCY_TABS: { kind: RoutineFrequency["kind"]; label: string }[] = [
  { kind: "daily", label: "每天" },
  { kind: "weekly", label: "每週" },
  { kind: "monthly", label: "每月" },
  { kind: "interval", label: "間隔天數" },
];

function defaultFrequency(kind: RoutineFrequency["kind"]): RoutineFrequency {
  switch (kind) {
    case "daily":
      return { kind: "daily" };
    case "weekly":
      return { kind: "weekly", weekdays: [1, 3, 5] };
    case "monthly":
      return { kind: "monthly", days: [1] };
    case "interval":
      return { kind: "interval", everyDays: 3, startDate: todayIso() };
  }
}

export function RoutineForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: RoutineDraft;
  submitLabel: string;
  onSubmit: (draft: RoutineDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<RoutineDraft>(
    initial ?? {
      title: "",
      emoji: ROUTINE_EMOJIS[0],
      note: "",
      frequency: { kind: "daily" },
      template: null,
      metricFields: [{ id: createId(), label: "", unit: "" }],
      timerDefaults: DEFAULT_TIMER,
      archived: false,
    },
  );

  const metricReady =
    draft.template !== "metric" ||
    (draft.metricFields ?? []).some((field) => field.label.trim().length > 0);
  const canSubmit = draft.title.trim().length > 0 && isFrequencyComplete(draft.frequency) && metricReady;

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          ...draft,
          title: draft.title.trim(),
          note: draft.note.trim(),
          metricFields: (draft.metricFields ?? [])
            .map((field) => ({ ...field, label: field.label.trim(), unit: field.unit.trim() }))
            .filter((field) => field.label.length > 0),
          timerDefaults: draft.timerDefaults ?? DEFAULT_TIMER,
        });
      }}
    >
      <Field label="事項名稱" htmlFor="routine-title">
        <TextInput
          id="routine-title"
          value={draft.title}
          maxLength={40}
          autoFocus
          placeholder="例如：靜坐十分鐘"
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </Field>

      <Field label="圖示">
        <div className="flex flex-wrap gap-1.5">
          {ROUTINE_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`使用圖示 ${emoji}`}
              aria-pressed={draft.emoji === emoji}
              onClick={() => setDraft({ ...draft, emoji })}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl border text-lg transition-colors",
                draft.emoji === emoji
                  ? "border-accent bg-surface-muted ring-2 ring-line"
                  : "border-line bg-surface hover:bg-surface-muted",
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Field>

      <Field label="重複頻率">
        <div className="inline-flex rounded-lg border border-line bg-paper p-1">
          {FREQUENCY_TABS.map(({ kind, label }) => (
            <button
              key={kind}
              type="button"
              aria-pressed={draft.frequency.kind === kind}
              onClick={() => setDraft({ ...draft, frequency: defaultFrequency(kind) })}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                draft.frequency.kind === kind
                  ? "bg-surface text-accent shadow-sm"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      {draft.frequency.kind === "weekly" ? (
        <WeekdayPicker
          weekdays={draft.frequency.weekdays}
          onChange={(weekdays) => setDraft({ ...draft, frequency: { kind: "weekly", weekdays } })}
        />
      ) : null}

      {draft.frequency.kind === "monthly" ? (
        <MonthDayPicker
          days={draft.frequency.days}
          onChange={(days) => setDraft({ ...draft, frequency: { kind: "monthly", days } })}
        />
      ) : null}

      {draft.frequency.kind === "interval" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="每隔幾天" htmlFor="routine-interval">
            <TextInput
              id="routine-interval"
              type="number"
              min={1}
              max={365}
              value={draft.frequency.everyDays}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  frequency: {
                    kind: "interval",
                    everyDays: Math.max(1, Number(event.target.value) || 1),
                    startDate:
                      draft.frequency.kind === "interval" ? draft.frequency.startDate : todayIso(),
                  },
                })
              }
            />
          </Field>
          <Field label="起算日" htmlFor="routine-start">
            <TextInput
              id="routine-start"
              type="date"
              value={draft.frequency.startDate}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  frequency: {
                    kind: "interval",
                    everyDays:
                      draft.frequency.kind === "interval" ? draft.frequency.everyDays : 3,
                    startDate: event.target.value || todayIso(),
                  },
                })
              }
            />
          </Field>
        </div>
      ) : null}

      <Field label="記錄格式" hint="選了格式之後，打勾這個事項時會展開對應的欄位讓你填寫。">
        <div className="grid gap-2 sm:grid-cols-2">
          <FormatOption
            emoji="✅"
            name="只打勾"
            description="不需要書寫，完成時打勾即可。"
            selected={draft.template === null}
            onSelect={() => setDraft({ ...draft, template: null })}
          />
          {TEMPLATES.map((template) => (
            <FormatOption
              key={template.id}
              emoji={template.emoji}
              name={template.name}
              description={template.description}
              selected={draft.template === template.id}
              onSelect={() =>
                setDraft({
                  ...draft,
                  template: template.id,
                  timerDefaults: draft.timerDefaults ?? DEFAULT_TIMER,
                  metricFields:
                    template.id === "metric" && (draft.metricFields ?? []).length === 0
                      ? [{ id: createId(), label: "", unit: "" }]
                      : draft.metricFields,
                })
              }
            />
          ))}
        </div>
      </Field>

      {draft.template === "timer" ? (
        <TimerDefaultsFields
          value={draft.timerDefaults ?? DEFAULT_TIMER}
          onChange={(timerDefaults) => setDraft({ ...draft, timerDefaults })}
        />
      ) : null}

      {draft.template === "metric" ? (
        <MetricSetupFields
          fields={draft.metricFields ?? []}
          onChange={(metricFields) => setDraft({ ...draft, metricFields })}
        />
      ) : null}

      <Field label="備註" hint="選填，會顯示在清單上，例如提醒的時段。" htmlFor="routine-note">
        <TextInput
          id="routine-note"
          value={draft.note}
          maxLength={60}
          placeholder="例如：起床後、盥洗前"
          onChange={(event) => setDraft({ ...draft, note: event.target.value })}
        />
      </Field>

      <div className="flex gap-2 border-t border-line pt-4 sm:justify-end">
        <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" className="flex-1 sm:flex-none" disabled={!canSubmit}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function TimerDefaultsFields({
  value,
  onChange,
}: {
  value: TimerDefaults;
  onChange: (next: TimerDefaults) => void;
}) {
  return (
    <Field label="計時預設" hint="每天打開時會用這個設定；當天仍可改成碼表或番茄鐘。">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-line bg-paper p-1">
          {(
            [
              { id: "stopwatch" as const, label: "碼表" },
              { id: "pomodoro" as const, label: "番茄鐘" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={value.mode === option.id}
              onClick={() => onChange({ ...value, mode: option.id })}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                value.mode === option.id ? "bg-surface text-accent shadow-sm" : "text-ink-muted hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {value.mode === "pomodoro" ? (
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            每顆
            <TextInput
              className="w-20"
              inputMode="numeric"
              value={String(value.pomodoroMinutes)}
              onChange={(event) =>
                onChange({
                  ...value,
                  pomodoroMinutes: Math.max(1, Math.min(180, Number(event.target.value.replace(/\D/g, "")) || 25)),
                })
              }
            />
            分鐘
          </label>
        ) : null}
      </div>
    </Field>
  );
}

function MetricSetupFields({
  fields,
  onChange,
}: {
  fields: MetricFieldDef[];
  onChange: (next: MetricFieldDef[]) => void;
}) {
  const rows = fields.length > 0 ? fields : [{ id: createId(), label: "", unit: "" }];

  return (
    <Field label="要記錄的項目" hint="建立時就要寫好。之後每天只要填數字，回顧會畫成曲線。">
      <div className="space-y-2">
        {rows.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <TextInput
              value={field.label}
              placeholder={index === 0 ? "例如：體重" : "例如：腰圍、喝水"}
              maxLength={20}
              aria-label={`項目 ${index + 1} 名稱`}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...field, label: event.target.value };
                onChange(next);
              }}
            />
            <TextInput
              className="w-24"
              value={field.unit}
              placeholder="單位"
              maxLength={12}
              aria-label={`${field.label || `項目 ${index + 1}`}單位`}
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...field, unit: event.target.value };
                onChange(next);
              }}
            />
            {rows.length > 1 ? (
              <Button
                size="sm"
                variant="ghost"
                aria-label={`刪除 ${field.label || `項目 ${index + 1}`}`}
                className="size-10 shrink-0 px-0"
                onClick={() => onChange(rows.filter((item) => item.id !== field.id))}
              >
                <CloseIcon className="size-4" />
              </Button>
            ) : null}
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={() => onChange([...rows, { id: createId(), label: "", unit: "" }])}
        >
          <PlusIcon className="size-4" />
          再加一項
        </Button>
      </div>
    </Field>
  );
}

function FormatOption({
  emoji,
  name,
  description,
  selected,
  onSelect,
}: {
  emoji: string;
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-accent bg-surface-muted ring-2 ring-line"
          : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted",
      )}
    >
      <span aria-hidden className="mt-0.5 text-base">
        {emoji}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{name}</span>
        <span className="block text-xs leading-relaxed text-ink-muted">{description}</span>
      </span>
    </button>
  );
}

function isFrequencyComplete(frequency: RoutineFrequency): boolean {
  if (frequency.kind === "weekly") return frequency.weekdays.length > 0;
  if (frequency.kind === "monthly") return frequency.days.length > 0;
  return true;
}

function WeekdayPicker({
  weekdays,
  onChange,
}: {
  weekdays: number[];
  onChange: (weekdays: number[]) => void;
}) {
  const toggle = (weekday: number) =>
    onChange(
      weekdays.includes(weekday)
        ? weekdays.filter((current) => current !== weekday)
        : [...weekdays, weekday],
    );

  return (
    <Field label="選擇星期">
      {/* 用 grid 讓七格平分寬度，在 375px 的手機上才不會撐出橫向捲動。 */}
      <div className="grid grid-cols-7 gap-1.5 sm:max-w-xs">
        {WEEKDAY_LABELS.map((label, weekday) => (
          <button
            key={label}
            type="button"
            aria-pressed={weekdays.includes(weekday)}
            onClick={() => toggle(weekday)}
            className={cn(
              "h-10 rounded-lg border text-sm font-medium transition-colors",
              weekdays.includes(weekday)
                ? "border-accent bg-accent text-on-accent"
                : "border-line bg-surface text-ink-muted hover:bg-surface-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </Field>
  );
}

function MonthDayPicker({
  days,
  onChange,
}: {
  days: number[];
  onChange: (days: number[]) => void;
}) {
  const toggle = (day: number) =>
    onChange(days.includes(day) ? days.filter((current) => current !== day) : [...days, day]);

  return (
    <Field label="選擇日期" hint="若某月沒有該日期（例如 31 日），當月就會跳過。">
      <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
        {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
          <button
            key={day}
            type="button"
            aria-pressed={days.includes(day)}
            onClick={() => toggle(day)}
            className={cn(
              "h-9 rounded-lg border text-[13px] font-medium tabular-nums transition-colors",
              days.includes(day)
                ? "border-accent bg-accent text-on-accent"
                : "border-line bg-surface text-ink-muted hover:bg-surface-muted",
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </Field>
  );
}
