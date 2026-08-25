import { createId } from "./storage";
import type { BlockContent, EntryBlock, MetricFieldDef, MindfulnessChannel, MindfulnessItem, MindfulnessMark, TemplateId, TimerDefaults } from "./types";
import { DEFAULT_TIMER } from "./types";

export interface TemplateMeta {
  id: TemplateId;
  emoji: string;
  name: string;
  tagline: string;
  description: string;
  /** writing：字數；measure：回顧畫數值曲線。 */
  kind: "writing" | "measure";
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "diary",
    emoji: "✍️",
    name: "日記",
    tagline: "自由書寫",
    description: "不設限地寫下今天發生的事、想到的念頭。",
    kind: "writing",
  },
  {
    id: "gratitude",
    emoji: "🙏",
    name: "五感恩",
    tagline: "五件值得感謝的事",
    description: "列出五件今天讓你心生感謝的人、事、物。",
    kind: "writing",
  },
  {
    id: "mindfulness",
    // 蓮花 🪷 是 Emoji 14，Windows 內建字型還沒有，會顯示成空白方框。
    emoji: "💭",
    name: "觀心書",
    tagline: "身・口・意",
    description: "在身、口、意底下記做得好的、要調整的，以及接下來要練習的。",
    kind: "writing",
  },
  {
    id: "timer",
    emoji: "⏱",
    name: "計時",
    tagline: "碼表或番茄鐘",
    description: "按下就開始計時，可當工作／放鬆碼表，也可設定番茄鐘。",
    kind: "measure",
  },
  {
    id: "metric",
    emoji: "📏",
    name: "紀錄",
    tagline: "固定項目數值",
    description: "建立時先寫好要記的項目，例如體重、腰圍、喝水次數。",
    kind: "measure",
  },
];

const TEMPLATE_MAP = new Map(TEMPLATES.map((template) => [template.id, template]));

export function getTemplate(id: TemplateId): TemplateMeta {
  const meta = TEMPLATE_MAP.get(id);
  if (!meta) throw new Error(`未知的記錄格式：${id}`);
  return meta;
}

/** 五感恩至少給五列，寫得多可以再往下加。 */
export const GRATITUDE_SLOTS = 5;

export const MINDFULNESS_CHANNELS: {
  key: MindfulnessChannel;
  label: string;
  hint: string;
}[] = [
  { key: "body", label: "身", hint: "做出來的行為、身體的狀態" },
  { key: "speech", label: "口", hint: "說出口的話、語氣與回應" },
  { key: "mind", label: "意", hint: "心裡的念頭、起心動念" },
];

export const MINDFULNESS_MARKS: {
  key: MindfulnessMark;
  symbol: string;
  label: string;
  placeholder: string;
}[] = [
  { key: "plus", symbol: "＋", label: "做得好", placeholder: "今天做得好的地方…" },
  { key: "minus", symbol: "－", label: "要調整", placeholder: "今天想調整的地方…" },
  // 待做用箭號而不是空心方框：方框跟「口」這個面向的字長得太像。
  { key: "todo", symbol: "→", label: "待做", placeholder: "接下來想做、想練習的…" },
];

const MARK_MAP = new Map(MINDFULNESS_MARKS.map((mark) => [mark.key, mark]));

export function getMark(mark: MindfulnessMark) {
  return MARK_MAP.get(mark) ?? MINDFULNESS_MARKS[0];
}

export function createMindfulnessItem(
  channel: MindfulnessChannel,
  mark: MindfulnessMark,
): MindfulnessItem {
  return { id: createId(), channel, mark, text: "" };
}

export function createEmptyContent(
  template: TemplateId,
  extras?: { metricFields?: MetricFieldDef[]; timerDefaults?: TimerDefaults },
): BlockContent {
  switch (template) {
    case "diary":
      return { template: "diary", data: { title: "", body: "" } };
    case "gratitude":
      return {
        template: "gratitude",
        data: { items: Array.from({ length: GRATITUDE_SLOTS }, () => "") },
      };
    case "mindfulness":
      return { template: "mindfulness", data: { items: [] } };
    case "timer": {
      const defaults = extras?.timerDefaults ?? DEFAULT_TIMER;
      return {
        template: "timer",
        data: {
          mode: defaults.mode,
          totalSeconds: 0,
          runningStartedAt: null,
          pomodoroMinutes: defaults.pomodoroMinutes,
          pomodoroDone: 0,
        },
      };
    }
    case "metric":
      return {
        template: "metric",
        data: {
          fields: (extras?.metricFields ?? []).filter((field) => field.label.trim()),
          values: {},
        },
      };
  }
}

export function isBlockEmpty(block: EntryBlock): boolean {
  switch (block.template) {
    case "diary":
      return !block.data.title.trim() && !block.data.body.trim();
    case "gratitude":
      return block.data.items.every((item) => !item.trim());
    case "mindfulness":
      return block.data.items.every((item) => !item.text.trim());
    case "timer":
      return timerElapsedSeconds(block.data) <= 0 && block.data.pomodoroDone <= 0;
    case "metric":
      return !Object.values(block.data.values).some((value) => value.trim().length > 0);
  }
}

export function timerElapsedSeconds(data: Extract<EntryBlock, { template: "timer" }>["data"], now = Date.now()) {
  const running = data.runningStartedAt ? Math.max(0, Math.floor((now - Date.parse(data.runningStartedAt)) / 1000)) : 0;
  return data.totalSeconds + running;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function parseMetricNumber(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** 取一段純文字摘要，用於清單與日曆的預覽。 */
export function summarizeBlock(block: EntryBlock): string {
  switch (block.template) {
    case "diary":
      return [block.data.title, block.data.body].filter(Boolean).join("　").trim();
    case "gratitude":
      return block.data.items
        .map((item) => item.trim())
        .filter(Boolean)
        .join("、");
    case "mindfulness":
      return block.data.items
        .map((item) => item.text.trim())
        .filter(Boolean)
        .join("、");
    case "timer": {
      const seconds = timerElapsedSeconds(block.data);
      const parts = [seconds > 0 ? formatDuration(seconds) : ""];
      if (block.data.mode === "pomodoro" && block.data.pomodoroDone > 0) {
        parts.push(`${block.data.pomodoroDone} 顆番茄`);
      }
      return parts.filter(Boolean).join("・");
    }
    case "metric":
      return block.data.fields
        .map((field) => {
          const value = block.data.values[field.id]?.trim();
          if (!value) return "";
          return `${field.label} ${value}${field.unit ? ` ${field.unit}` : ""}`;
        })
        .filter(Boolean)
        .join("、");
  }
}

/** 依身、口、意的順序分組，空的面向不列出。 */
export function groupMindfulnessItems(items: MindfulnessItem[]) {
  return MINDFULNESS_CHANNELS.map((channel) => ({
    ...channel,
    items: items.filter((item) => item.channel === channel.key),
  }));
}

export function countWords(block: EntryBlock): number {
  if (block.template === "timer" || block.template === "metric") return 0;
  return summarizeBlock(block).replace(/\s+/g, "").length;
}
