"use client";

import { formatCardDate, formatFullDate } from "./date";
import { ensureLiff } from "./liff";
import { DEFAULT_MOOD, findMood, type MoodOption } from "./moods";
import { blobToDataUrl, hasNativeShare, nativeShare } from "./native-bridge";
import { getMark, getTemplate, groupMindfulnessItems, isBlockEmpty, summarizeBlock } from "./templates";
import type { CustomMood, DayEntry, EntryPhoto, Routine } from "./types";

/**
 * 把一天的紀錄畫成一張整頁圖片。
 *
 * 這裡用 Canvas 手繪而不是截取 DOM：分享出去的是一張排版乾淨的紀錄卡，
 * 不會夾帶輸入框、按鈕等編輯介面，傳到 LINE 也能直接看完整內容。
 */
const WIDTH = 1080;
const PADDING = 76;
const CONTENT_WIDTH = WIDTH - PADDING * 2;

/** 分享圖：白底＋3% 橘、灰點、橘色粗框。 */
const COLORS = {
  paper: "#ffffff",
  wash: "rgba(232, 110, 44, 0.03)",
  card: "#ffffff",
  ink: "#1a1a1a",
  inkMuted: "#4b5563",
  inkSubtle: "#8a8478",
  brand: "#e86e2c",
  brandTint: "#d7ebc8",
  accent: "#2f6b3a",
  line: "#e4c4b0",
  dot: "rgba(156, 163, 175, 0.55)",
  frame: "#e86e2c",
};

const FRAME = 18;

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

  /** 區塊標題：黑字粗體，左邊可帶一個小符號。 */
  sectionTitle(emoji: string, text: string) {
    const y = this.y;
    this.commands.push((ctx) => {
      ctx.font = this.font(30);
      ctx.fillStyle = COLORS.ink;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(emoji, PADDING, y + 30);
      ctx.font = this.font(30, 700);
      ctx.fillStyle = COLORS.ink;
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
    const lines = wrapText(this.measure, text, CONTENT_WIDTH - 48);

    this.commands.push((ctx) => {
      ctx.font = this.font(size, 600);
      ctx.fillStyle = COLORS.ink;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`${index}.`, PADDING, y + size);

      ctx.font = this.font(size);
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, PADDING + 48, y + size + lineIndex * Math.round(size * 1.7));
      });
    });

    this.y += lines.length * Math.round(size * 1.7) + 10;
  }

  header(
    entry: DayEntry,
    mood: MoodOption | null,
    moodIcon: HTMLImageElement | null,
    brandLogo: HTMLImageElement | null,
  ) {
    const y = this.y;
    const { weekday, monthDay } = formatCardDate(entry.date);

    this.commands.push((ctx) => {
      ctx.fillStyle = COLORS.ink;
      ctx.textBaseline = "alphabetic";
      ctx.font = this.font(26, 500);
      ctx.fillText(weekday, PADDING, y + 26);
      ctx.fillRect(PADDING, y + 34, ctx.measureText(weekday).width, 2);
      ctx.font = this.font(38, 600);
      ctx.fillText(monthDay, PADDING, y + 82);
      if (brandLogo) ctx.drawImage(brandLogo, WIDTH - PADDING - 56, y + 4, 56, 56);
    });
    this.y += 120;

    if (mood) {
      const moodY = this.y;
      this.measure.font = this.font(32, 600);
      const labelWidth = this.measure.measureText(mood.label).width;
      this.commands.push((ctx) => {
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        if (moodIcon) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(WIDTH / 2, moodY + 48, 48, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(moodIcon, WIDTH / 2 - 48, moodY, 96, 96);
          ctx.restore();
        } else {
          ctx.font = this.font(88);
          ctx.fillText(mood.emoji ?? "", WIDTH / 2, moodY + 78);
        }

        const pillW = labelWidth + 48;
        const pillX = WIDTH / 2 - pillW / 2;
        const pillY = moodY + 104;
        ctx.fillStyle = COLORS.brandTint;
        roundRect(ctx, pillX, pillY, pillW, 48, 10);
        ctx.fill();
        ctx.font = this.font(32, 600);
        ctx.fillStyle = COLORS.ink;
        ctx.fillText(mood.label, WIDTH / 2, pillY + 34);
        ctx.textAlign = "left";
      });
      this.y += 168;
    }
  }

  /** 照片：一張時滿版，多張時兩欄方格。 */
  photos(items: LoadedPhoto[]) {
    if (items.length === 0) return;
    const gap = 20;

    if (items.length === 1) {
      const { photo, image } = items[0];
      const ratio = photo.height / photo.width || 1;
      const height = Math.min(Math.round((CONTENT_WIDTH - 160) * ratio), 720);
      const y = this.y;
      this.commands.push((ctx) => {
        drawPolaroid(ctx, image, PADDING + 80, y, CONTENT_WIDTH - 160, height);
      });
      this.y += height + 48;
      return;
    }

    const cell = Math.round((CONTENT_WIDTH - gap) / 2);
    const rows = Math.ceil(items.length / 2);
    const baseY = this.y;

    const rowHeight = cell + 36;
    items.forEach(({ image }, index) => {
      const x = PADDING + (index % 2) * (cell + gap);
      const y = baseY + Math.floor(index / 2) * (rowHeight + gap);
      this.commands.push((ctx) => {
        drawPolaroid(ctx, image, x, y, cell, cell);
      });
    });

    this.y += rows * rowHeight + (rows - 1) * gap;
  }

  footer() {
    const y = this.y;
    this.commands.push((ctx) => {
      ctx.font = this.font(22, 500);
      ctx.fillStyle = COLORS.inkSubtle;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "center";
      ctx.fillText("天天 daily", WIDTH / 2, y + 36);
      ctx.textAlign = "left";
    });
    this.y += 52;
  }

  paint(ctx: CanvasRenderingContext2D, height: number) {
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(0, 0, WIDTH, height);
    ctx.fillStyle = COLORS.wash;
    ctx.fillRect(0, 0, WIDTH, height);

    ctx.fillStyle = COLORS.dot;
    const step = 22;
    const radius = 1.7;
    for (let y = step / 2; y < height; y += step) {
      for (let x = step / 2; x < WIDTH; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const command of this.commands) {
      ctx.save();
      command(ctx);
      ctx.restore();
    }

    ctx.fillStyle = COLORS.frame;
    ctx.fillRect(0, 0, WIDTH, FRAME);
    ctx.fillRect(0, height - FRAME, WIDTH, FRAME);
    ctx.fillRect(0, 0, FRAME, height);
    ctx.fillRect(WIDTH - FRAME, 0, FRAME, height);
  }
}

