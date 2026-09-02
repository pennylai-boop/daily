"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabaseBrowser } from "@/lib/supabase-browser";

/** 只接受站內路徑，避免 open redirect。 */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function AuthCallback() {
  const router = useRouter();
  const [notice, setNotice] = useState("正在完成登入…");

  useEffect(() => {
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setNotice("這個環境還沒有設定 Supabase。");
      return;
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data.session) {
        setNotice("登入沒有完成，請再試一次。");
        window.setTimeout(() => router.replace("/settings"), 1200);
        return;
      }
      router.replace(next);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-sm text-ink-muted">{notice}</p>
    </div>
  );
}
