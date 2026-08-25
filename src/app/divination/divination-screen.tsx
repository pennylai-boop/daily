"use client";

import { Fragment, useEffect, useRef, useState, type KeyboardEvent } from "react";

import { CreditPackGrid } from "@/components/credit-pack-card";
import { VoiceInputButton } from "@/components/voice-input-button";
import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { Card, Chip, PageHeading, SectionHeading, TextLink } from "@/components/ui/surfaces";
import { startCreditCheckout } from "@/lib/credit-checkout";
import { formatFullDate, toIsoDate } from "@/lib/date";
import type { CreditPack } from "@/lib/divination-credits";
import { FREE_INTERVAL_MONTHS, quotaStatus, type QuotaStatus } from "@/lib/divination-quota";
import {
  castHexagram,
  HEXAGRAM_LINE_COUNT,
  HEXAGRAM_NUMBER_COUNT,
  randomHexagramNumbers,
  type HexagramResult,
} from "@/lib/hexagram";
import { useDailyStore } from "@/lib/store";
import type { DivinationRecord } from "@/lib/types";

import { HexagramFigure, HexagramLines } from "./hexagram-lines";

const NUMBER_GROUPS = [
  { start: 0, label: "上卦" },
  { start: 3, label: "下卦" },
  { start: 6, label: "動爻" },
] as const;

const STAGES = [
  { id: "intro", label: "先讀懂" },
  { id: "question", label: "想問的事" },
  { id: "numbers", label: "起卦" },
] as const;

type Stage = (typeof STAGES)[number]["id"] | "casting" | "result";

/** 起卦動畫：六爻由下往上一爻一爻浮出來，六爻畫完才切到結果。 */
const REVEAL_STEP_MS = 190;
const MIN_CASTING_MS = REVEAL_STEP_MS * (HEXAGRAM_LINE_COUNT + 1);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** 接回點數的重試：Notify 常比前景返回晚一點到。 */
const CLAIM_RETRY_MS = 2000;
const CLAIM_MAX_ATTEMPTS = 6;

/**
 * 讀出付款返回帶的訂單編號，並順手把它從網址移掉——重整就不會再領一次。
 *
 * 這裡直接讀 `window.location` 而不用 `useSearchParams`：卜卦頁是靜態產生的，
 * 讀 searchParams 會讓整頁變成動態渲染，而這件事只有瀏覽器需要知道。
 */
function takePaidOrderNo(): string | null {
  const url = new URL(window.location.href);
  const no = url.searchParams.get("paid");
  if (!no) return null;

  url.searchParams.delete("paid");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  return no;
}

const QUESTION_EXAMPLES = [
  "這個月換工作是好時機嗎？",
  "該不該把心裡的話跟他說開？",
  "接下來三個月，我該把力氣放在哪裡？",
];

