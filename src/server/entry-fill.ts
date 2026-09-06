/**
 * 把使用者「用說的」講出來的一天，交給 Gemini 整理成當天紀錄的欄位。
 *
 * 和卜卦解讀（src/server/divination.ts）走同一組 GEMINI_API_KEY／GEMINI_MODEL。
 * 只回傳結構化資料，實際要不要寫進哪個定期事項由前端比對 template 決定。
 */

import type { MindfulnessChannel, MindfulnessMark, TemplateId } from "@/lib/types";

export interface VoiceFillResult {
  /** 當日目標，一句一項。 */
  focus: string[];
  /** 日記：標題可留空。使用者沒有日記格式時為 null。 */
  diary: { title: string; body: string } | null;
  /** 五感恩：值得感謝的事，一句一項。 */
  gratitude: string[];
  /** 觀心書：身／口／意 + 做得好／要調整／待做。 */
  mindfulness: { channel: MindfulnessChannel; mark: MindfulnessMark; text: string }[];
  /** 紀錄格式的數值，label 需對得上使用者既有欄位才會被採用。 */
  metrics: { label: string; value: string }[];
}

type FillOutcome =
  | { ok: true; result: VoiceFillResult }
  | { ok: false; message: string };

const CHANNELS: MindfulnessChannel[] = ["body", "speech", "mind"];
const MARKS: MindfulnessMark[] = ["plus", "minus", "todo"];

function buildPrompt(params: {
  transcript: string;
  templates: TemplateId[];
  metricLabels: string[];
}): string {
  const { transcript, templates, metricLabels } = params;
  const has = (id: TemplateId) => templates.includes(id);

  const sections: string[] = [
    "你是一個把口述內容整理成日記欄位的助手。使用者會用口語講出他的一天，",
    "請你判斷內容屬於哪個欄位，整理成通順的繁體中文短句，不要杜撰沒有講到的內容。",
    "",
    "使用者的口述內容：",
    transcript,
    "",
    "請只輸出 JSON，格式如下（沒有對應內容的欄位就給空陣列或 null）：",
    "{",
    '  "focus": string[],          // 當天想完成的目標，一句一項',
  ];

  if (has("diary")) {
    sections.push('  "diary": { "title": string, "body": string } | null,  // 當天發生的事、心情、想法');
  }
  if (has("gratitude")) {
    sections.push('  "gratitude": string[],      // 值得感謝的人事物，一句一項');
  }
  if (has("mindfulness")) {
    sections.push(
      '  "mindfulness": [ { "channel": "body"|"speech"|"mind", "mark": "plus"|"minus"|"todo", "text": string } ],',
      "  //   channel：body＝做的行為、speech＝說的話、mind＝心裡的念頭",
      "  //   mark：plus＝做得好、minus＝要調整、todo＝接下來想練習",
    );
  }
  if (has("metric") && metricLabels.length > 0) {
    sections.push(
      `  "metrics": [ { "label": string, "value": string } ]  // label 只能是：${metricLabels.join("、")}；value 為數字字串`,
    );
  }

  sections.push(
    "}",
    "",
    "注意：",
    "- 一律用繁體中文。",
    "- 只放使用者真的講到的內容；沒講到的欄位給空陣列或 null。",
    "- 不要加上「以下是整理結果」之類的說明文字，直接輸出 JSON。",
  );

  return sections.join("\n");
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, 20);
}

function normalize(raw: unknown, metricLabels: string[]): VoiceFillResult {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const diaryRaw = obj.diary as Record<string, unknown> | null | undefined;
  const diary =
    diaryRaw && typeof diaryRaw === "object"
      ? {
          title: typeof diaryRaw.title === "string" ? diaryRaw.title.trim().slice(0, 80) : "",
          body: typeof diaryRaw.body === "string" ? diaryRaw.body.trim() : "",
        }
      : null;

  const mindfulness = Array.isArray(obj.mindfulness)
    ? (obj.mindfulness as unknown[])
        .map((item) => {
          const it = (item ?? {}) as Record<string, unknown>;
          const channel = CHANNELS.includes(it.channel as MindfulnessChannel)
            ? (it.channel as MindfulnessChannel)
            : "body";
          const mark = MARKS.includes(it.mark as MindfulnessMark)
            ? (it.mark as MindfulnessMark)
            : "plus";
          const text = typeof it.text === "string" ? it.text.trim() : "";
          return { channel, mark, text };
        })
        .filter((item) => item.text.length > 0)
        .slice(0, 20)
    : [];

  const allowed = new Set(metricLabels);
  const metrics = Array.isArray(obj.metrics)
    ? (obj.metrics as unknown[])
        .map((item) => {
          const it = (item ?? {}) as Record<string, unknown>;
          return {
            label: typeof it.label === "string" ? it.label.trim() : "",
            value: typeof it.value === "string" ? it.value.trim() : String(it.value ?? "").trim(),
          };
        })
        .filter((item) => allowed.has(item.label) && item.value.length > 0)
        .slice(0, 20)
    : [];

  return {
    focus: asStringArray(obj.focus),
    diary: diary && (diary.title || diary.body) ? diary : null,
    gratitude: asStringArray(obj.gratitude),
    mindfulness,
    metrics,
  };
}

export async function fillEntryFromSpeech(params: {
  transcript: string;
  templates: TemplateId[];
  metricLabels: string[];
}): Promise<FillOutcome> {
  const transcript = params.transcript.trim().slice(0, 4000);
  if (!transcript) return { ok: false, message: "沒有聽到內容。" };

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, message: "這個環境還沒有設定 GEMINI_API_KEY，語音整理暫時無法使用。" };
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const prompt = buildPrompt({ ...params, transcript });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, message: `Gemini ${response.status}: ${detail.slice(0, 200)}` };
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) return { ok: false, message: "Gemini 沒有回傳可用的內容。" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // JSON 模式偶爾還是會包在 ```json 圍籬裡，去掉再試一次。
      const stripped = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      parsed = JSON.parse(stripped);
    }

    return { ok: true, result: normalize(parsed, params.metricLabels) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "語音整理失敗。" };
  }
}
