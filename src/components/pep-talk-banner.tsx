"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { randomPepTalk, resolvePepTalks } from "@/lib/pep-talk";
import { setPepTalkVisible, useDailyStore } from "@/lib/store";

/** 每則停留／輪播的時間（跑馬燈會在這段時間內循環捲動）。 */
const HOLD_MS = 18_000;

/**
 * 目前這一則放在模組層，用 `useSyncExternalStore` 訂閱。
 *
 * 伺服器端快照回傳 null（還沒抽），瀏覽器 hydration 完成後才抽第一則，
 * 否則兩邊各抽一次一定會抽到不同句子，造成 hydration 落差。
 */
let current: string | null = null;
const listeners = new Set<() => void>();
let timer: number | undefined;
let poolKey = "";
/** 給 interval / 點擊換句用的最新清單，只在 effect 裡更新。 */
let activePool: readonly string[] = [];

function emit() {
  for (const listener of listeners) listener();
}

function rotate(pool: readonly string[]) {
  current = randomPepTalk(pool, current);
  emit();
}

function schedule(pool: readonly string[]) {
  window.clearInterval(timer);
  if (pool.length === 0) return;
  timer = window.setInterval(() => rotate(activePool), HOLD_MS);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot(): string | null {
  return current;
}

function getServerSnapshot(): string | null {
  return null;
}

/** 依字數估跑馬燈一圈時間，短句慢一點、長句快一點，至少 12 秒。 */
function marqueeDurationSec(text: string): number {
  return Math.max(12, Math.min(36, Math.round(text.length * 0.45)));
}

/**
 * 貼齊畫面正上方的打氣小語彈層（sticky，不額外留上下空隙）。
 * 句子以跑馬燈由右往左撥放；點太陽隱藏；點句子換下一則。
 */
export function PepTalkBanner() {
  const { state, ready } = useDailyStore();
  const text = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const quotes = state.settings.pepTalk.quotes;
  const pool = useMemo(() => resolvePepTalks(quotes), [quotes]);
  const poolSignature = useMemo(() => pool.join("\0"), [pool]);
  const visible = ready && state.settings.pepTalk.visible && pool.length > 0;

  useEffect(() => {
    activePool = pool;

    if (!visible) {
      window.clearInterval(timer);
      timer = undefined;
      return;
    }

    if (current === null || poolSignature !== poolKey || !pool.includes(current)) {
      poolKey = poolSignature;
      rotate(pool);
    }
    schedule(pool);

    return () => {
      window.clearInterval(timer);
      timer = undefined;
    };
  }, [visible, pool, poolSignature]);

  if (!visible || !text) return null;

  const durationSec = marqueeDurationSec(text);

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] w-full border-b border-brand/20 bg-brand-tint pt-[env(safe-area-inset-top,0px)] shadow-[0_2px_10px_rgba(17,24,39,0.06)]"
    >
      <div className="relative flex min-h-10 w-full items-center px-3 py-2 sm:px-4">
        <button
          type="button"
          aria-label="隱藏打氣小語"
          title="隱藏（可在設定重新開啟）"
          onClick={() => setPepTalkVisible(false)}
          className="absolute top-1/2 left-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-lg leading-none text-brand-strong transition-colors hover:bg-brand/15 sm:left-3"
        >
          <span aria-hidden>☀</span>
        </button>

        <button
          type="button"
          aria-label="換一則打氣小語"
          onClick={() => {
            rotate(activePool);
            schedule(activePool);
          }}
          className="pep-marquee-viewport w-full rounded-lg py-0.5 pl-10 transition-colors hover:bg-brand/10 sm:pl-12"
        >
          <span
            key={text}
            className="pep-marquee-track text-[13px] leading-snug font-medium text-brand-strong sm:text-sm"
            style={{ ["--pep-marquee-duration" as string]: `${durationSec}s` }}
          >
            {/* 複製兩份才能無縫銜接：動畫只移半段寬度。 */}
            <span>{text}</span>
            <span aria-hidden>{text}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