export function DivinationScreen({ paymentReady }: { paymentReady: boolean }) {
  const { state, ready, commitDivination, setDivinationCredits } = useDailyStore();
  const [stage, setStage] = useState<Stage>("intro");
  const [question, setQuestion] = useState("");
  const [numberText, setNumberText] = useState<string[]>(() => Array(HEXAGRAM_NUMBER_COUNT).fill(""));
  const [pending, setPending] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [castLines, setCastLines] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ hexagram: HexagramResult; analysis: string } | null>(null);
  const [claim, setClaim] = useState<{ failed: boolean; message: string } | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // 從付款頁回來時把剛買的點數接到這台裝置上，使用者才不用先去信箱翻兌換碼。
  useEffect(() => {
    const no = takePaidOrderNo();
    if (!no) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const claimOnce = async (attempt: number) => {
      setClaim({ failed: false, message: "付款完成，正在把點數接回這台裝置…" });
      try {
        const response = await fetch("/api/divination/credits/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ no }),
        });
        if (cancelled) return;

        const data = (await response.json()) as {
          code?: string;
          remaining?: number;
          pending?: boolean;
          error?: string;
        };
        if (cancelled) return;

        if (data.pending && attempt < CLAIM_MAX_ATTEMPTS) {
          timer = setTimeout(() => void claimOnce(attempt + 1), CLAIM_RETRY_MS);
          return;
        }

        if (!response.ok || !data.code || typeof data.remaining !== "number") {
          setClaim({
            failed: true,
            message:
              data.error ??
              "付款完成，但點數還在確認。兌換碼會寄到你的信箱，稍後可以到卜卦點數頁輸入接回來。",
          });
          return;
        }

        setDivinationCredits(data.code, data.remaining);
        setClaim({ failed: false, message: `付款完成，已經接上 ${data.remaining} 點。` });
      } catch {
        if (!cancelled) {
          setClaim({
            failed: true,
            message: "付款完成，但連線中斷了。兌換碼會寄到你的信箱，可以到卜卦點數頁輸入接回來。",
          });
        }
      }
    };

    void claimOnce(1);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [setDivinationCredits]);

  // 起卦時一爻一爻浮出來。進入 casting 前才把 revealed 歸零，effect 只負責往上加。
  useEffect(() => {
    if (stage !== "casting") return;
    const timer = setInterval(() => {
      setRevealed((current) => Math.min(HEXAGRAM_LINE_COUNT, current + 1));
    }, REVEAL_STEP_MS);
    return () => clearInterval(timer);
  }, [stage]);

  const focusInput = (index: number) => {
    inputsRef.current[Math.min(Math.max(index, 0), HEXAGRAM_NUMBER_COUNT - 1)]?.focus();
  };

  const setNumberAt = (index: number, value: string) => {
    // 貼上一整串數字時，從這一格開始往後填滿。
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setNumberText((current) => current.map((v, i) => (i === index ? "" : v)));
      return;
    }
    setNumberText((current) =>
      current.map((v, i) => (i >= index && i < index + digits.length ? digits[i - index] : v)),
    );
    focusInput(index + digits.length);
  };

  const onNumberKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !numberText[index]) {
      event.preventDefault();
      setNumberText((current) => current.map((v, i) => (i === index - 1 ? "" : v)));
      focusInput(index - 1);
    }
  };

  const restart = () => {
    setQuestion("");
    setNumberText(Array(HEXAGRAM_NUMBER_COUNT).fill(""));
    setResult(null);
    setError(null);
    setRevealed(0);
    setStage("question");
  };

  const cast = async () => {
    setError(null);

    // 正常流程走不到這裡（說明頁就攔住了），但別讓額度用完還打得到 API。
    const quota = quotaStatus(state.divination);
    if (quota.kind === "locked") {
      setError("這一輪的免費卜卦已經用過了。");
      return;
    }

    const numbers = numberText.map((text) => Number(text));
    if (numberText.some((text) => !text) || numbers.some((n) => !Number.isInteger(n) || n <= 0)) {
      setError("每一格都要填 1～9 的數字，或按「隨機產生」。");
      return;
    }

    // 起卦的算法前後端是同一份，先在本機算一次，動畫畫的就是真正的那一卦。
    let lines: number[];
    try {
      lines = castHexagram(numbers).lines;
    } catch {
      setError("起卦失敗，請確認輸入的數字。");
      return;
    }

    setPending(true);
    setRevealed(0);
    setCastLines(lines);
    setStage("casting");

    try {
      const [response] = await Promise.all([
        fetch("/api/divination", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.trim(),
            numbers,
            // 有帶碼就是要用點數，扣款由伺服器做。
            ...(quota.kind === "credit" ? { redeemCode: quota.code } : {}),
          }),
        }),
        // 動畫還沒跑完就換頁會看不出在做什麼，等它畫完六爻再切。
        new Promise((resolve) => setTimeout(resolve, MIN_CASTING_MS)),
      ]);

      const data = (await response.json()) as {
        hexagram?: HexagramResult;
        analysis?: string;
        creditsRemaining?: number;
        error?: string;
      };

      if (!response.ok || !data.hexagram || !data.analysis) {
        setError(data.error ?? "起卦失敗，請稍後再試。");
        setStage("numbers");
        return;
      }

      commitDivination(
        {
          question: question.trim(),
          numbers,
          hexagramName: data.hexagram.hexagramName,
          changedHexagramName: data.hexagram.changedHexagramName,
          movingLine: data.hexagram.movingLine,
          analysis: data.analysis,
        },
        quota.kind === "credit"
          ? { with: "credit", remaining: data.creditsRemaining ?? Math.max(0, quota.credits - 1) }
          : { with: "free" },
      );

      setResult({ hexagram: data.hexagram, analysis: data.analysis });
      setStage("result");
    } catch {
      setError("連線失敗，請確認網路後再試一次。");
      setStage("numbers");
    } finally {
      setPending(false);
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy>
        <div className="h-8 w-32 rounded-lg bg-paper-tint" />
        <div className="h-64 rounded-xl bg-paper-tint" />
      </div>
    );
  }

  const status = quotaStatus(state.divination);
  const records = state.divination.history;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeading title="數字卜卦" description={<AboutDivination />} />

      {claim ? (
        <p
          className={cn(
            "rounded-lg px-3.5 py-3 text-[13px] leading-relaxed",
            claim.failed ? "bg-surface-muted text-ink-muted" : "bg-brand-tint/40 text-ink",
          )}
        >
          {claim.message}
        </p>
      ) : null}

      {stage !== "result" ? <StageSteps stage={stage} /> : null}

      {stage === "intro" ? (
        <IntroStage
          status={status}
          records={records}
          paymentReady={paymentReady}
          onStart={() => setStage("question")}
        />
      ) : null}

      {stage === "question" ? (
        <QuestionStage
          question={question}
          onQuestionChange={setQuestion}
          onBack={() => setStage("intro")}
          onNext={() => setStage("numbers")}
        />
      ) : null}

      {stage === "numbers" || stage === "casting" ? (
        <Card className="px-4 py-4 sm:px-5">
          {stage === "casting" ? (
            <CastingStage lines={castLines} revealed={revealed} />
          ) : (
            <div className="space-y-4">
              <SectionHeading
                title="起卦"
                description="數字沒有好壞，只是把此刻定下來。想到什麼填什麼，沒有靈感就按隨機產生。"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNumberText(randomHexagramNumbers().map(String))}
                  >
                    隨機產生
                  </Button>
                }
              />

              {/* 三個一組、中間用破折號隔開，對應上卦／下卦／動爻。 */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {NUMBER_GROUPS.map(({ start, label }) => (
                  <Fragment key={start}>
                    {start > 0 ? (
                      <span aria-hidden className="shrink-0 text-ink-subtle">
                        –
                      </span>
                    ) : null}
                    <div className="flex min-w-0 flex-1 gap-1 sm:gap-2">
                      {numberText.slice(start, start + 3).map((value, offset) => {
                        const index = start + offset;
                        return (
                          <TextInput
                            key={index}
                            ref={(element) => {
                              inputsRef.current[index] = element;
                            }}
                            value={value}
                            inputMode="numeric"
                            placeholder="—"
                            aria-label={`${label}第 ${offset + 1} 個數字`}
                            onChange={(event) => setNumberAt(index, event.target.value)}
                            onKeyDown={(event) => onNumberKeyDown(index, event)}
                            onFocus={(event) => event.target.select()}
                            className="min-w-0 flex-1 px-0 text-center"
                          />
                        );
                      })}
                    </div>
                  </Fragment>
                ))}
              </div>

              {error ? <p className="text-[13px] font-semibold text-alert">{error}</p> : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={() => setStage("question")} disabled={pending}>
                  上一步
                </Button>
                <Button onClick={cast} disabled={pending}>
                  開始起卦
                </Button>
                <span className="text-[13px] text-ink-subtle">
                  {status.kind === "free"
                    ? "這一次用免費額度"
                    : status.kind === "credit"
                      ? `這一次用 1 點（剩 ${status.credits} 點）`
                      : ""}
                </span>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {stage === "result" && result ? (
        <ResultStage
          hexagram={result.hexagram}
          analysis={result.analysis}
          status={status}
          onAskAgain={restart}
        />
      ) : null}
    </div>
  );
}

function AboutDivination() {
  return (
    <span className="block space-y-2">
      <span className="block">
        出自宋代邵雍的《梅花易數》：把數字換算成《易經》的六十四卦，看一件事現在的處境（本卦）
        和接下來可能的轉向（變卦）。
      </span>
      <span className="block">
        《易經》講的是「變」：舊的東西再好，也會慢慢被放掉；新的東西再生澀，還是會走成主流。
        卦看的是你正站在哪一段變化裡。
      </span>
      <span className="block">適合問短期、具體、一次一件的事。</span>
    </span>
  );
}

function StageSteps({ stage }: { stage: Stage }) {
  const activeIndex = STAGES.findIndex((item) => item.id === stage);
  // casting 還在起卦這一步。
  const current = activeIndex === -1 ? STAGES.length - 1 : activeIndex;

  return (
    <ol className="flex items-center gap-2 text-[13px]">
      {STAGES.map((item, index) => (
        <Fragment key={item.id}>
          {index > 0 ? <span aria-hidden className="h-px w-4 shrink-0 bg-line-strong" /> : null}
          <li
            aria-current={index === current ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-1.5",
              index === current ? "text-ink" : "text-ink-subtle",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                index === current
                  ? "bg-brand text-on-brand"
                  : index < current
                    ? "bg-surface-muted text-ink-muted"
                    : "border border-line-strong text-ink-subtle",
              )}
            >
              {index + 1}
            </span>
            <span className="truncate">{item.label}</span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

const INTRO_POINTS = [
  {
    emoji: "🧭",
    title: "卦不幫你決定",
    body: "糾結的時候，人不缺想法，缺的是一個可以靠著想的東西。卦給你一個角度，讓心裡反覆的念頭有地方落下來。",
  },
  {
    emoji: "🌗",
    title: "算的是此刻的天時地利人和",
    body: "你現在的處境、心境，還有身邊的人與事。這些都會變，所以一卦大約看接下來三個月，不是長久的保證。",
  },
  {
    emoji: "🌱",
    title: "結果不好也不是判決",
    body: "真的很想做的事，卦象不理想不代表不能做。等三個月後天時地利人和換過一輪，可以再來問一次。",
  },
];

/** 傳統的「三不占」。這裡不用 emoji，跟上面那張讀起來才有分別。 */
const THREE_NO_CASTS = [
  {
    title: "不誠不占",
    body: "抱著「試試看準不準」的心問，卦回你的就是那份試探。真的想知道再問。",
  },
  {
    title: "不義不占",
    body: "要佔人便宜、走捷徑、損人利己的事就別問。卦不會幫你把不該做的事說成該做。",
  },
  {
    title: "不疑不占",
    body: "心裡其實已經有答案，或同一件事問過了，就不必再問。反覆問到滿意為止，等於沒問。",
  },
];

const PRACTICE_POINTS = [
  {
    title: "情緒最滿的時候先別問",
    body: "期待和得失心會蓋在卦上，你只會讀到自己想聽的那一面。等稍微靜下來再起卦。",
  },
  {
    title: "記下來，事後回頭對照",
    body: "每次起的卦都會留在紀錄裡。把卦象、你當時的解讀、後來真正發生的事擺在一起看，讀卦才會越來越貼。",
  },
  {
    title: "也可以當成每天的練習",
    body: "不為問事，只問「今天我能從這一卦學到什麼」，把它當一天的提醒。",
  },
];

/** intro 的說明卡共用的條列：有 emoji 就掛在左邊，沒有就純標題加說明。 */
function PointList({
  items,
}: {
  items: readonly { emoji?: string; title: string; body: string }[];
}) {
  return (
    <ul className="mt-4 space-y-3.5">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3">
          {item.emoji ? (
            <span aria-hidden className="mt-0.5 shrink-0 text-xl leading-none">
              {item.emoji}
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function IntroStage({
  status,
  records,
  paymentReady,
  onStart,
}: {
  status: QuotaStatus;
  records: DivinationRecord[];
  paymentReady: boolean;
  onStart: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="卜卦之前，先讀懂這三件事" />
        <PointList items={INTRO_POINTS} />
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="卜卦的三不占" />
        <PointList items={THREE_NO_CASTS} />
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="怎麼問，卦才有參考價值" />
        <PointList items={PRACTICE_POINTS} />
        <p className="mt-4 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-muted">
          卦不是拜出來的答案。事情會不一樣，靠的是你回頭調整自己的那一部分——沒有改變，好結果也留不住。
        </p>
      </Card>

      {/* 開始鈕排在說明卡之後：讀完才動手，是這一步存在的理由。 */}
      <Card className="px-4 py-4 sm:px-5">
        {status.kind === "locked" ? (
          <LockedNotice status={status} paymentReady={paymentReady} />
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onStart}>我了解了，開始卜卦</Button>
            <span className="text-[13px] text-ink-subtle">
              {status.kind === "free"
                ? `這一輪還有 1 次免費卜卦（每 ${FREE_INTERVAL_MONTHS} 個月一次）`
                : `免費額度下次是 ${formatFullDate(toIsoDate(status.nextFreeAt))}，這次用 1 點（剩 ${status.credits} 點）`}
            </span>
          </div>
        )}
      </Card>

      {records.length > 0 ? <HistoryTable records={records} /> : null}
    </div>
  );
}

/**
 * 免費額度用完時的畫面：直接把五檔方案排在這裡，填信箱、選一檔就走去付款頁，
 * 不用先繞到儲值頁。發票預設雲端（寄信箱、不需載具），其他形式與兌換碼還是在儲值頁處理。
 */
function LockedNotice({
  status,
  paymentReady,
}: {
  status: Extract<QuotaStatus, { kind: "locked" }>;
  paymentReady: boolean;
}) {
  const [email, setEmail] = useState("");
  const [pendingPack, setPendingPack] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const buy = async (pack: CreditPack) => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setNotice("請先填信箱，兌換碼和發票會寄到這裡。");
      emailRef.current?.focus();
      return;
    }

    setNotice(null);
    setPendingPack(pack.id);
    const failure = await startCreditCheckout({ packId: pack.id, email });
    if (failure) {
      setNotice(failure.error);
      setPendingPack(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-surface-muted/60 px-3.5 py-3">
        <p className="text-sm font-semibold text-ink">這一輪的免費卜卦已經用過了</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
          下一次免費是 {formatFullDate(toIsoDate(status.nextFreeAt))}。
          剛才那一卦看的就是這段時間，天時地利人和還沒換，急著再問通常只會問到同一個答案。
        </p>
      </div>

      {!paymentReady ? (
        <p className="text-[13px] text-ink-subtle">金流尚未設定，暫時無法儲值。</p>
      ) : (
        <div className="space-y-3">
          <SectionHeading title="用點數再問一次" description="一點卜一次，點數沒有期限。" />

          <div className="max-w-xs">
            <Field label="信箱" htmlFor="locked-credits-email">
              <TextInput
                id="locked-credits-email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setNotice(null);
                }}
                placeholder="you@example.com"
                inputMode="email"
                autoComplete="email"
              />
            </Field>
          </div>

          <CreditPackGrid pendingPackId={pendingPack} onBuy={(pack) => void buy(pack)} />

          {notice ? <p className="text-[13px] font-semibold text-alert">{notice}</p> : null}

          <p className="text-[13px] leading-relaxed text-ink-subtle">
            這裡走信用卡，付款完成後點數直接接回這台裝置，兌換碼與雲端發票另外寄到信箱。
            要用 ATM／超商，或發票需要手機條碼、統編、捐贈，或想把之前買的兌換碼接回來，
            請到 <TextLink href="/divination/credits">卜卦點數</TextLink>。
          </p>
        </div>
      )}
    </div>
  );
}

/** 表格欄位要窄，用 2026/8/25 而不是「2026 年 8 月 25 日 星期二」。 */
function tableDate(createdAt: string): string {
  const date = new Date(createdAt);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function matchesKeyword(record: DivinationRecord, keyword: string): boolean {
  return [record.question, record.hexagramName, record.changedHexagramName, record.note, record.analysis]
    .join("\n")
    .toLowerCase()
    .includes(keyword);
}

/**
 * 過去的卦一覽。卦象與解讀是當時起出來的結果，一律唯讀；只有附註是使用者自己的欄位，
 * 「事後回頭對照」要靠它才做得到（見卜卦說明的第二點）。
 */
function HistoryTable({ records }: { records: DivinationRecord[] }) {
  const { setDivinationNote } = useDailyStore();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const keyword = query.trim().toLowerCase();
  const filtered = keyword ? records.filter((record) => matchesKeyword(record, keyword)) : records;

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="卜卦紀錄"
        description="卦象與解讀不能修改。附註是留給你自己的：當時怎麼讀、後來實際怎麼發展。"
      />

      <div className="mt-3 max-w-xs">
        <TextInput
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜尋問題、卦名或附註"
          aria-label="搜尋卜卦紀錄"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-[13px] text-ink-subtle">
          {keyword ? `沒有符合「${query.trim()}」的紀錄。` : "還沒有卜過卦。"}
        </p>
      ) : (
        // 五欄在手機上塞不下，橫向捲動比硬擠或砍欄位好。
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[540px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-muted">
                <th scope="col" className="py-2 pr-3 font-medium">
                  日期
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  問的事
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  卦象
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  附註
                </th>
                <th scope="col" className="py-2">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => {
                const open = openId === record.id;
                return (
                  <Fragment key={record.id}>
                    <tr className="border-b border-line/70">
                      <td className="py-2 pr-3 align-top whitespace-nowrap tabular-nums text-ink-muted">
                        {tableDate(record.createdAt)}
                      </td>
                      <th scope="row" className="py-2 pr-3 text-left align-top font-medium text-ink">
                        <span className="line-clamp-2">
                          {record.question || "（沒有寫下問題）"}
                        </span>
                      </th>
                      <td className="py-2 pr-3 align-top whitespace-nowrap text-ink-muted">
                        {record.hexagramName} → {record.changedHexagramName}
                      </td>
                      <td className="py-2 pr-3 align-top text-ink-subtle">
                        <span className="line-clamp-2">{record.note || "—"}</span>
                      </td>
                      <td className="py-2 align-top text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-expanded={open}
                          onClick={() => setOpenId(open ? null : record.id)}
                        >
                          {open ? "收起" : "展開"}
                        </Button>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-b border-line/70 bg-surface-muted/40">
                        <td colSpan={5} className="py-3">
                          <RecordDetail
                            record={record}
                            onSaveNote={(note) => setDivinationNote(record.id, note)}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function RecordDetail({
  record,
  onSaveNote,
}: {
  record: DivinationRecord;
  onSaveNote: (note: string) => void;
}) {
  const [draft, setDraft] = useState(record.note);
  const dirty = draft !== record.note;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink">{record.question || "（沒有寫下問題）"}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-subtle">
          <span>{formatFullDate(toIsoDate(new Date(record.createdAt)))}</span>
          <span>·</span>
          <span>動爻第 {record.movingLine} 爻</span>
          <span>·</span>
          <span>{record.paidWith === "free" ? "免費額度" : "用 1 點"}</span>
        </p>
      </div>

      <p className="prose-zh whitespace-pre-wrap border-t border-line pt-3 text-sm leading-relaxed text-ink">
        {record.analysis}
      </p>

      <div className="space-y-2 border-t border-line pt-3">
        <Field label="我的附註" htmlFor={`note-${record.id}`}>
          <TextArea
            id={`note-${record.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="當時我怎麼讀這一卦、後來實際發生了什麼"
            rows={3}
            maxLength={500}
          />
        </Field>
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={!dirty} onClick={() => onSaveNote(draft)}>
            儲存附註
          </Button>
          {dirty ? (
            <span className="text-[13px] text-ink-subtle">還沒儲存</span>
          ) : record.note ? (
            <span className="text-[13px] text-ink-subtle">已儲存</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuestionStage({
  question,
  onQuestionChange,
  onBack,
  onNext,
}: {
  question: string;
  onQuestionChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const appendSpoken = (text: string) => {
    onQuestionChange((question + text).slice(0, 200));
  };

  return (
    <Card className="px-4 py-4 sm:px-5">
      <div className="space-y-4">
        <Field label="想問的事">
          {/* 麥克風疊在右上角，textarea 右邊留出 pr-11 讓文字不會跑到圖示底下。 */}
          <div className="relative">
            <TextArea
              value={question}
              onChange={(event) => onQuestionChange(event.target.value)}
              placeholder="例如：這個月換工作是好時機嗎？"
              rows={3}
              maxLength={200}
              className="pr-11"
            />
            <VoiceInputButton onResult={appendSpoken} className="absolute top-1 right-1" />
          </div>
        </Field>

        <div className="space-y-2">
          <p className="text-[13px] text-ink-subtle">沒想好怎麼問？可以從這幾個開始改：</p>
          <div className="flex flex-wrap gap-2">
            {QUESTION_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onQuestionChange(example)}
                className="min-h-9 rounded-lg border border-line-strong px-2.5 text-[13px] text-ink-muted transition-colors hover:border-ink-subtle hover:text-ink"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onBack}>
            上一步
          </Button>
          <Button onClick={onNext} disabled={!question.trim()}>
            下一步：起卦
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CastingStage({ lines, revealed }: { lines: readonly number[]; revealed: number }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <HexagramLines lines={lines} revealed={revealed} className="w-32" />
      <p className="text-sm text-ink-muted">起卦中…</p>
      <p className="max-w-xs text-center text-[13px] leading-relaxed text-ink-subtle">
        六爻由下往上成形，接著請 AI 對照本卦與變卦。
      </p>
    </div>
  );
}

function ResultStage({
  hexagram,
  analysis,
  status,
  onAskAgain,
}: {
  hexagram: HexagramResult;
  analysis: string;
  status: QuotaStatus;
  onAskAgain: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="px-4 py-5 sm:px-5">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          <HexagramFigure
            name={hexagram.hexagramName}
            caption={`上卦 ${hexagram.upperTrigram.name}・下卦 ${hexagram.lowerTrigram.name}`}
            lines={hexagram.lines}
            movingLine={hexagram.movingLine}
          />
          <div className="flex flex-col items-center gap-1 text-ink-subtle">
            <span aria-hidden className="text-lg">
              →
            </span>
            <Chip>動爻 第 {hexagram.movingLine} 爻</Chip>
          </div>
          <HexagramFigure
            name={hexagram.changedHexagramName}
            caption={`上卦 ${hexagram.changedUpperTrigram.name}・下卦 ${hexagram.changedLowerTrigram.name}`}
            lines={hexagram.changedLines}
          />
        </div>

        <p className="prose-zh mt-5 whitespace-pre-wrap border-t border-line pt-4 text-sm leading-relaxed text-ink">
          {analysis}
        </p>
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <p className="text-[13px] leading-relaxed text-ink-muted">
          這一卦看的是接下來大約 {FREE_INTERVAL_MONTHS} 個月。真的想做的事，卦象不理想也不是不能做；
          等這段時間過去，天時地利人和換過一輪，可以再問一次。想把它留下來的話，
          到<TextLink href="/">日曆</TextLink>寫進今天的紀錄裡。
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {status.kind === "locked" ? (
            <>
              <span className="text-[13px] text-ink-subtle">
                下一次免費卜卦：{formatFullDate(toIsoDate(status.nextFreeAt))}
              </span>
              <LinkButton variant="ghost" href="/divination/credits">
                用點數再問一次
              </LinkButton>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={onAskAgain}>
                再問一件事
              </Button>
              <span className="text-[13px] text-ink-subtle">
                {status.kind === "free" ? "這一輪的免費額度還在" : `還有 ${status.credits} 點`}
              </span>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
