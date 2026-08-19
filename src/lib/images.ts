"use client";

/**
 * 上傳圖片的壓縮工具。
 *
 * 資料層目前是 localStorage（整個網域只有 5MB 左右），圖片必須先縮小再轉成 data URL，
 * 否則寫個兩三張照片就寫不進去了。接上 Supabase Storage 之後這裡只需要改成上傳並存 URL。
 */

/** 照片的長邊上限與 JPEG 品質，一張大約 100–200KB。 */
export const PHOTO_MAX_EDGE = 1280;
export const PHOTO_QUALITY = 0.72;

/** 每天最多幾張照片。純粹是為了不要一天就把 localStorage 用完。 */
export const MAX_PHOTOS_PER_DAY = 6;

/** 自訂心情的圖示尺寸，正方形裁切。 */
export const MOOD_ICON_SIZE = 96;

/** 解碼前的檔案大小上限；再大的圖在手機上解碼容易直接被系統中止。 */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export interface CompressedImage {
  dataUrl: string;
  width: number;
  height: number;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export async function compressImage(
  file: File,
  options: { maxEdge: number; quality?: number; square?: boolean },
): Promise<CompressedImage> {
  if (!isImageFile(file)) throw new Error("這個檔案不是圖片");
  if (file.size > MAX_FILE_BYTES) throw new Error("圖片太大了，請選小一點的檔案");

  const source = await decode(file);
  const { maxEdge, square = false } = options;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("這個瀏覽器不支援 Canvas");
  ctx.imageSmoothingQuality = "high";

  if (square) {
    // 置中裁切成正方形，心情圖示才不會被拉扁。
    const edge = Math.min(source.width, source.height);
    canvas.width = maxEdge;
    canvas.height = maxEdge;
    ctx.drawImage(
      source,
      (source.width - edge) / 2,
      (source.height - edge) / 2,
      edge,
      edge,
      0,
      0,
      maxEdge,
      maxEdge,
    );
  } else {
    const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }

  if ("close" in source) source.close();

  // 心情圖示保留透明背景所以用 PNG，照片用 JPEG 換取檔案大小。
  const dataUrl = square
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", options.quality ?? PHOTO_QUALITY);

  return { dataUrl, width: canvas.width, height: canvas.height };
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // createImageBitmap 會依 EXIF 轉向，手機直拍的照片才不會躺著。
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Safari 舊版不支援選項，往下用 <img> 解碼。
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 估算 data URL 佔用的位元組數（base64 大約是原始資料的 4/3）。 */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.round((base64.length * 3) / 4);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
