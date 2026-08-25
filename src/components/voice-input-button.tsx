"use client";

import { useRef, useState, useSyncExternalStore } from "react";

import { MicIcon } from "@/components/icons";
import { cn } from "@/components/ui/cn";
import { speechSupported, startListening, type SpeechSession } from "@/lib/speech";

const noopSubscribe = () => () => {};

/**
 * 語音輸入鈕。按一下開始聽、再按一下停止，聽到的定稿透過 `onResult` 交給呼叫端。
 *
 * 只有一顆麥克風圖示，設計上是疊在輸入框的角落，位置交給呼叫端用 `className` 決定
 * （所以這裡不自己設 absolute）。聽的過程與錯誤用圖示左邊的小標籤回報。
 *
 * 瀏覽器不支援時整顆按鈕不出現：留一顆按了沒反應的鈕比沒有更糟。
 * 支援與否只有客戶端知道，用 `useSyncExternalStore` 讀取以避免 hydration 落差。
 */
export function VoiceInputButton({
  onResult,
  className,
}: {
  onResult: (text: string) => void;
  className?: string;
}) {
  const supported = useSyncExternalStore(noopSubscribe, speechSupported, () => false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<SpeechSession | null>(null);

  if (!supported) return null;

  const stop = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setListening(false);
    setInterim("");
  };

  const start = () => {
    setError(null);
    setInterim("");
    const session = startListening({
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          onResult(text);
          setInterim("");
        } else {
          setInterim(text);
        }
      },
      onError: (reason) => {
        setError(reason);
        stop();
      },
      onEnd: () => {
        sessionRef.current = null;
        setListening(false);
        setInterim("");
      },
    });

    if (!session) return;
    sessionRef.current = session;
    setListening(true);
  };

  // 沒說話之前先給「聽你說…」，不然按下去只有圖示變色，看不出有沒有在收音。
  const status = error ?? (listening ? interim || "聽你說…" : null);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {status ? (
        <span
          className={cn(
            "max-w-40 truncate rounded-md bg-surface px-1.5 py-0.5 text-xs",
            error ? "text-alert" : "text-ink-subtle",
          )}
        >
          {status}
        </span>
      ) : null}
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-label={listening ? "停止語音輸入" : "用語音輸入"}
        aria-pressed={listening}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
          listening
            ? "bg-brand-tint text-brand"
            : "text-ink-subtle hover:bg-surface-muted hover:text-ink",
        )}
      >
        <MicIcon className={cn("size-[18px]", listening && "animate-pulse")} />
      </button>
    </div>
  );
}
