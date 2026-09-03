"use client";

import { useEffect, useRef, useState } from "react";

import { ensureLiff, type LiffLike } from "@/lib/liff";
import { LINE_HANDOFF_QUERY, LINE_PICK_QUERY } from "@/lib/line-invite";

/**
 * LINE 裡只負責打開選人畫面，選完立刻把結果交給伺服器、跳回網頁。
 * 不讀不寫 LINE 內建瀏覽器的 localStorage，也不要求在 LINE 裡登入天天。
 */
export function LinePickScreen() {
  const [message, setMessage] = useState("正在打開 LINE 選人畫面…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get(LINE_HANDOFF_QUERY)?.trim() ?? "";
      if (!token || params.get(LINE_PICK_QUERY) !== "1") {
        setMessage("連線已過期，請回到網頁再按一次新增。");
        return;
      }

      const liff = await ensureLiff();
      if (!liff) {
        await finish(token, "unavailable", setMessage);
        return;
      }

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      if (!liff.isApiAvailable("shareTargetPicker")) {
        await finish(token, "unavailable", setMessage, liff);
        return;
      }

      try {
        const result = await liff.shareTargetPicker(
          [
            {
              type: "text",
              text: "已把這個聊天室加入天天 daily 的常傳名單。之後在網頁按「傳送今天」就會傳到這裡。",
            },
          ],
          { isMultiple: true },
        );
        await finish(token, result ? "success" : "cancelled", setMessage, liff);
      } catch {
        await finish(token, "unavailable", setMessage, liff);
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

async function finish(
  token: string,
  status: "success" | "cancelled" | "unavailable",
  setMessage: (text: string) => void,
  liff?: LiffLike | null,
) {
  setMessage("正在回到網頁…");
  let returnUrl = `${window.location.origin}/settings?picked=${status === "success" ? "1" : "0"}`;
  try {
    const response = await fetch("/api/line-pick/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, status }),
    });
    const data = (await response.json()) as { returnUrl?: string };
    if (data.returnUrl) returnUrl = data.returnUrl;
  } catch {
    // 還是要離開 LINE，網頁會再對一次帳號。
  }
  leaveForWeb(returnUrl, liff);
}

function leaveForWeb(url: string, liff?: LiffLike | null) {
  if (liff?.isInClient?.()) {
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
      // 舊版 LINE 沒有 openWindow 就自己跳。
    }
  }
  window.location.replace(url);
}
