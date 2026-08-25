/**
 * 卜卦結果的 AI 解讀。
 *
 * 有設定 `GEMINI_API_KEY` 時呼叫 Gemini 解卦；未設定時只記 log，
 * 並回傳提示文字，讓卦象本身仍能顯示。
 */

import type { HexagramResult } from "@/lib/hexagram";
import { getHexagramNote } from "@/server/divination-notes";

type DivinationAnalysis = { ok: true; analysis: string } | { ok: false; message: string };

function buildPrompt(
  question: string,
  hexagram: HexagramResult,
  notes: { main: string | null; changed: string | null },
): string {
  const lines = [
    "你是一位熟悉《易經》數字卦（梅花易數起卦法）的解卦老師，語氣溫和、務實，避免宿命論或恐嚇式的說法。",
    "使用者的問題：",
    question,
    "",
    "起卦結果：",
    `上卦：${hexagram.upperTrigram.name}（${hexagram.upperTrigram.nature}）`,
    `下卦：${hexagram.lowerTrigram.name}（${hexagram.lowerTrigram.nature}）`,
    `本卦：${hexagram.hexagramName}`,
    `動爻：第 ${hexagram.movingLine} 爻`,
    `變卦：${hexagram.changedHexagramName}`,
  ];

  // 人工補充的參考筆記（後台可編輯，見 divination_hexagram_notes），
  // 沒有填寫就不放這一段，避免空段落干擾 AI。
  if (notes.main || notes.changed) {
    lines.push("", "參考筆記（內部資料，僅供你解讀時參考，不要在回覆中提到「參考筆記」字樣）：");
    if (notes.main) lines.push(`關於本卦「${hexagram.hexagramName}」：${notes.main}`);
    if (notes.changed) lines.push(`關於變卦「${hexagram.changedHexagramName}」：${notes.changed}`);
  }

  lines.push(
    "",
    "請針對使用者的問題，結合本卦、動爻與變卦的意義給出解讀，並提供 2 到 3 點具體、可行的建議。",
    "請用繁體中文回答，分成「卦象解讀」與「建議」兩段，總長度約 250～400 字，不要重複列出上面已經給你的起卦數字或爻位資訊。",
  );

  return lines.join("\n");
}

export async function analyzeHexagram(params: {
  question: string;
  hexagram: HexagramResult;
}): Promise<DivinationAnalysis> {
  const { hexagram } = params;
  const [mainNote, changedNote] = await Promise.all([
    getHexagramNote(hexagram.upperTrigram.id, hexagram.lowerTrigram.id),
    getHexagramNote(hexagram.changedUpperTrigram.id, hexagram.changedLowerTrigram.id),
  ]);
  const prompt = buildPrompt(params.question, hexagram, { main: mainNote, changed: changedNote });
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    console.info(`[divination] 卜卦（尚未設定 GEMINI_API_KEY）\n${prompt}`);
    return {
      ok: true,
      analysis:
        "這個環境還沒有設定 GEMINI_API_KEY，暫時無法產生 AI 解讀。你可以先參考上面的卦名、動爻與變卦，自行查閱易經卦辭。",
    };
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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
    return { ok: true, analysis: text };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "AI 解卦失敗。" };
  }
}
