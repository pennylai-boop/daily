"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Card, Chip, PageHeading, SectionHeading } from "@/components/ui/surfaces";
import { todayIso } from "@/lib/date";
import { clampFocusMinutes, FOCUS_PRESETS, todayFocusSeconds } from "@/lib/focus";
import { formatDuration } from "@/lib/templates";
import { setFocusPomodoroMinutes, startFocusSession, useDailyStore } from "@/lib/store";

const PRESET_OPTIONS = FOCUS_PRESETS.map((minutes) => ({
  value: String(minutes),
  label: `${minutes} 分`,
}));

export function FocusScreen() {
  const { state, ready } = useDailyStore();
  const focus = state.focus ?? {
    pomodoroMinutes: 25,
    runningStartedAt: null,
    runningPlannedMinutes: 25,
    runningKind: "timed" as const,
    sessions: [],
  };
  const minutes = ready ? focus.pomodoroMinutes : 25;
  const isPreset = (FOCUS_PRESETS as readonly number[]).includes(minutes);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState(String(minutes));
  const preset = customMode || !isPreset ? "custom" : String(minutes);

  const today = todayIso();
  const todaySeconds = ready ? todayFocusSeconds(focus.sessions, today) : 0;
  const recent = ready ? [...focus.sessions].reverse().slice(0, 20) : [];

  const setMinutes = (next: number, custom = false) => {
    const clamped = clampFocusMinutes(next);
    setCustomMode(custom);
    setFocusPomodoroMinutes(clamped);
    setCustomText(String(clamped));
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeading
        title="專心模式"
        description="選好時長後按「開始時長」倒數，或按「直接計時」像碼表一樣往上加。進行中會鎖定天天 daily，並請系統進入全螢幕。瀏覽器沒辦法關掉其他 App；iPhone 可連按側鍵三次開引導使用。"
      />

      <Card className="space-y-4 px-4 py-4 sm:px-5">
        <SectionHeading title="專心時間" description="開始時長會倒數這段時間；直接計時不設上限，按結束才停。" />

        <Field label="預設時長">
          <Segmented
            ariaLabel="番茄鐘分鐘"
            value={preset === "custom" ? "custom" : preset}
            options={[...PRESET_OPTIONS, { value: "custom", label: "自訂" }]}
            onChange={(value) => {
              if (value === "custom") {
                setCustomMode(true);
                setCustomText(String(minutes));
                return;
              }
              setMinutes(Number(value));
            }}
            className="flex-wrap"
          />
        </Field>

        {preset === "custom" ? (
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            自訂
            <TextInput
              className="w-20 text-center"
              inputMode="numeric"
              value={customText}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
                setCustomText(digits);
                if (digits) setMinutes(Number(digits), true);
              }}
            />
            分鐘
          </label>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button size="lg" disabled={!ready} onClick={() => startFocusSession(minutes, "timed")}>
            開始時長
          </Button>
          <Button
            size="lg"
            variant="secondary"
            disabled={!ready}
            onClick={() => startFocusSession(undefined, "open")}
          >
            直接計時
          </Button>
        </div>
      </Card>

      <Card className="px-4 py-6 sm:px-5">
        <p
          className="text-center text-4xl font-semibold tabular-nums tracking-tight text-ink"
          aria-label="今日總時長"
        >
          {formatDuration(todaySeconds)}
        </p>
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="專心紀錄" description="最近 20 段，含是否走完整顆番茄鐘。" />
        {!ready ? (
          <p className="mt-4 text-[13px] text-ink-muted">讀取中…</p>
        ) : recent.length === 0 ? (
          <p className="mt-4 text-[13px] text-ink-muted">還沒有專心紀錄。</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {recent.map((session) => (
              <li key={session.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{formatWhen(session.startedAt)}</p>
                  <p className="mt-0.5 text-[12px] text-ink-subtle">
                    {session.plannedMinutes > 0 ? `計畫 ${session.plannedMinutes} 分鐘` : "碼表"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-ink">
                    {formatDuration(session.elapsedSeconds)}
                  </p>
                  <Chip tone={session.completed ? "accent" : "neutral"} className="mt-1">
                    {session.completed ? "完成" : "中途結束"}
                  </Chip>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
