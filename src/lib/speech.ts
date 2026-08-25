/**
 * 語音輸入（Web Speech API）。
 *
 * 只有 Chrome、Edge、Safari 支援，而且辨識是送到瀏覽器廠商的伺服器做的，
 * 所以不支援時要能安靜地退回鍵盤輸入，不要讓按鈕停在那裡沒反應。
 */

export interface SpeechSession {
  stop: () => void;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { readonly transcript: string };
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported(): boolean {
  return getConstructor() !== null;
}

/**
 * 開始聽寫。`onTranscript` 會在說話過程中被多次呼叫，`isFinal` 為 true 時才是定稿。
 * 回傳 null 表示這個瀏覽器不支援。
 */
export function startListening({
  lang = "zh-TW",
  onTranscript,
  onError,
  onEnd,
}: {
  lang?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (reason: string) => void;
  onEnd?: () => void;
}): SpeechSession | null {
  const Ctor = getConstructor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let text = "";
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      text += result[0]?.transcript ?? "";
      if (result.isFinal) isFinal = true;
    }
    if (text) onTranscript(text, isFinal);
  };

  recognition.onerror = (event) => {
    onError?.(
      event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "沒有麥克風權限，請在瀏覽器允許之後再試。"
        : "聽不太清楚，可以再說一次或直接打字。",
    );
  };

  recognition.onend = () => onEnd?.();

  try {
    recognition.start();
  } catch {
    onError?.("無法啟動語音輸入，請直接打字。");
    return null;
  }

  return {
    stop: () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.stop();
    },
  };
}
