import type { MoodId } from "./types";

export interface MoodOption {
  id: MoodId;
  emoji: string;
  label: string;
  /** 用於日曆格子與統計圖表的色票。 */
  color: string;
  /** 1（最低落）到 5（最愉快），用於心情趨勢折線圖。 */
  score: number;
}

export const MOODS: MoodOption[] = [
  { id: "radiant", emoji: "😄", label: "燦爛", color: "#F0A83C", score: 5 },
  { id: "happy", emoji: "🙂", label: "開心", color: "#E9C24A", score: 4.5 },
  { id: "grateful", emoji: "🥰", label: "感恩", color: "#E28A9B", score: 4.5 },
  { id: "calm", emoji: "😌", label: "平靜", color: "#6FA893", score: 4 },
  { id: "neutral", emoji: "😐", label: "平常", color: "#A9A093", score: 3 },
  { id: "tired", emoji: "😪", label: "疲累", color: "#8E9BB5", score: 2.5 },
  { id: "anxious", emoji: "😰", label: "焦慮", color: "#B48ACB", score: 2 },
  { id: "down", emoji: "😢", label: "低落", color: "#6C86AE", score: 1.5 },
  { id: "angry", emoji: "😤", label: "生氣", color: "#D0705F", score: 1.5 },
];

const MOOD_MAP = new Map(MOODS.map((mood) => [mood.id, mood]));

export function getMood(id: MoodId | null | undefined): MoodOption | null {
  if (!id) return null;
  return MOOD_MAP.get(id) ?? null;
}
