"use client";

import { formatFullDate } from "./date";
import { getMood } from "./moods";
import { getMark, getTemplate, groupMindfulnessItems, isBlockEmpty } from "./templates";
import type { DayEntry, Routine } from "./types";

/**
 * 把一天的紀錄畫成一張整頁圖片。
 *
 * 這裡用 Canvas 手繪而不是截取 DOM：分享出去的是一張排版乾淨的紀錄卡，
 * 不會夾帶輸入框、按鈕等編輯介面，傳到 LINE 也能直接看完整內容。
 */
const WIDTH = 1080;
const PADDING = 76;
const CONTENT_WIDTH = WIDTH - PADDING * 2;

/** 與 globals.css 的色票同步（設計系統：灰底、白卡、橘主色、藍次色）。 */
const COLORS = {
  paper: "#f3f4f6",
  card: "#ffffff",
  ink: "#111827",
  inkMuted: "#4b5563",
  inkSubtle: "#9ca3af",
  brand: "#e86e2c",
  brandTint: "#fde8dd",
  accent: "#262f8b",
  line: "#e5e7eb",
};

const FONT_STACK =
  '"PingFang TC", "Microsoft JhengHei", "Noto Sans TC", "Hiragino Sans TC", system-ui, sans-serif';

type DrawCommand = (ctx: CanvasRenderingContext2D) => void;

class PageBuilder {
  private commands: DrawCommand[] = [];
  private measure: CanvasRenderingContext2D;
  y = 0;

  constructor(measureContext: CanvasRenderingContext2D) {
    this.measure = measureContext;
  }

  private font(size: number, weight = 400) {
    return `${weight} ${size}px ${FONT_STACK}`;
  }

  space(amount: number) {
    this.y += amount;
  }

  rule() {
    const y = this.y;
    this.commands.push((ctx) => {
      ctx.fillStyle = COLORS.line;
      ctx.fillRect(PADDING, y, CONTENT_WIDTH, 1);
    });
    this.y += 1;
  }

  /** 區塊標題：小色塊 + 標題文字。 */
  sectionTitle(emoji: string, text: string) {
    const y = this.y;
    this.commands.push((ctx) => {
      ctx.font = this.font(30);
      ctx.fillStyle = COLORS.ink;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(emoji, PADDING, y + 30);
      ctx.font = this.font(30, 600);
      ctx.fillStyle = COLORS.brand;
      ctx.fillText(text, PADDING + 44, y + 30);
    });
    this.y += 46;
  }

  paragraph(
    text: string,
    options: {
      size?: number;
      weight?: number;
      color?: string;
      lineHeight?: number;
      indent?: number;
    } = {},
  ) {
    const size = options.size ?? 28;
    const weight = options.weight ?? 400;
    const color = options.color ?? COLORS.ink;
    const lineHeight = options.lineHeight ?? Math.round(size * 1.75);
    const indent = options.indent ?? 0;

    this.measure.font = this.font(size, weight);
    const lines = wrapText(this.measure, text, CONTENT_WIDTH - indent);

    for (const line of lines) {
      const y = this.y;
      this.commands.push((ctx) => {
        ctx.font = this.font(size, weight);
        ctx.fillStyle = color;
        ctx.textBaseline = "alphabetic";
        ctx.fillText(line, PADDING + indent, y + size);
      });
      this.y += lineHeight;
    }
  }

