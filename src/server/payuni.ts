/**
 * PAYUNi（統一金流）整合式支付頁 UNiPaypage (UPP) 的伺服器端串接。
 *
 * 加解密規則出自 docs/PAYUNi_API_金流物流串接資料.md：
 * - EncryptInfo：把參數組成 query string 後以 AES-256-GCM 加密，
 *   密文與 authTag 用 ":::" 串起來再轉成 hex。
 * - HashInfo：SHA256(HashKey + EncryptInfo + HashIV)，全大寫。
 *
 * HashKey／HashIV 只能留在伺服器端，所以這個模組不可以被 client component 匯入。
 */

import crypto from "node:crypto";

import { SPONSOR_PRODUCT_NAME, type SponsorMethod } from "@/lib/support";

const UPP_URL = {
  sandbox: "https://sandbox-api.payuni.com.tw/api/upp",
  production: "https://api.payuni.com.tw/api/upp",
} as const;

export interface PayuniConfig {
  merId: string;
  hashKey: string;
  hashIv: string;
  uppUrl: string;
  siteUrl: string;
}

/** 未設定時回傳 null，讓頁面能顯示「金流尚未設定」而不是整站 500。 */
export function payuniConfig(): PayuniConfig | null {
  const merId = process.env.PAYUNI_MER_ID?.trim();
  const hashKey = process.env.PAYUNI_HASH_KEY?.trim();
  const hashIv = process.env.PAYUNI_HASH_IV?.trim();
  if (!merId || !hashKey || !hashIv) return null;

  // AES-256-GCM 的 key 必須 32 bytes、iv 必須 16 bytes，PAYUNi 後台給的就是這個長度。
  if (hashKey.length !== 32 || hashIv.length !== 16) {
    console.error("[payuni] HashKey 需為 32 字元、HashIV 需為 16 字元，請檢查環境變數。");
    return null;
  }

  const env = process.env.PAYUNI_ENV === "production" ? "production" : "sandbox";
  return {
    merId,
    hashKey,
    hashIv,
    uppUrl: UPP_URL[env],
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  };
}

export function isPayuniConfigured(): boolean {
  return payuniConfig() !== null;
}

export function encryptInfo(data: Record<string, string | number>, config: PayuniConfig): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value === "" || value === undefined || value === null) continue;
    params.set(key, String(value));
  }

  const cipher = crypto.createCipheriv("aes-256-gcm", config.hashKey, Buffer.from(config.hashIv));
  let cipherText = cipher.update(params.toString(), "utf8", "base64");
  cipherText += cipher.final("base64");
  const tag = cipher.getAuthTag().toString("base64");

  return Buffer.from(`${cipherText}:::${tag}`).toString("hex");
}

export function decryptInfo(encrypted: string, config: PayuniConfig): Record<string, string> {
  const [cipherText, tag] = Buffer.from(encrypted, "hex").toString().split(":::");
  const decipher = crypto.createDecipheriv("aes-256-gcm", config.hashKey, Buffer.from(config.hashIv));
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  let plain = decipher.update(cipherText, "base64", "utf8");
  plain += decipher.final("utf8");

  return Object.fromEntries(new URLSearchParams(plain));
}

export function hashInfo(encrypted: string, config: PayuniConfig): string {
  return crypto
    .createHash("sha256")
    .update(`${config.hashKey}${encrypted}${config.hashIv}`)
    .digest("hex")
    .toUpperCase();
}

/** MerTradeNo 限 25 字、只能 [A-Za-z0-9_-]，10 分鐘內不可重複。 */
export function createMerTradeNo(): string {
  const now = new Date();
  const stamp = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `DS${stamp}${random}`;
}

/** UPP 用 form post 從瀏覽器送出，所以這裡只組欄位，實際 submit 由前端做。 */
export interface UppRequest {
  action: string;
  fields: Record<string, string>;
}

export function buildUppRequest(params: {
  config: PayuniConfig;
  merTradeNo: string;
  amount: number;
  method: SponsorMethod;
  email: string;
}): UppRequest {
  const { config, merTradeNo, amount, method, email } = params;

  const payload: Record<string, string | number> = {
    MerID: config.merId,
    MerTradeNo: merTradeNo,
    TradeAmt: amount,
    Timestamp: Math.floor(Date.now() / 1000),
    ProdDesc: SPONSOR_PRODUCT_NAME,
    ReturnURL: `${config.siteUrl}/api/support/return`,
    NotifyURL: `${config.siteUrl}/api/support/notify`,
    BackURL: `${config.siteUrl}/support`,
    Lang: "zh-tw",
  };

  // 只開啟使用者選的那一種支付工具，付款頁就不會出現其他選項。
  if (method === "credit") payload.Credit = 1;
  if (method === "atm") payload.ATM = 1;
  if (method === "cvs") payload.CVS = 1;

  if (email) payload.UsrMail = email;

  const encrypted = encryptInfo(payload, config);

  return {
    action: config.uppUrl,
    fields: {
      MerID: config.merId,
      Version: "2.0",
      EncryptInfo: encrypted,
      HashInfo: hashInfo(encrypted, config),
    },
  };
}

export interface PayuniCallback {
  /** SUCCESS / UNKNOWN / UNAPPROVED 或錯誤代碼。 */
  status: string;
  message: string;
  merTradeNo: string;
  tradeNo: string;
  tradeAmt: number;
  /** 0=取號成功 1=已付款 2=付款失敗 3=付款取消 8=訂單待確認 */
  tradeStatus: string;
  paymentType: string;
  /** ATM 虛擬帳號或超商繳費代碼。 */
  payNo: string;
  bankType: string;
  expireDate: string;
  raw: Record<string, string>;
}

/**
 * 驗證並解開 PAYUNi 的回傳（ReturnURL 前景與 NotifyURL 背景格式相同）。
 * HashInfo 比對不過就當作偽造，直接回 null。
 */
export function parsePayuniCallback(
  form: URLSearchParams | FormData,
  config: PayuniConfig,
): PayuniCallback | null {
  const get = (key: string) => String(form.get(key) ?? "");
  const encrypted = get("EncryptInfo");
  const hash = get("HashInfo");
  if (!encrypted || !hash) return null;

  const expected = hashInfo(encrypted, config);
  const received = hash.toUpperCase();
  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))
  ) {
    console.error("[payuni] HashInfo 不符，忽略這筆回傳。");
    return null;
  }

  let data: Record<string, string>;
  try {
    data = decryptInfo(encrypted, config);
  } catch (error) {
    console.error("[payuni] EncryptInfo 解密失敗。", error);
    return null;
  }

  return {
    status: data.Status ?? get("Status"),
    message: data.Message ?? "",
    merTradeNo: data.MerTradeNo ?? "",
    tradeNo: data.TradeNo ?? "",
    tradeAmt: Number(data.TradeAmt ?? 0),
    tradeStatus: data.TradeStatus ?? "",
    paymentType: data.PaymentType ?? "",
    payNo: data.PayNo ?? "",
    bankType: data.BankType ?? "",
    expireDate: data.ExpireDate ?? "",
    raw: data,
  };
}

/** 信用卡授權成功（TradeStatus=1）才算真的收到錢；ATM／超商只是取號。 */
export function isPaid(callback: PayuniCallback): boolean {
  return callback.status === "SUCCESS" && callback.tradeStatus === "1";
}
