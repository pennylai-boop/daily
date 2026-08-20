"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import {
  CheckIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SkipForwardIcon,
  TrashIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { TextInput } from "@/components/ui/field";
import { InfoHint } from "@/components/ui/info-hint";
import { Card, SectionHeading } from "@/components/ui/surfaces";
import { enterFocusSilence, exitFocusSilence } from "@/lib/focus-silence";
import { createId } from "@/lib/storage";
import { setFocusQueue, useDailyStore } from "@/lib/store";
import type { FocusTimerTask } from "@/lib/types";

type SessionStatus = "idle" | "running" | "paused" | "finished";

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * 專注模式：依佇列計時，中央完成鈕、暫停、跳過；計時中會嘗試開啟系統勿擾與螢幕喚醒。
 */
export function FocusModePanel() {
  const { state, ready } = useDailyStore();
  const tasks = state.focusQueue;

  const [status, setStatus] = useState<SessionStatus>("idle");
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [dndOn, setDndOn] = useState(false);
  const [wakeOn, setWakeOn] = useState(false);
  const endsAtRef = useRef<number | null>(null);

  const current = tasks[index] ?? null;
  const active = status === "running" || status === "paused";

  const onTick = useEffectEvent(() => {
    if (status !== "running" || endsAtRef.current === null) return;
    const next = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
    setRemaining(next);
    if (next <= 0) advance("complete");
  });

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => onTick(), 250);
    return () => window.clearInterval(id);
  }, [status, onTick]);

  useEffect(() => {
    return () => {
      void exitFocusSilence();
    };
  }, []);

  const startSession = async (fromIndex = 0) => {
    if (tasks.length === 0) return;
    const startAt = Math.min(fromIndex, tasks.length - 1);
    const task = tasks[startAt];
    setIndex(startAt);
    setRemaining(task.durationMinutes * 60);
    endsAtRef.current = Date.now() + task.durationMinutes * 60 * 1000;
    setStatus("running");
    const silence = await enterFocusSilence();
    setDndOn(silence.dnd);
    setWakeOn(silence.wakeLock);
  };

  const pause = () => {
    if (status !== "running") return;
    endsAtRef.current = null;
    setStatus("paused");
  };

  const resume = () => {
    if (status !== "paused" || !current) return;
    endsAtRef.current = Date.now() + remaining * 1000;
    setStatus("running");
  };

  const stopSession = async () => {
    endsAtRef.current = null;
    setStatus("idle");
    setIndex(0);
    setRemaining(0);
    setDndOn(false);
    setWakeOn(false);
    await exitFocusSilence();
  };

  const advance = async (reason: "complete" | "skip") => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator && reason === "complete") {
      navigator.vibrate(40);
    }

    const nextIndex = index + 1;
    if (nextIndex >= tasks.length) {
      endsAtRef.current = null;
      setStatus("finished");
      setDndOn(false);
      setWakeOn(false);
      await exitFocusSilence();
      return;
    }

    const next = tasks[nextIndex];
    setIndex(nextIndex);
    setRemaining(next.durationMinutes * 60);
    endsAtRef.current = Date.now() + next.durationMinutes * 60 * 1000;
    setStatus("running");
  };

  if (!ready) return null;

  return (
    <Card className="overflow-hidden px-4 py-4 sm:px-5">
      <SectionHeading
        title="專注模式"
        description="依序計時完成清單。開始後會嘗試開啟手機勿擾，並維持螢幕不休眠。"
        action={
          active || status === "finished" ? (
            <Button size="sm" variant="ghost" onClick={() => void stopSession()}>
              結束
            </Button>
          ) : null
        }
      />

      {status === "idle" ? (
        <IdleEditor
          tasks={tasks}
          onChange={setFocusQueue}
          onStart={() => void startSession(0)}
        />
      ) : null}

      {active && current ? (
        <ActiveTimer
          task={current}
          remaining={remaining}
          status={status}
          dndOn={dndOn}
          wakeOn={wakeOn}
          tasks={tasks}
          index={index}
          onPause={pause}
          onResume={resume}
          onComplete={() => void advance("complete")}
          onSkip={() => void advance("skip")}
        />
      ) : null}

      {status === "finished" ? (
        <div className="mt-6 space-y-4 text-center">
          <p className="text-4xl" aria-hidden>
            ✨
          </p>
          <p className="text-lg font-semibold text-ink">這一輪都完成了</p>
          <p className="text-[13px] text-ink-muted">勿擾已關閉，可以休息一下再開始下一輪。</p>
          <div className="flex justify-center gap-2">
            <Button variant="secondary" onClick={() => void stopSession()}>
              回到清單
            </Button>
            <Button onClick={() => void startSession(0)}>再來一輪</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ActiveTimer({
  task,
  remaining,
  status,
  dndOn,
  wakeOn,
  tasks,
  index,
  onPause,
  onResume,
  onComplete,
  onSkip,
}: {
  task: FocusTimerTask;
  remaining: number;
  status: SessionStatus;
  dndOn: boolean;
  wakeOn: boolean;
  tasks: FocusTimerTask[];
  index: number;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-ink-subtle">
        {dndOn ? <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-brand-strong">勿擾已開</span> : null}
        {wakeOn ? (
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5">螢幕維持喚醒</span>
        ) : null}
        {!dndOn ? (
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5">
            系統勿擾需 App 殼支援；瀏覽器會盡量保持螢幕亮著
          </span>
        ) : null}
      </div>

      <div className="text-center">
        <p className="text-4xl" aria-hidden>
          {task.emoji}
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink">{task.title}</h3>
        <p
          className="mt-4 font-semibold tracking-tight text-ink tabular-nums"
          style={{ fontSize: "clamp(3rem, 12vw, 4.5rem)", lineHeight: 1 }}
        >
          {formatClock(remaining)}
        </p>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label={status === "paused" ? "繼續" : "暫停"}
          onClick={status === "paused" ? onResume : onPause}
          className="flex size-12 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          {status === "paused" ? (
            <PlayIcon className="size-7" />
          ) : (
            <PauseIcon className="size-7" strokeWidth={2.2} />
          )}
        </button>

        <button
          type="button"
          aria-label="完成這一項"
          onClick={onComplete}
          className="flex size-16 items-center justify-center rounded-full bg-brand text-on-brand shadow-[0_8px_24px_rgba(232,110,44,0.35)] transition-opacity hover:opacity-90"
        >
          <CheckIcon className="size-8" strokeWidth={2.6} />
        </button>

        <button
          type="button"
          aria-label="跳過"
          onClick={onSkip}
          className="flex size-12 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <SkipForwardIcon className="size-7" strokeWidth={2} />
        </button>
      </div>

      <ul className="space-y-2">
        {tasks.map((item, itemIndex) => {
          const done = itemIndex < index;
          const currentItem = itemIndex === index;
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3.5 py-3",
                currentItem
                  ? "border-brand/40 bg-brand-tint"
                  : done
                    ? "border-line bg-surface-muted opacity-60"
                    : "border-line bg-surface",
              )}
            >
              <span aria-hidden className="text-xl">
                {item.emoji}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[15px] font-medium",
                  done ? "text-ink-subtle line-through" : "text-ink",
                )}
              >
                {item.title}
              </span>
              <span className="shrink-0 text-[13px] text-ink-muted">{item.durationMinutes}分鐘</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IdleEditor({
  tasks,
  onChange,
  onStart,
}: {
  tasks: FocusTimerTask[];
  onChange: (tasks: FocusTimerTask[]) => void;
  onStart: () => void;
}) {
  const [emoji, setEmoji] = useState("🧘");
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("10");

  const add = () => {
    const text = title.trim();
    const duration = Math.max(1, Math.min(180, Number(minutes) || 0));
    if (!text || !duration) return;
    onChange([
      ...tasks,
      {
        id: createId(),
        title: text,
        emoji: emoji.trim() || "⏱",
        durationMinutes: duration,
      },
    ]);
    setTitle("");
    setMinutes("10");
  };

  return (
    <div className="mt-4 space-y-4">
      {tasks.length === 0 ? (
        <p className="rounded-xl bg-paper px-3.5 py-3 text-[13px] leading-relaxed text-ink-muted">
          還沒有計時項目。先加幾件要專心做的事，例如伸展、餵寵物、吃早餐，再按下開始。
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3"
            >
              <span aria-hidden className="text-xl">
                {task.emoji}
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">
                {task.title}
              </span>
              <span className="shrink-0 text-[13px] text-ink-muted">{task.durationMinutes}分鐘</span>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`刪除 ${task.title}`}
                className="size-8 shrink-0 border border-line-strong p-0"
                onClick={() => onChange(tasks.filter((item) => item.id !== task.id))}
              >
                <TrashIcon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-14 space-y-1">
          <label className="flex items-center gap-1 text-[12px] text-ink-muted">
            圖示
            <InfoHint label="圖示說明">貼上一個 emoji 即可。</InfoHint>
          </label>
          <TextInput
            value={emoji}
            maxLength={4}
            aria-label="圖示"
            className="h-10 px-2 text-center text-lg"
            onChange={(event) => setEmoji(event.target.value)}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <label className="text-[12px] text-ink-muted">名稱</label>
          <TextInput
            value={title}
            placeholder="例如：早晨伸展"
            maxLength={30}
            className="h-10"
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
          />
        </div>
        <div className="w-20 space-y-1">
          <label className="text-[12px] text-ink-muted">分鐘</label>
          <TextInput
            value={minutes}
            inputMode="numeric"
            className="h-10"
            onChange={(event) => setMinutes(event.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </div>
        <Button
          size="sm"
          variant="secondary"
          aria-label="加入項目"
          className="size-10 shrink-0 px-0"
          onClick={add}
        >
          <PlusIcon className="size-5" />
        </Button>
      </div>

      <Button className="w-full" disabled={tasks.length === 0} onClick={onStart}>
        開始專注
      </Button>
    </div>
  );
}