  /** 勾選項目，用實心圓點或勾號標示完成狀態。 */
  checkItem(text: string, done: boolean) {
    const y = this.y;
    const size = 27;
    this.measure.font = this.font(size);
    const lines = wrapText(this.measure, text, CONTENT_WIDTH - 46);

    this.commands.push((ctx) => {
      const centerY = y + size * 0.65;
      ctx.beginPath();
      ctx.arc(PADDING + 12, centerY, 11, 0, Math.PI * 2);
      if (done) {
        ctx.fillStyle = COLORS.accent;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(PADDING + 7, centerY);
        ctx.lineTo(PADDING + 11, centerY + 4.5);
        ctx.lineTo(PADDING + 18, centerY - 4.5);
        ctx.stroke();
      } else {
        ctx.strokeStyle = COLORS.inkSubtle;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.font = this.font(size);
      ctx.fillStyle = done ? COLORS.inkMuted : COLORS.ink;
      ctx.textBaseline = "alphabetic";
      lines.forEach((line, index) => {
        ctx.fillText(line, PADDING + 46, y + size + index * Math.round(size * 1.6));
      });
    });

    this.y += lines.length * Math.round(size * 1.6) + 8;
  }

  /** 觀心書的一行：左邊是 ＋ － ☐ 的記號，右邊是內容。 */
  marked(symbol: string, text: string) {
    const y = this.y;
    const size = 27;
    const indent = 42;
    this.measure.font = this.font(size);
    const lines = wrapText(this.measure, text, CONTENT_WIDTH - indent);
    const lineHeight = Math.round(size * 1.65);

    this.commands.push((ctx) => {
      ctx.textBaseline = "alphabetic";
      ctx.font = this.font(size, 600);
      ctx.fillStyle = COLORS.inkSubtle;
      ctx.fillText(symbol, PADDING + 4, y + size);

      ctx.font = this.font(size);
      ctx.fillStyle = COLORS.ink;
      lines.forEach((line, index) => {
        ctx.fillText(line, PADDING + indent, y + size + index * lineHeight);
      });
    });

    this.y += lines.length * lineHeight + 6;
  }

  numbered(index: number, text: string) {
    const y = this.y;
    const size = 28;
    this.measure.font = this.font(size);
    const lines = wrapText(this.measure, text, CONTENT_WIDTH - 52);

    this.commands.push((ctx) => {
      ctx.beginPath();
      ctx.arc(PADDING + 17, y + size * 0.6, 17, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.brandTint;
      ctx.fill();
      ctx.font = this.font(20, 600);
      ctx.fillStyle = COLORS.brand;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${index}`, PADDING + 17, y + size * 0.62);
      ctx.textAlign = "left";

      ctx.font = this.font(size);
      ctx.fillStyle = COLORS.ink;
      ctx.textBaseline = "alphabetic";
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, PADDING + 52, y + size + lineIndex * Math.round(size * 1.7));
      });
    });

    this.y += lines.length * Math.round(size * 1.7) + 10;
  }

  header(entry: DayEntry) {
    const mood = getMood(entry.mood);
    const y = this.y;

    this.commands.push((ctx) => {
      ctx.fillStyle = COLORS.brand;
      ctx.fillRect(PADDING, y, 84, 6);
    });
    this.y += 40;

    this.paragraph(formatFullDate(entry.date), { size: 42, weight: 600, lineHeight: 58 });

    if (mood) {
      const moodY = this.y;
      this.commands.push((ctx) => {
        ctx.font = this.font(38);
        ctx.textBaseline = "alphabetic";
        ctx.fillText(mood.emoji, PADDING, moodY + 38);
        ctx.font = this.font(28, 500);
        ctx.fillStyle = COLORS.inkMuted;
        ctx.fillText(`今天的心情：${mood.label}`, PADDING + 56, moodY + 34);
      });
      this.y += 58;
    }
  }

  footer() {
    const y = this.y;
    this.commands.push((ctx) => {
      ctx.fillStyle = COLORS.line;
      ctx.fillRect(PADDING, y, CONTENT_WIDTH, 1);

      ctx.font = this.font(24, 600);
      ctx.fillStyle = COLORS.brand;
      ctx.textBaseline = "alphabetic";
      ctx.fillText("天天 daily", PADDING, y + 46);

      ctx.font = this.font(22);
      ctx.fillStyle = COLORS.inkSubtle;
      ctx.textAlign = "right";
      ctx.fillText("daily.introvsita.ai", WIDTH - PADDING, y + 46);
      ctx.textAlign = "left";
    });
    this.y += 60;
  }

  paint(ctx: CanvasRenderingContext2D, height: number) {
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, WIDTH, height);
    ctx.fillStyle = COLORS.card;
    roundRect(ctx, 28, 28, WIDTH - 56, height - 56, 32);
    ctx.fill();
    for (const command of this.commands) {
      ctx.save();
      command(ctx);
      ctx.restore();
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * 中文沒有空白可以斷行，所以逐字累加；拉丁文字則以單詞為單位避免切斷。
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];

  for (const rawLine of text.split("\n")) {
    if (rawLine.trim() === "") {
      lines.push("");
      continue;
    }

    let current = "";
    for (const token of tokenize(rawLine)) {
      const candidate = current + token;
      if (current !== "" && ctx.measureText(candidate).width > maxWidth) {
        lines.push(current);
        current = token.trimStart();
      } else {
        current = candidate;
      }
    }
    if (current !== "") lines.push(current);
  }

  return lines;
}

function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let latin = "";

  for (const char of line) {
    if (/[A-Za-z0-9@._'-]/.test(char)) {
      latin += char;
      continue;
    }
    if (latin) {
      tokens.push(latin);
      latin = "";
    }
    tokens.push(char);
  }
  if (latin) tokens.push(latin);

  return tokens;
}

export function buildDayImage(
  entry: DayEntry,
  routines: Routine[],
  checkedIds: string[],
): HTMLCanvasElement {
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) throw new Error("這個瀏覽器不支援 Canvas");

  const page = new PageBuilder(measureContext);
  page.space(PADDING);
  page.header(entry);
  page.space(12);

  if (entry.focus.length > 0) {
    page.sectionTitle("🎯", "當日目標");
    for (const item of entry.focus) page.checkItem(item.text, item.done);
    page.space(18);
  }

  const doneRoutines = routines.filter(
    (routine) => checkedIds.includes(routine.id) && routine.template === null,
  );
  if (doneRoutines.length > 0) {
    page.sectionTitle("🔁", "完成的定期事項");
    for (const routine of doneRoutines) page.checkItem(`${routine.emoji} ${routine.title}`, true);
    page.space(18);
  }

  for (const block of entry.blocks) {
    if (isBlockEmpty(block)) continue;
    const meta = getTemplate(block.template);
    page.sectionTitle(meta.emoji, meta.name);

    if (block.template === "diary") {
      if (block.data.title.trim()) {
        page.paragraph(block.data.title, { size: 32, weight: 600, lineHeight: 48 });
        page.space(6);
      }
      page.paragraph(block.data.body);
    }

    if (block.template === "gratitude") {
      block.data.items.forEach((item, index) => {
        if (item.trim()) page.numbered(index + 1, item);
      });
    }

    if (block.template === "mindfulness") {
      for (const { label, items } of groupMindfulnessItems(block.data.items)) {
        const written = items.filter((item) => item.text.trim());
        if (written.length === 0) continue;
        page.paragraph(label, { size: 24, weight: 600, color: COLORS.accent, lineHeight: 36 });
        for (const item of written) {
          page.marked(getMark(item.mark).symbol, item.text.trim());
        }
        page.space(14);
      }
    }

    page.space(26);
  }

  page.space(10);
  page.footer();
  page.space(PADDING - 40);

  const height = Math.max(page.y, 720);
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("這個瀏覽器不支援 Canvas");
  ctx.scale(scale, scale);
  page.paint(ctx, height);

  return canvas;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("圖片產生失敗"));
    }, "image/png");
  });
}

export type ShareResult = "shared" | "downloaded";

/**
 * 優先用 Web Share API 直接分享檔案（手機上可以選 LINE），
 * 桌機沒有這個 API 時退回下載 PNG。
 */
export async function shareDayImage(
  entry: DayEntry,
  routines: Routine[],
  checkedIds: string[],
): Promise<ShareResult> {
  const blob = await toBlob(buildDayImage(entry, routines, checkedIds));
  const file = new File([blob], `daily-${entry.date}.png`, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `天天 daily｜${formatFullDate(entry.date)}`,
    });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
