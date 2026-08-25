"use client";

import { useRef, useState, useSyncExternalStore } from "react";

import { MicIcon } from "@/components/icons";
import { cn } from "@/components/ui/cn";
import { speechSupported, startListening, type SpeechSession } from "@/lib/speech";

const noopSubscribe = () => () => {};

/**
 * 語音輸入鈕。按一下開始聽、再按一下停止，聽到的定稿透過 `onResult` 交給呼叫端。
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

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-label={listening ? "停止語音輸入" : "用語音輸入"}
        aria-pressed={listening}
        className={cn(
          "flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] transition-colors",
          listening
            ? "border-brand bg-brand-tint text-brand"
            : "border-line-strong text-ink-muted hover:border-ink-subtle hover:text-ink",
        )}
      >
        <MicIcon className={cn("size-4", listening && "animate-pulse")} />
        {listening ? "聽你說…" : "語音輸入"}
      </button>
      {interim ? (
        <p className="min-w-0 flex-1 truncate text-[13px] text-ink-subtle">{interim}</p>
      ) : error ? (
        <p className="min-w-0 flex-1 text-[13px] text-alert">{error}</p>
      ) : null}
    </div>
  );
}
