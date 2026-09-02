"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { focusRemainingSeconds, isFocusRunning } from "@/lib/focus";
import { nativeLockApps, nativeUnlockApps } from "@/lib/native-bridge";
import { formatDuration } from "@/lib/templates";
import { finishFocusSession, settleExpiredFocus, useDailyStore } from "@/lib/store";

/**
 * 專心進行中蓋住整個 App。
 * 瀏覽器／WebView 沒有權限關掉其他 App；全螢幕與原生殼的 lockApps 能做到的會在這裡試。
 */
export function FocusLock() {
  const { state, ready } = useDailyStore();
  const [, setTick] = useState(0);
  const focus = state.focus ?? {
    pomodoroMinutes: 25,
    runningStartedAt: null,
    runningPlannedMinutes: 25,
    sessions: [],
  };
  const running = ready && isFocusRunning(focus);
  const remaining = ready ? focusRemainingSeconds(focus) : 0;
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const focusRef = useRef(focus);
  focusRef.current = focus;

  useEffect(() => {
    if (ready) settleExpiredFocus();
  }, [ready]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      if (focusRemainingSeconds(focusRef.current) <= 0) {
        finishFocusSession(true);
        void notifyDone();
        void releaseLock(wakeLock);
        return;
      }
      setTick((value) => value + 1);
    }, 250);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running) {
      void releaseLock(wakeLock);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    void enterLock(wakeLock);

    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [running]);

  if (!running) return null;

  const planned = focus.runningPlannedMinutes;
  const cap = planned * 60;
  const progress = cap > 0 ? 1 - remaining / cap : 0;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-paper px-6 pt-[calc(env(safe-area-inset-top,0px)+32px)] pb-[calc(env(safe-area-inset-bottom,0px)+24px)]"
      role="dialog"
      aria-modal="true"
      aria-label="專心模式進行中"
    >
      <p className="text-center text-[13px] tracking-wide text-ink-subtle">專心模式</p>
      <p className="mt-2 text-center text-sm text-ink-muted">{planned} 分鐘番茄鐘</p>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative flex size-56 items-center justify-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r="52" className="fill-none stroke-[var(--line)]" strokeWidth="6" />
            <circle
              cx="60"
              cy="60"
              r="52"
              className="fill-none stroke-[var(--brand)]"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress)}`}
            />
          </svg>
          <p className="text-5xl font-semibold tabular-nums tracking-tight text-ink">
            {formatDuration(remaining)}
          </p>
        </div>
        <p className="max-w-xs text-center text-[13px] leading-relaxed text-ink-muted">
          天天 daily 已鎖定。網頁沒辦法關掉手機上的其他 App；iPhone 可連按側鍵三次開啟「引導使用」，Android 可用「鎖定這個應用程式」。
        </p>
      </div>

      <Button
        variant="secondary"
        className="mx-auto"
        onClick={() => {
          if (!window.confirm("現在結束？已過的時間仍會記進工作時長。")) return;
          finishFocusSession(false);
          void releaseLock(wakeLock);
        }}
      >
        結束專心
      </Button>
    </div>
  );
}

async function enterLock(wakeLock: { current: WakeLockSentinel | null }) {
  void nativeLockApps();
  try {
    await document.documentElement.requestFullscreen?.();
  } catch {
    // 使用者拒絕全螢幕，或這個環境不支援。
  }
  try {
    if (navigator.wakeLock) wakeLock.current = await navigator.wakeLock.request("screen");
  } catch {
    // 省電模式或不支援時就算了。
  }
}

async function releaseLock(wakeLock: { current: WakeLockSentinel | null }) {
  void nativeUnlockApps();
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    // 已經不在全螢幕。
  }
  try {
    await wakeLock.current?.release();
  } catch {
    // 已被系統釋放。
  }
  wakeLock.current = null;
}

async function notifyDone() {
  try {
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextCtor) {
      const ctx = new AudioContextCtor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // 靜音環境就不用出聲。
  }

  if (!("Notification" in window)) return;
  if (Notification.permission === "default") await Notification.requestPermission();
  if (Notification.permission === "granted") {
    new Notification("專心時間到了", { body: "這一顆番茄鐘已記進工作時長。" });
  }
}
