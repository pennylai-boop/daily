"use client";

import { useEffect, useState } from "react";

import { CloseIcon, ImageIcon, ShareIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/surfaces";
import { formatFullDate } from "@/lib/date";
import {
  downloadPreparedImage,
  sendPreparedImage,
  type PreparedDayImage,
} from "@/lib/share-image";
import { markLineTargetUsed } from "@/lib/store";
import type { LineShareTarget } from "@/lib/types";

export function ShareDayDialog({
  open,
  image,
  targets,
  onClose,
}: {
  open: boolean;
  image: PreparedDayImage | null;
  targets: LineShareTarget[];
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<"download" | "send" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setBusy(null);
      setNote(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || !image) return null;

  const names = targets.map((target) => target.name);

  const download = () => {
    setNote(null);
    setBusy("download");
    downloadPreparedImage(image);
    setBusy(null);
    setNote("已開始下載圖片。");
  };

  const send = async () => {
    setNote(null);
    setBusy("send");
    const result = await sendPreparedImage(image);
    setBusy(null);
    if (result === "cancelled") return;
    if (result === "unavailable") {
      setNote(
        names.length > 0
          ? "這個瀏覽器沒辦法直接傳到 LINE，請先下載，再傳到「" + names.join("、") + "」。"
          : "這個瀏覽器沒辦法直接傳到 LINE，請先下載再傳。",
      );
      return;
    }
    for (const target of targets) markLineTargetUsed(target.id);
    setNote(names.length > 0 ? `已打開發送，請選 LINE 的「${names.join("、")}」。` : "已打開發送畫面。");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="關閉預覽"
        className="absolute inset-0 bg-ink/45"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="傳送今天"
        className="relative z-10 flex max-h-[min(92dvh,52rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_16px_48px_rgba(17,24,39,0.18)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">傳送今天</p>
            <p className="truncate text-[13px] text-ink-muted">{formatFullDate(image.date)}</p>
          </div>
          <button
            type="button"
            aria-label="關閉"
            className="flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink"
            onClick={onClose}
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.previewUrl}
            alt={`${formatFullDate(image.date)} 的分享圖`}
            className="mx-auto max-h-[min(28rem,50dvh)] w-full rounded-lg border border-line object-contain"
          />

          <div className="mt-3 space-y-2">
            <p className="text-[13px] font-medium text-ink">常傳的 LINE 對象</p>
            {names.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {names.map((name) => (
                  <Chip key={name} tone="brand">
                    {name}
                  </Chip>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-ink-muted">
                還沒有常傳對象。可到設定新增，發送時再從 LINE 列表選。
              </p>
            )}
          </div>
        </div>

        {note ? <p className="px-4 pb-1 text-[13px] text-ink-muted">{note}</p> : null}

        <div className="grid grid-cols-2 gap-2 border-t border-line px-4 py-3">
          <Button variant="secondary" disabled={busy !== null} onClick={download}>
            <ImageIcon className="size-4" />
            {busy === "download" ? "下載中…" : "下載"}
          </Button>
          <Button disabled={busy !== null} onClick={() => void send()}>
            <ShareIcon className="size-4" />
            {busy === "send" ? "發送中…" : names.length > 0 ? "發送" : "發送到 LINE"}
          </Button>
        </div>
      </div>
    </div>
  );
}
