/**
 * 贊助感謝信與使用建議通知。
 *
 * 有設定 `RESEND_API_KEY` 時用 Resend 寄出；未設定時只記 log。
 */

import { formatRedeemCode } from "@/lib/divination-credits";
import { formatAmount } from "@/lib/support";

type MailResult = { ok: true } | { ok: false; message: string };

async function sendMail(params: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<MailResult> {
  const to = params.to.trim();
  if (!to) return { ok: false, message: "缺少收件信箱。" };

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info(`[support] 信件（尚未設定 RESEND_API_KEY）→ ${to}\n${params.subject}\n${params.text}`);
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
        subject: params.subject,
        text: params.text,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      // 401 幾乎都是金鑰失效，403 則多半是寄件網域還沒在 Resend 驗證，錯誤內容本身可能是空的。
      const detail = (await response.text()).slice(0, 200) || "（回應沒有內容）";
      return { ok: false, message: `Resend ${response.status} from=${from}: ${detail}` };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "寄信失敗。",
    };
  }
}

export async function sendSponsorThankYou(params: {
  email: string;
  name: string;
  amount: number;
  merTradeNo: string;
}): Promise<MailResult> {
  const greeting = params.name.trim() || "朋友";
  return sendMail({
    to: params.email,
    subject: "謝謝你支持天天 daily",
    text: [
      `${greeting}，你好：`,
      "",
      `謝謝你贊助天天 daily ${formatAmount(params.amount)}。`,
      "這份心意會變成繼續維護的動力，讓更多人能安靜地寫下自己的日子。",
      "",
      `訂單編號：${params.merTradeNo}`,
      "",
      "—— 天天 daily",
    ].join("\n"),
  });
}

export async function sendCreditCode(params: {
  email: string;
  name: string;
  credits: number;
  amount: number;
  code: string;
  merTradeNo: string;
}): Promise<MailResult> {
  const greeting = params.name.trim() || "朋友";
  return sendMail({
    to: params.email,
    subject: `你的卜卦點數兌換碼（${params.credits} 點）`,
    text: [
      `${greeting}，你好：`,
      "",
      `謝謝你購買天天 daily 的卜卦點數 ${params.credits} 點（${formatAmount(params.amount)}）。`,
      "",
      `兌換碼：${formatRedeemCode(params.code)}`,
      "",
      "打開「卜卦」頁，額度用完時會出現輸入框，把這組碼填進去就能開始用點數。",
      "這封信請留著：點數的餘額記在我們這邊，換手機或清掉瀏覽器資料之後，",
      "重新輸入同一組碼就能接回剩下的點數。也因為這樣，請不要把它轉給別人。",
      "",
      `訂單編號：${params.merTradeNo}`,
      "",
      "—— 天天 daily",
    ].join("\n"),
  });
}

function inboxAddress(): string {
  return (
    process.env.SUPPORT_INBOX_EMAIL?.trim() ||
    process.env.SUPPORT_EMAIL_FROM?.replace(/^.*<([^>]+)>.*$/, "$1").trim() ||
    ""
  );
}

export async function sendUsageFeedback(params: {
  email: string;
  name: string;
  message: string;
}): Promise<MailResult> {
  const fromEmail = params.email.trim();
  const greeting = params.name.trim() || "未留稱呼";
  const body = [
    `稱呼：${greeting}`,
    `信箱：${fromEmail}`,
    "",
    params.message.trim(),
  ].join("\n");

  const inbox = inboxAddress();
  if (!inbox) {
    console.info(`[support] 使用建議（尚未設定 SUPPORT_INBOX_EMAIL）\n${body}`);
  } else {
    const delivered = await sendMail({
      to: inbox,
      subject: `天天 daily 使用建議・${greeting}`,
      text: body,
      replyTo: fromEmail,
    });
    if (!delivered.ok) return delivered;
  }

  return sendMail({
    to: fromEmail,
    subject: "我們已收到你的使用建議",
    text: [
      `${params.name.trim() || "朋友"}，你好：`,
      "",
      "謝謝你寫下對天天 daily 的建議。我們會讀過，有需要時會用這封信的信箱回覆你。",
      "",
      "—— 天天 daily",
    ].join("\n"),
  });
}
