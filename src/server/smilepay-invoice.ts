/**
 * SmilePay（速買配）電子發票開立。
 *
 * 規格見 docs/smilepay-api.md。金流是 PAYUNi、發票是 SmilePay，兩套憑證各自獨立，
 * 開票時機固定在 PAYUNi 回報付款成功之後，避免沒收到錢就先開票。
 */

import { SPONSOR_PRODUCT_NAME } from "@/lib/support";

/** 舊版開票種類；贊助流程已改為不開發票，此模組目前未被呼叫。 */
type InvoiceKind = "cloud" | "mobile" | "donate" | "company";

const ENDPOINT = {
  test: "https://ssl.smse.com.tw/api_test/SPEinvoice_Storage.asp",
  production: "https://ssl.smse.com.tw/api/SPEinvoice_Storage.asp",
} as const;

interface SmilepayConfig {
  grvc: string;
  verifyKey: string;
  endpoint: string;
}

export function smilepayConfig(): SmilepayConfig | null {
  const grvc = process.env.SMILEPAY_GRVC?.trim();
  const verifyKey = process.env.SMILEPAY_VERIFY_KEY?.trim();
  if (!grvc || !verifyKey) return null;

  const env = process.env.SMILEPAY_ENV === "production" ? "production" : "test";
  return { grvc, verifyKey, endpoint: ENDPOINT[env] };
}

export function isSmilepayConfigured(): boolean {
  return smilepayConfig() !== null;
}

export interface InvoiceRequest {
  /** 同時放進 data_id 與 orderid，用來對帳並避免重複開立。 */
  orderNo: string;
  amount: number;
  kind: InvoiceKind;
  name: string;
  email: string;
  carrierId: string;
  loveCode: string;
  taxId: string;
  companyName: string;
}

export interface InvoiceResult {
  ok: boolean;
  /** SmilePay 的 Status，0 為成功。 */
  status: string;
  message: string;
  invoiceNumber?: string;
  invoiceDate?: string;
}

export async function issueInvoice(request: InvoiceRequest): Promise<InvoiceResult> {
  const config = smilepayConfig();
  if (!config) {
    return { ok: false, status: "unconfigured", message: "尚未設定 SmilePay 發票憑證。" };
  }

  const body = new URLSearchParams({
    Grvc: config.grvc,
    Verify_key: config.verifyKey,
    data_id: request.orderNo,
    orderid: request.orderNo,
    Intype: "07",
    TaxType: "1",
    // DonateMark 是必填，非捐贈時也要明確帶 "0"，否則 SmilePay 回 -10044。
    DonateMark: request.kind === "donate" ? "1" : "0",
    Description: SPONSOR_PRODUCT_NAME,
    Quantity: "1",
    UnitPrice: String(request.amount),
    Unit: "筆",
    Amount: String(request.amount),
    AllAmount: String(request.amount),
    UnitTAX: "Y",
  });

  if (request.kind === "donate") {
    body.set("LoveKey", request.loveCode.trim());
  }

  if (request.kind === "mobile") {
    body.set("CarrierType", "3J0002");
    body.set("CarrierID", request.carrierId.trim().toUpperCase());
    body.set("CarrierID2", request.carrierId.trim().toUpperCase());
  }

  if (request.kind === "company") {
    body.set("Buyer_id", request.taxId.trim());
    body.set("CompanyName", request.companyName.trim());
  }

  if (request.kind !== "company" && request.name.trim()) {
    body.set("Name", request.name.trim());
  }

  if (request.email.trim()) {
    body.set("Email", request.email.trim());
  }

  let xml: string;
  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: body.toString(),
      cache: "no-store",
    });
    xml = await response.text();
  } catch (error) {
    console.error("[smilepay] 開立發票請求失敗。", error);
    return { ok: false, status: "network", message: "呼叫 SmilePay 失敗。" };
  }

  const status = tag(xml, "Status");
  const result: InvoiceResult = {
    ok: status === "0",
    status,
    message: tag(xml, "Desc"),
    invoiceNumber: tag(xml, "InvoiceNumber") || undefined,
    invoiceDate: tag(xml, "InvoiceDate") || undefined,
  };

  if (!result.ok) {
    console.error(`[smilepay] 開立發票失敗：Status=${status} Desc=${result.message}`);
  }

  return result;
}

/** 回應是小段 XML，用正則取值就夠，不必為此加一個 XML 解析套件。 */
function tag(xml: string, name: string): string {
  const match = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml);
  return match ? match[1].trim() : "";
}
