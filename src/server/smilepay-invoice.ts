/**
 * SmilePay（速買配）電子發票開立。
 *
 * 規格見 docs/smilepay-api.md。幾個踩過的地雷寫在那份文件第 6 節，這裡照著做：
 * - `DonateMark` 是必填，非捐贈也要明確傳 "0"，否則回 -10044。
 * - `data_id` 與 `orderid` 都填 PAYUNi 的 MerTradeNo，同期別重複開立會被 -10072 擋掉，
 *   等於天然的重複開票保護。
 * - 回應是 XML 而不是 JSON，`<Status>0</Status>` 才算成功。
 *
 * Grvc／Verify_key 只能留在伺服器端，所以這個模組不可以被 client component 匯入。
 */

import type { InvoiceInput } from "@/lib/invoice";

const API_URL = {
  test: "https://ssl.smse.com.tw/api_test/SPEinvoice_Storage.asp",
  production: "https://ssl.smse.com.tw/api/SPEinvoice_Storage.asp",
} as const;

interface SmilePayConfig {
  grvc: string;
  verifyKey: string;
  apiUrl: string;
}

/** 未設定時回傳 null，讓付款流程照樣走完，只是不開票（錯誤記在訂單上）。 */
export function smilePayConfig(): SmilePayConfig | null {
  const grvc = process.env.SMILEPAY_GRVC?.trim();
  const verifyKey = process.env.SMILEPAY_VERIFY_KEY?.trim();
  if (!grvc || !verifyKey) return null;

  const env = process.env.SMILEPAY_ENV === "production" ? "production" : "test";
  return { grvc, verifyKey, apiUrl: API_URL[env] };
}

export type InvoiceResult =
  | { ok: true; invoiceNumber: string; randomNumber: string }
  | { ok: false; message: string };

export async function issueInvoice(params: {
  merTradeNo: string;
  /** 含稅總金額，必須與 PAYUNi 實際收款金額一致。 */
  amount: number;
  description: string;
  email: string;
  invoice: InvoiceInput;
}): Promise<InvoiceResult> {
  const config = smilePayConfig();
  if (!config) {
    return { ok: false, message: "尚未設定 SMILEPAY_GRVC／SMILEPAY_VERIFY_KEY，沒有開立發票。" };
  }

  const body = new URLSearchParams({
    Grvc: config.grvc,
    Verify_key: config.verifyKey,
    data_id: params.merTradeNo,
    orderid: params.merTradeNo,
    // 07＝一般稅額計算、1＝應稅。點數是應稅的一般商品。
    Intype: "07",
    TaxType: "1",
    DonateMark: params.invoice.kind === "donate" ? "1" : "0",
    Description: params.description,
    Quantity: "1",
    UnitPrice: String(params.amount),
    Unit: "式",
    Amount: String(params.amount),
    AllAmount: String(params.amount),
    // 單價已含稅。
    UnitTAX: "Y",
    Email: params.email,
  });

  switch (params.invoice.kind) {
    case "mobile":
      body.set("CarrierType", "3J0002");
      body.set("CarrierID", params.invoice.carrierId);
      body.set("CarrierID2", params.invoice.carrierId);
      break;
    case "donate":
      body.set("LoveKey", params.invoice.loveCode);
      break;
    case "company":
      body.set("Buyer_id", params.invoice.taxId);
      body.set("CompanyName", params.invoice.companyName);
      break;
    default:
      // 雲端發票：不指定載具，SmilePay 會寄到 Email。
      break;
  }

  let xml: string;
  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
      body,
    });
    xml = await response.text();
    if (!response.ok) {
      return { ok: false, message: `SmilePay HTTP ${response.status}: ${xml.slice(0, 200)}` };
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "開立發票連線失敗。" };
  }

  const status = tag(xml, "Status");
  if (status !== "0") {
    return {
      ok: false,
      message: `SmilePay ${status || "無回傳狀態"}: ${tag(xml, "Desc") || xml.slice(0, 200)}`,
    };
  }

  return {
    ok: true,
    invoiceNumber: tag(xml, "InvoiceNumber"),
    randomNumber: tag(xml, "RandomNumber"),
  };
}

/** 回應只有幾個固定標籤，用不著把 XML parser 拉進來。 */
function tag(xml: string, name: string): string {
  const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml);
  return match ? match[1].trim() : "";
}
