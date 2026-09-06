"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { MicIcon } from "@/components/icons";
import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { TextArea } from "@/components/ui/field";
import { isAdFreeActive } from "@/lib/adfree";
import { sessionAccessToken } from "@/lib/session-token";
import { speechSupported, startListening, type SpeechSession } from "@/lib/speech";
import type { TemplateId } from "@/lib/types";
import type { VoiceFillResult } from "@/server/entry-fill";

const noopSubscribe = () => () => {};

/**
 * 「用一段話寫今天」：把打字或語音講出來的內容交給 AI 整理成當天各欄位。
 *
 * 打字＋整理開放給所有登入者；語音輸入是訂閱功能——未訂閱按麥克風會直接導去訂閱頁。
 */
export function VoiceFill({
  templates,
  metricLabels,
  adFreeUntil,
  onApply,
}: {
  templates: TemplateId[];
  metricLabels: string[];
  adFreeUntil: string | null;
  onApply: (result: VoiceFillResult) => void;
}) {
  const supported = useSyncExternalStore(noopSubscribe, speechSupported, () => false);
  const subscribed = isAdFreeActive(adFreeUntil);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<SpeechSession | null>(null);

  useEffect(() => () => sessionRef.current?.stop(), []);

  const stopListening = () => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setListening(false);
    setInterim("");
  };

  const startRecording = () => {
    setError(null);
    setStatus("idle");
    const session = startListening({
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          setTranscript((current) => (current ? `${current} ${text}` : text).trim());
          setInterim("");
        } else {
          setInterim(text);
        }
      },
      onError: (reason) => {
        setError(reason);
        stopListening();
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

  const organize = async () => {
    const text = transcript.trim();
    if (!text || status === "working") return;
    stopListening();
    setError(null);
    setStatus("working");

    try {
      const token = await sessionAccessToken();
      if (!token) {
        setError("請先用 LINE 登入再使用 AI 整理。");
        setStatus("idle");
        return;
      }

      const response = await fetch("/api/entry/voice-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transcript: text, templates, metricLabels }),
      });
      const data = (await response.json()) as { result?: VoiceFillResult; error?: string };

      if (!response.ok || !data.result) {
        setError(data.error ?? "AI 整理失敗，請稍後再試。");
        setStatus("idle");
        return;
      }

      onApply(data.result);
      setTranscript("");
      setStatus("done");
    } catch {
      setError("連線失敗，請稍後再試。");
      setStatus("idle");
    }
  };

  return (
    <section className="card px-4 py-4">
      <h2 className="text-sm font-semibold text-ink">用一段話寫今天</h2>
      <p className="mt-0.5 mb-3 text-[13px] text-ink-muted">
        打一段今天發生的事，按「整理成欄位」讓 AI 幫你分到日記、感謝、目標等欄位。
        {supported ? "語音輸入為訂閱功能。" : null}
      </p>

      <TextArea
        value={listening && interim ? `${transcript} ${interim}`.trim() : transcript}
        placeholder="今天的事就從一句話開始，例如：早上跑了三公里，中午和同事吃飯聊得很開心，晚上想早點睡…"
        rows={5}
        onChange={(event) => setTranscript(event.target.value)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {supported ? (
          subscribed ? (
            <Button
              variant={listening ? "secondary" : "outline"}
              size="sm"
              onClick={listening ? stopListening : startRecording}
              aria-pressed={listening}
            >
              <MicIcon className={cn("size-4", listening && "animate-pulse")} />
              {listening ? "停止" : "語音輸入"}
            </Button>
          ) : (
            <LinkButton href="/adfree" variant="outline" size="sm">
              <MicIcon className="size-4" />
              語音輸入（訂閱）
            </LinkButton>
          )
        ) : null}

        <Button
          size="sm"
          onClick={() => void organize()}
          disabled={!transcript.trim() || status === "working"}
        >
          {status === "working" ? "整理中…" : "整理成欄位"}
        </Button>

        {transcript.trim() && !listening ? (
          <Button variant="ghost" size="sm" onClick={() => setTranscript("")}>
            清空
          </Button>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-[13px] text-alert">{error}</p> : null}
      {status === "done" && !error ? (
        <p className="mt-2 text-[13px] text-accent">已把內容填入下面對應的欄位，記得再看過一遍。</p>
      ) : null}
    </section>
  );
}