interface LoadedPhoto {
  photo: EntryPhoto;
  image: HTMLImageElement;
}

/** 等比填滿目標方框並裁掉多餘的部分，避免照片被拉變形。 */
function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();

  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, radius);
  ctx.stroke();
}

function drawPolaroid(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const frame = 14;
  const bottom = 36;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(26, 26, 26, 0.12)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x, y, width, height + bottom, 6);
  ctx.fill();
  ctx.shadowColor = "transparent";
  drawCover(ctx, image, x + frame, y + frame, width - frame * 2, height - frame, 2);
}

const BRAND_ICON_SRC = "/icon.svg";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("圖片載入失敗"));
    image.src = src;
  });
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

export async function buildDayImage(
  entry: DayEntry,
  routines: Routine[],
  checkedIds: string[],
  customMoods: CustomMood[] = [],
): Promise<HTMLCanvasElement> {
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) throw new Error("這個瀏覽器不支援 Canvas");

  const mood = findMood(entry.mood, customMoods) ?? DEFAULT_MOOD;
  // Canvas 只能畫已經載入完成的圖，所以排版前先把心情圖示與照片都解碼好。
  const [moodIcon, brandLogo, photos] = await Promise.all([
    mood?.image ? loadImage(mood.image) : Promise.resolve(null),
    loadImage(BRAND_ICON_SRC).catch(() => null),
    Promise.all(
      entry.photos.map(async (photo) => ({ photo, image: await loadImage(photo.dataUrl) })),
    ),
  ]);

  const page = new PageBuilder(measureContext);
  page.space(PADDING);
  page.header(entry, mood, moodIcon, brandLogo);
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

    if (block.template === "timer" || block.template === "metric") {
      const summary = summarizeBlock(block);
      if (summary) page.paragraph(summary);
    }

    page.space(26);
  }

  if (photos.length > 0) {
    page.sectionTitle("📷", "照片");
    page.photos(photos);
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

export type PreparedDayImage = {
  date: string;
  fileName: string;
  blob: Blob;
  previewUrl: string;
};

export function revokePreparedImage(image: PreparedDayImage | null) {
  if (image?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(image.previewUrl);
}

export async function prepareDayImage(
  entry: DayEntry,
  routines: Routine[],
  checkedIds: string[],
  customMoods: CustomMood[] = [],
): Promise<PreparedDayImage> {
  const canvas = await buildDayImage(entry, routines, checkedIds, customMoods);
  const blob = await toBlob(canvas);
  return {
    date: entry.date,
    fileName: `daily-${entry.date}.png`,
    blob,
    previewUrl: URL.createObjectURL(blob),
  };
}

export function downloadPreparedImage(image: PreparedDayImage) {
  const anchor = document.createElement("a");
  anchor.href = image.previewUrl;
  anchor.download = image.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export type SendImageResult = "shared" | "cancelled" | "unavailable";

/** 發到手帳圖：原生殼 → 系統分享（可選 LINE）→ LIFF 好友選擇。 */
export async function sendPreparedImage(image: PreparedDayImage): Promise<SendImageResult> {
  const title = `天天 daily｜${formatFullDate(image.date)}`;
  const file = new File([image.blob], image.fileName, { type: "image/png" });

  if (hasNativeShare()) {
    const handled = await nativeShare({
      kind: "image",
      fileName: image.fileName,
      title,
      dataUrl: await blobToDataUrl(image.blob),
    });
    if (handled) return "shared";
  }

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (error) {
      if ((error as Error).name === "AbortError") return "cancelled";
    }
  }

  const liff = await ensureLiff();
  if (liff?.isApiAvailable("shareTargetPicker") && liff.isLoggedIn()) {
    try {
      const result = await liff.shareTargetPicker(
        [
          {
            type: "text",
            text: `${title}\n請把剛剛預覽的手帳圖傳到這個聊天室。`,
          },
        ],
        { isMultiple: true },
      );
      return result ? "shared" : "cancelled";
    } catch {
      return "unavailable";
    }
  }

  return "unavailable";
}
