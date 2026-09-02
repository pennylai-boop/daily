"use client";

import { useEffect, useMemo, useState } from "react";

import { resolvePepTalks } from "@/lib/pep-talk";
import { setPepTalkVisible, useDailyStore } from "@/lib/store";

/**
 * 一圈跑馬燈放幾則。
 *
 * 只放一兩句時，寬螢幕會出現整段空白；整份清單（兩百多則）又會讓軌道長到不必要。
 * 取十六則剛好能填滿桌機寬度，每次進站順序也不一樣。
 */
const MARQUEE_QUOTES = 16;

/** 中文字寬接近字級，用字數估算捲動時間就能讓長短句維持同樣速度。 */
const CHARS_PER_SECOND = 2.75;
/** 句與句之間的 4rem 間距，換算成大約幾個字。 */
const GAP_CHARS = 5;

function pickSequence(pool: string[]): string[] {
  if (pool.length === 0) return [];
  const shuffled = [...pool];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled.slice(0, Math.min(MARQUEE_QUOTES, shuffled.length));
}

function marqueeDurationSec(quotes: string[]): number {
  const chars = quotes.reduce((sum, quote) => sum + quote.length + GAP_CHARS, 0);
  return Math.max(60, Math.round(chars / CHARS_PER_SECOND));
}

/**
 * 貼齊畫面正上方的打氣小語彈層（sticky，不額外留上下空隙）。
 *
 * 句子一則接一則由右往左連續播放，不中途換內容，因此不會有重播的閃跳；點太陽隱藏。
 */
export function PepTalkBanner() {
  const { state, ready } = useDailyStore();
  const shared = state.sharedPepTalks;
  const pool = useMemo(() => resolvePepTalks(shared), [shared]);
  const [sequence, setSequence] = useState<string[]>([]);

  useEffect(() => {
    setSequence(pickSequence(pool));
  }, [pool]);

  const visible = ready && state.settings.pepTalk.visible && sequence.length > 0;
  if (!visible) return null;

  const durationSec = marqueeDurationSec(sequence);

  return (
    <div
      aria-label="打氣小語"
      className="sticky top-0 z-[60] w-full border-b border-brand/20 bg-brand-tint pt-[env(safe-area-inset-top,0px)] shadow-[0_2px_10px_rgba(17,24,39,0.06)]"
    >
      {/* 高度綁 --pep-banner-h，側欄才算得出自己扣掉這條之後的可視高度。 */}
      <div className="relative flex h-[var(--pep-banner-h)] w-full items-center px-3 py-2 sm:px-4">
        <button
          type="button"
          aria-label="隱藏打氣小語"
          title="隱藏（可在設定重新開啟）"
          onClick={() => setPepTalkVisible(false)}
          className="absolute top-1/2 left-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-lg leading-none text-brand-strong transition-colors hover:bg-brand/15 sm:left-3"
        >
          <span aria-hidden>☀</span>
        </button>

        <div className="pep-marquee-viewport w-full py-0.5">
          <span
            className="pep-marquee-track text-[13px] leading-snug font-medium text-brand-strong sm:text-sm"
            style={{ ["--pep-marquee-duration" as string]: `${durationSec}s` }}
          >
            {/* 複製兩份才能無縫銜接：動畫只移半段寬度。 */}
            {sequence.map((quote, index) => (
              <span key={index}>{quote}</span>
            ))}
            {sequence.map((quote, index) => (
              <span key={`echo-${index}`} aria-hidden>
                {quote}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
