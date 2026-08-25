/**
 * 開始一筆點數儲值：建單之後把瀏覽器 form post 去 PAYUNi 的付款頁。
 *
 * 儲值頁和卜卦頁的「免費額度用完」都會走這裡，金額一律由伺服器依方案算，
 * 這裡只負責把選到的方案與買受人資料送出去。
 */

import type { InvoiceErrors, InvoiceInput } from "./invoice";
import { postToGateway } from "./payment-form";
import type { SponsorMethod } from "./support";

export interface CheckoutFailure {
  error: string;
  invoiceErrors?: InvoiceErrors;
}

/**
 * 成功時瀏覽器會直接離開這一頁，所以只有失敗才會拿到回傳值。
 * 不帶 invoice 就是雲端發票（寄到信箱，不需要載具）。
 */
export async function startCreditCheckout(input: {
  packId: string;
  email: string;
  method?: SponsorMethod;
  invoice?: InvoiceInput;
}): Promise<CheckoutFailure | null> {
  try {
    const response = await fetch("/api/divination/credits/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
