import { DEFAULT_MOOD_ID, type BuiltInMoodId, type CustomMood, type MoodId, type MoodLevel } from "./types";

export interface MoodOption {
  id: MoodId;
  /** 自訂心情如果是上傳圖片，這裡會是 null，改用 `image`。 */
  emoji: string | null;
  /** 自訂心情上傳並壓縮過的小圖（data URL）；內建心情一律是 null。 */
  image: string | null;
  label: string;
  /** 用於日曆格子與統計圖表的色票。 */
  color: string;
  /** 1（最低落）到 5（最愉快），用於心情趨勢折線圖。 */
  score: number;
  custom: boolean;
}

const BUILT_IN: { id: BuiltInMoodId; emoji: string; label: string; color: string; score: number }[] = [
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

export const MOODS: MoodOption[] = BUILT_IN.map((mood) => ({
  ...mood,
  image: null,
  custom: false,
}));

/** 紀錄頁在使用者還沒選之前顯示的心情。 */
export const DEFAULT_MOOD: MoodOption =
  MOODS.find((mood) => mood.id === DEFAULT_MOOD_ID) ?? MOODS[0];

/**
 * 自訂心情的正負向程度。折線圖需要分數、日曆需要色票，
 * 但讓使用者填數字或選顏色都太抽象，所以只讓他挑程度，其餘由這張表換算。
 */
export const MOOD_LEVELS: { id: MoodLevel; label: string; score: number; color: string }[] = [
  { id: "great", label: "很好", score: 5, color: "#F0A83C" },
  { id: "good", label: "好", score: 4, color: "#E9C24A" },
  { id: "okay", label: "普通", score: 3, color: "#A9A093" },
  { id: "low", label: "不太好", score: 2, color: "#8E9BB5" },
  { id: "bad", label: "低落", score: 1, color: "#6C86AE" },
];

const CUSTOM_PREFIX = "custom:";

export function isCustomMoodId(id: MoodId | null | undefined): boolean {
  return typeof id === "string" && id.startsWith(CUSTOM_PREFIX);
}

export function createCustomMoodId(seed: string): string {
  return `${CUSTOM_PREFIX}${seed}`;
}

export function toMoodOption(mood: CustomMood): MoodOption {
  const level = MOOD_LEVELS.find((item) => item.id === mood.level) ?? MOOD_LEVELS[2];
  return {
    id: mood.id,
    emoji: mood.imageDataUrl ? null : mood.emoji,
    image: mood.imageDataUrl,
    label: mood.label,
    color: level.color,
    score: level.score,
    custom: true,
  };
}

/** 選擇器與統計要顯示的全部心情：內建九種在前，自訂的依建立順序接在後面。 */
export function moodOptions(customMoods: CustomMood[] = []): MoodOption[] {
  return [...MOODS, ...customMoods.map(toMoodOption)];
}

/**
 * 別人分享過來的紀錄可能用了我這邊沒有的自訂心情，這時會回傳 null，
 * 呼叫端要能接受「有紀錄但沒有心情圖樣」。
 */
export function findMood(
  id: MoodId | null | undefined,
  customMoods: CustomMood[] = [],
): MoodOption | null {
  if (!id) return null;
  if (isCustomMoodId(id)) {
    const custom = customMoods.find((mood) => mood.id === id);
    return custom ? toMoodOption(custom) : null;
  }
  return MOODS.find((mood) => mood.id === id) ?? null;
}
