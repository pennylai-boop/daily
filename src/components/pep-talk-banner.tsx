"use client";

import { useSyncExternalStore } from "react";

import { randomPepTalk } from "@/lib/pep-talk";

/** 每則停留的時間。 */
const HOLD_MS = 10_000;

/**
 * 目前這一則放在模組層，用 `useSyncExternalStore` 訂閱。
 *
 * 伺服器端快照回傳 null（還沒抽），瀏覽器 hydration 完成後才抽第一則，
 * 否則兩邊各抽一次一定會抽到不同句子，造成 hydration 落差。
 * 這也是 store.ts、platform.ts 用的同一套做法。
 */
let current: string | null = null;
const listeners = new Set<() => void>();
let timer: number | undefined;

function emit() {
  for (const listener of listeners) listener();
}

function rotate() {
  current = randomPepTalk(current);
  emit();
}

function schedule() {
  window.clearInterval(timer);
  timer = window.setInterval(rotate, HOLD_MS);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (current === null) rotate();
    schedule();
  }

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

/**
 * 畫面正上方的打氣小語，每十秒隨機換一則，也可以點一下立刻換。
 *
 * 沒有 aria-live：這是陪襯的句子，每十秒念一次只會干擾螢幕閱讀器的使用者。
 */
export function PepTalkBanner() {
  const text = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    // 固定最小高度：句子還沒抽出來時不會撐開版面，換句時也不會跳動。
    <div className="flex min-h-10 items-center justify-center">
      {text ? (
        <button
          type="button"
          aria-label="換一則打氣小語"
          onClick={() => {
            rotate();
            schedule();
          }}
          className="max-w-full rounded-full bg-brand-tint px-4 py-1.5 transition-colors hover:bg-brand-tint/70"
        >
          {/* key 換掉就重新播放淡入動畫，不用自己管淡出淡入的計時器。 */}
          <span
            key={text}
            className="pep-fade-in flex items-center gap-2 text-[13px] font-medium text-brand-strong"
          >
            <span aria-hidden>☀</span>
            <span className="truncate">{text}</span>
          </span>
        </button>
      ) : null}
    </div>
  );
}
