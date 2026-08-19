"use client";

import { useRef, useState } from "react";

import { CloseIcon, ImageIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  compressImage,
  dataUrlBytes,
  formatBytes,
  MAX_PHOTOS_PER_DAY,
  PHOTO_MAX_EDGE,
} from "@/lib/images";
import { createId } from "@/lib/storage";
import type { EntryPhoto } from "@/lib/types";

/**
 * 當天的照片紀錄。
 *
 * 上傳時就壓到長邊 1280px，因為資料還存在 localStorage（整個網域約 5MB），
 * 原尺寸的手機照片一張就會把空間吃光。張數也因此設了上限。
 */
export function PhotoStrip({
  photos,
  onChange,
}: {
  photos: EntryPhoto[];
  onChange: (next: EntryPhoto[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalBytes = photos.reduce((sum, photo) => sum + dataUrlBytes(photo.dataUrl), 0);
  const room = MAX_PHOTOS_PER_DAY - photos.length;

  const add = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setBusy(true);
    setError(null);
    const accepted = [...files].slice(0, Math.max(0, room));
    const added: EntryPhoto[] = [];

    for (const file of accepted) {
      try {
        const compressed = await compressImage(file, { maxEdge: PHOTO_MAX_EDGE });
        added.push({
          id: createId(),
          dataUrl: compressed.dataUrl,
          width: compressed.width,
          height: compressed.height,
          createdAt: new Date().toISOString(),
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "照片讀取失敗");
      }
    }

    if (files.length > accepted.length) {
      setError(`一天最多 ${MAX_PHOTOS_PER_DAY} 張照片，多的沒有加進來。`);
    }
    if (added.length > 0) onChange([...photos, ...added]);
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square">
            {/* 使用者上傳的 data URL，next/image 沒有可優化的空間。 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.dataUrl}
              alt=""
              className="size-full rounded-lg border border-line object-cover"
            />
            <button
              type="button"
              aria-label="刪除這張照片"
              onClick={() => onChange(photos.filter((item) => item.id !== photo.id))}
              className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-sm transition-colors hover:text-alert"
            >
              <CloseIcon className="size-3.5" strokeWidth={2.4} />
            </button>
          </div>
        ))}

        {room > 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong text-ink-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {busy ? (
              <span className="text-[13px]">處理中…</span>
            ) : (
              <>
                <PlusIcon className="size-6" />
                <span className="text-[11px]">加照片</span>
              </>
            )}
          </button>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void add(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-subtle">
          {photos.length > 0
            ? `${photos.length} 張・${formatBytes(totalBytes)}（上傳時已壓縮）`
            : `最多 ${MAX_PHOTOS_PER_DAY} 張，上傳時會自動壓縮。`}
        </p>
        {photos.length === 0 ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            <ImageIcon className="size-4" />
            選擇照片
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-[13px] font-semibold text-alert">{error}</p> : null}
    </div>
  );
}
