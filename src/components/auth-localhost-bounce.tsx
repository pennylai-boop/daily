"use client";

import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { PRODUCTION_ORIGIN } from "@/lib/line-auth";

const noopSubscribe = () => () => {};

/** 只在本機、且 hash 帶著 OAuth token 時，回傳那段 hash；其餘情況回空字串。 */
function readLocalhostAuthHash(): string {
  const host = window.location.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") return "";
  const current = window.location.hash;
  return current.includes("access_token") ? current : "";
}

/**
 * 正式站登入若被 Supabase 退回 Site URL（本機），hash 裡的 token 會落在 localhost。
 * 讓使用者可以把同一組 token 送回正式站，不必重登一次。
 */
export function AuthLocalhostBounce() {
  // hash 只在掛載當下讀一次即可（不會再變），用 useSyncExternalStore 讀取以避免
  // hydration 落差，也不必在 effect 裡 setState。
  const hash = useSyncExternalStore(noopSubscribe, readLocalhostAuthHash, () => "");

  if (!hash) return null;

  const target = `${PRODUCTION_ORIGIN}/auth/callback?next=${encodeURIComponent("/")}${hash}`;

  return (
    <div className="fixed inset-x-0 top-0 z-[90] border-b border-line bg-surface px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-ink">
          這次登入被導到本機了。若你是從 {PRODUCTION_ORIGIN.replace("https://", "")}{" "}
          按的，把登入送回正式站。同時請把 Supabase 的 Site URL 改成正式網址，以後才不會再跳回來。
        </p>
        <Button size="sm" className="shrink-0" onClick={() => window.location.replace(target)}>
          回到正式站
        </Button>
      </div>
    </div>
  );
}
