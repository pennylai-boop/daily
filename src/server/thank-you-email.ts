/**
 * 贊助成功後的感謝信。
 *
 * 有設定 `RESEND_API_KEY` 時用 Resend 寄出；未設定時只記 log，
 * 開發環境仍可走完付款流程。
 */

import { formatAmount } from "@/lib/support";

export async function sendSponsorThankYou(params: {
  email: string;
  name: string;
  amount: number;
  merTradeNo: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const to = params.email.trim();
  if (!to) return { ok: false, message: "缺少收件信箱。" };

  const greeting = params.name.trim() || "朋友";
  const subject = "謝謝你支持天天 daily";
  const text = [
    `${greeting}，你好：`,
    "",
    `謝謝你贊助天天 daily ${formatAmount(params.amount)}。`,
    "這份心意會變成繼續維護的動力，讓更多人能安靜地寫下自己的日子。",
    "",
    `訂單編號：${params.merTradeNo}`,
    "",
    "—— 天天 daily",
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info(`[support] 感謝信（尚未設定 RESEND_API_KEY）→ ${to}\n${text}`);
    return { ok: true };
  }

  const from =
    process.env.SUPPORT_EMAIL_FROM?.trim() || "天天 daily <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, message: `Resend ${response.status}: ${detail.slice(0, 200)}` };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "寄送感謝信失敗。",
    };
  }
}
