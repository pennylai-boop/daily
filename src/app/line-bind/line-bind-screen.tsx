"use client";

import { useEffect, useRef, useState } from "react";

import { ensureLiff, liffId, type LiffLike } from "@/lib/liff";
import { LINE_BIND_QUERY, LINE_HANDOFF_QUERY } from "@/lib/line-invite";

/**
 * 在 LINE 群組裡開啟時：讀 liff.getContext() 的 groupId／roomId，綁成常傳對象後跳回網頁。
 * 從網頁 handoff 進來（沒有群組情境）時：用 shareTargetPicker 把這個連結傳進群組，
 * 請使用者在群組裡點一下再完成綁定。
 */
export function LineBindScreen() {
  const [message, setMessage] = useState("正在準備綁定…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get(LINE_HANDOFF_QUERY)?.trim() ?? "";
      if (!token || params.get(LINE_BIND_QUERY) !== "1") {
        setMessage("連線已過期，請回到網頁再按一次「綁定 LINE 群組」。");
        return;
      }

      const liff = await ensureLiff();
      if (!liff) {
        setMessage("請在 LINE 裡開啟這個連結。");
        return;
      }
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const ctx = liff.getContext?.() ?? null;
      const chatId = ctx?.groupId ?? ctx?.roomId ?? "";

      if (chatId) {
        setMessage("正在綁定這個群組…");
        await complete(token, chatId, setMessage, liff);
        return;
      }

      // 不是從群組裡開的：把綁定連結傳進使用者選的群組。
      if (!liff.isApiAvailable("shareTargetPicker")) {
        setMessage("請直接在要綁定的 LINE 群組裡開啟這個連結。");
        return;
      }
      const id = liffId();
      const bindUrl = `https://liff.line.me/${id}?${LINE_BIND_QUERY}=1&${LINE_HANDOFF_QUERY}=${encodeURIComponent(
        token,
      )}`;
      try {
        const result = await liff.shareTargetPicker([
          {
            type: "text",
            text: `在這個群組裡點下面的連結，就能讓天天 daily 之後直接把每日紀錄傳來這裡：\n${bindUrl}`,
          },
        ]);
        setMessage(
          result
            ? "已把綁定連結傳到群組。請切到那個群組、點一下剛剛傳的連結完成綁定。"
            : "沒有傳出去。請直接在要綁定的群組裡開啟這個連結。",
        );
      } catch {
        setMessage("請直接在要綁定的 LINE 群組裡開啟這個連結。");
      }
    };

    void run();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  );
}

async function complete(
  token: string,
  chatId: string,
  setMessage: (text: string) => void,
  liff: LiffLike,
) {
  let returnUrl = `${window.location.origin}/settings?bound=1`;
  try {
    const response = await fetch("/api/line-bind/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, chatId }),
    });
    const data = (await response.json()) as { returnUrl?: string; error?: string };
    if (data.returnUrl) returnUrl = data.returnUrl;
    if (!response.ok) {
      setMessage(data.error ?? "綁定失敗，請回網頁再試一次。");
    } else {
      setMessage("綁定完成，正在回到網頁…");
    }
  } catch {
    setMessage("綁定完成，正在回到網頁…");
  }
  leaveForWeb(returnUrl, liff);
}

function leaveForWeb(url: string, liff: LiffLike) {
  if (liff.isInClient?.()) {
    try {
      liff.openWindow?.({ url, external: true });
      window.setTimeout(() => {
        try {
          liff.closeWindow?.();
        } catch {
          window.location.replace(url);
        }
      }, 400);
      return;
    } catch {
      /* 舊版 LINE 沒有 openWindow */
    }
  }
  window.location.replace(url);
}
