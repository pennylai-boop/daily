/**
 * 開始一筆無廣告訂閱：建單之後把瀏覽器 form post 去 PAYUNi。
 * 金額由伺服器寫死 NT$50，前端改不了。
 */

import type { InvoiceErrors, InvoiceInput } from "./invoice";
import { postToGateway } from "./payment-form";
import type { SponsorMethod } from "./support";
import { getSupabaseBrowser } from "./supabase-browser";

export interface CheckoutFailure {
  error: string;
  invoiceErrors?: InvoiceErrors;
}

export async function startAdFreeCheckout(input: {
  email: string;
  method?: SponsorMethod;
  invoice?: InvoiceInput;
}): Promise<CheckoutFailure | null> {
  const supabase = getSupabaseBrowser();
  const {
    data: { session },
  } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
  const accessToken = session?.access_token;
  if (!accessToken) return { error: "請先用 LINE 登入，訂閱才綁得上你的帳號。" };

  try {
    const response = await fetch("/api/adfree/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });
    const data = (await response.json()) as {
      action?: string;
      fields?: Record<string, string>;
      error?: string;
      invoiceErrors?: InvoiceErrors;
    };

    if (!response.ok || !data.action || !data.fields) {
      return {
        error: data.error ?? "建立訂單失敗，請稍後再試。",
        invoiceErrors: data.invoiceErrors,
      };
    }

    postToGateway(data.action, data.fields);
    return null;
  } catch {
    return { error: "連線失敗，請確認網路後再試一次。" };
  }
}

export async function fetchAdFreeUntil(accessToken: string): Promise<string | null> {
  const response = await fetch("/api/adfree/status", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { until?: string | null };
  return typeof data.until === "string" ? data.until : null;
}
