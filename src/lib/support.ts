/**
 * 贊助（支持）的共用定義與驗證。
 *
 * 這一層同時被瀏覽器的表單與 Route Handler 引用，所以不能碰到任何金鑰或 node 模組：
 * 前端用它做即時驗證，後端再用同一份規則擋掉繞過前端的請求。
 *
 * 金流走 PAYUNi（統一金流）。不開發票；付款成功後依信箱寄感謝信。
 */

/** PAYUNi 商品說明用這個名稱，帳務上看得出是贊助而不是商品銷售。 */
export const SPONSOR_PRODUCT_NAME = "贊助天天 daily";

/**
 * 各支付工具的金額上下限，來自 PAYUNi「交易訂單金額限制說明」。
 * 超出範圍 PAYUNi 會直接退掉，所以在送出前就先擋。
 */
export const SPONSOR_METHODS = [
  {
    id: "credit",
    label: "信用卡",
    hint: "Visa／MasterCard／JCB／銀聯，付款完成即生效",
    min: 1,
    max: 199_999,
  },
  {
    id: "atm",
    label: "ATM 轉帳",
    hint: "取得虛擬帳號後轉帳，入帳後才算完成",
    min: 15,
    max: 49_999,
  },
  {
    id: "cvs",
    label: "超商代碼",
    hint: "到 7-ELEVEN 多媒體機列印繳費單付款",
    min: 30,
    max: 20_000,
  },
] as const;

export type SponsorMethod = (typeof SPONSOR_METHODS)[number]["id"];

export function getMethod(id: SponsorMethod) {
  return SPONSOR_METHODS.find((method) => method.id === id) ?? SPONSOR_METHODS[0];
}

/** 快選金額。金額本身可以自己填，這裡只是省下打字。 */
export const PRESET_AMOUNTS = [100, 300, 500, 1000] as const;

export interface SponsorInput {
  amount: number;
  method: SponsorMethod;
  /** 顯示用的稱呼，留空視為匿名。 */
  name: string;
  /** 必填：付款成功後寄感謝信，送使用建議也會用到。 */
  email: string;
  message: string;
}

export function createSponsorInput(): SponsorInput {
  return {
    amount: 300,
    method: "credit",
    name: "",
    email: "",
    message: "",
  };
}

export type SponsorField = keyof SponsorInput;
export type SponsorErrors = Partial<Record<SponsorField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MESSAGE_MAX = 500;

function validateContact(input: Pick<SponsorInput, "name" | "email" | "message">, emailHint: string) {
  const errors: SponsorErrors = {};
  const email = input.email.trim();
  if (email.length === 0) {
    errors.email = emailHint;
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "信箱格式看起來不對。";
  }
  if (input.name.trim().length > 20) errors.name = "稱呼請在 20 個字以內。";
  if (input.message.trim().length > MESSAGE_MAX) {
    errors.message = `留言請在 ${MESSAGE_MAX} 個字以內。`;
  }
  return errors;
}

/** 前後端共用的驗證。回傳空物件代表可以送出。 */
export function validateSponsor(input: SponsorInput): SponsorErrors {
  const errors: SponsorErrors = validateContact(
    input,
    "請填寫信箱，付款成功後會寄感謝信給你。",
  );
  const method = getMethod(input.method);

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    errors.amount = "請填寫 1 元以上的整數金額。";
  } else if (input.amount < method.min || input.amount > method.max) {
    errors.amount = `${method.label}可接受的金額是 ${method.min.toLocaleString("zh-TW")}～${method.max.toLocaleString("zh-TW")} 元。`;
  }

  return errors;
}

/** 不付款、只送使用建議。信箱與留言必填。 */
export function validateFeedback(input: SponsorInput): SponsorErrors {
  const errors = validateContact(input, "請填寫信箱，方便我們回覆建議。");
  if (input.message.trim().length === 0) {
    errors.message = "請寫下使用建議或想告訴我們的話。";
  }
  return errors;
}

export function hasErrors(errors: SponsorErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function formatAmount(amount: number): string {
  return `NT$ ${amount.toLocaleString("zh-TW")}`;
}

/** 這幾個 id 直接對應 PAYUNi 的 PaymentType，結果頁要靠它決定顯示繳費資訊。 */
export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  "1": "信用卡",
  "2": "ATM 轉帳",
  "3": "超商代碼",
  "6": "icash Pay",
  "7": "AFTEE 先享後付",
  "9": "LINE Pay",
  "11": "街口支付",
};
