"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { TextInput } from "@/components/ui/field";
import { formatDuration, timerElapsedSeconds } from "@/lib/templates";
import type { EntryBlock, TimerMode } from "@/lib/types";

export function TimerFields({
  block,
  onChange,
}: {
  block: Extract<EntryBlock, { template: "timer" }>;
  onChange: (data: Extract<EntryBlock, { template: "timer" }>["data"]) => void;
}) {
  const [, setTick] = useState(0);
  const data = block.data;
  const running = Boolean(data.runningStartedAt);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const current = data;
      if (current.mode === "pomodoro" && current.runningStartedAt) {
        const elapsed = Math.floor((Date.now() - Date.parse(current.runningStartedAt)) / 1000);
        if (elapsed >= current.pomodoroMinutes * 60) {
          onChangeRef.current({
            ...current,
            totalSeconds: current.totalSeconds + current.pomodoroMinutes * 60,
            pomodoroDone: current.pomodoroDone + 1,
            runningStartedAt: null,
          });
        }
      }
      setTick((value) => value + 1);
    }, 250);
    return () => window.clearInterval(timer);
  }, [running, data]);

  const liveSeconds = timerElapsedSeconds(data);
  const sessionCap = data.pomodoroMinutes * 60;
  const sessionElapsed = data.runningStartedAt
    ? Math.max(0, Math.floor((Date.now() - Date.parse(data.runningStartedAt)) / 1000))
    : 0;
  const remaining = Math.max(0, sessionCap - sessionElapsed);
  const display = data.mode === "pomodoro" && running ? remaining : liveSeconds;

  const setMode = (mode: TimerMode) => {
    if (running) pause();
    onChange({ ...data, mode });
  };

  const start = () => {
    if (running) return;
    onChange({ ...data, runningStartedAt: new Date().toISOString() });
  };

  const pause = () => {
    if (!data.runningStartedAt) return;
    const extra = Math.max(0, Math.floor((Date.now() - Date.parse(data.runningStartedAt)) / 1000));
    if (data.mode === "pomodoro") {
      onChange({
        ...data,
        totalSeconds: data.totalSeconds + Math.min(extra, sessionCap),
        runningStartedAt: null,
      });
      return;
    }
    onChange({ ...data, totalSeconds: data.totalSeconds + extra, runningStartedAt: null });
  };

  const reset = () => {
    onChange({
      ...data,
      totalSeconds: 0,
      runningStartedAt: null,
      pomodoroDone: 0,
    });
  };

  return (
    <div className="space-y-4">
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
            aria-pressed={data.mode === option.id}
            onClick={() => setMode(option.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              data.mode === option.id ? "bg-surface text-accent shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="text-center font-semibold tabular-nums tracking-tight text-ink text-4xl sm:text-5xl">
        {formatDuration(display)}
      </p>
      <p className="text-center text-[13px] text-ink-muted">
        {data.mode === "pomodoro"
          ? running
            ? `倒數中・已完成 ${data.pomodoroDone} 顆`
            : `一顆 ${data.pomodoroMinutes} 分鐘・已完成 ${data.pomodoroDone} 顆`
          : running
            ? "計時中"
            : liveSeconds > 0
              ? "已暫停"
              : "按下開始，像碼表一樣累積時間"}
      </p>

      {data.mode === "pomodoro" && !running ? (
        <label className="flex items-center justify-center gap-2 text-sm text-ink-muted">
          每顆
          <TextInput
            className="w-20 text-center"
            inputMode="numeric"
            value={String(data.pomodoroMinutes)}
            onChange={(event) => {
              const next = Math.max(1, Math.min(180, Number(event.target.value.replace(/\D/g, "")) || 1));
              onChange({ ...data, pomodoroMinutes: next });
            }}
          />
          分鐘
        </label>
      ) : null}

      <div className="flex flex-wrap justify-center gap-2">
        {running ? (
          <Button onClick={pause}>暫停</Button>
        ) : (
          <Button onClick={start}>{liveSeconds > 0 || data.pomodoroDone > 0 ? "繼續" : "開始"}</Button>
        )}
        <Button variant="secondary" onClick={reset} disabled={liveSeconds === 0 && !running && data.pomodoroDone === 0}>
          歸零
        </Button>
      </div>
    </div>
  );
}
