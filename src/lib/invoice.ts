/**
 * 電子發票的共用定義與驗證。
 *
 * 發票走 SmilePay（速買配），金流走 PAYUNi，是兩套不同的憑證與流程（見 docs/smilepay-api.md）。
 * 這一層前後端共用：表單即時驗證，Route Handler 再用同一份規則擋掉繞過前端的請求，
 * 所以不能碰任何金鑰或 node 模組。
 */

export type InvoiceKind = "cloud" | "mobile" | "donate" | "company";

export const INVOICE_KINDS: { id: InvoiceKind; label: string; hint: string }[] = [
  { id: "cloud", label: "雲端發票", hint: "發票寄到你的信箱，不用載具。" },
  { id: "mobile", label: "手機條碼", hint: "存進手機條碼載具，格式是斜線加 7 碼。" },
  { id: "donate", label: "捐贈", hint: "捐給社福團體，需要愛心碼。" },
  { id: "company", label: "公司統編", hint: "開三聯式發票，需要統一編號與公司名稱。" },
];

export interface InvoiceInput {
  kind: InvoiceKind;
  /** 手機條碼載具，例如 `/ABC1234`。 */
  carrierId: string;
  /** 愛心碼，3～7 位數字。 */
  loveCode: string;
  /** 統一編號，8 位數字。 */
  taxId: string;
  companyName: string;
}

export function createInvoiceInput(): InvoiceInput {
  return { kind: "cloud", carrierId: "", loveCode: "", taxId: "", companyName: "" };
}

export type InvoiceField = keyof InvoiceInput;
export type InvoiceErrors = Partial<Record<InvoiceField, string>>;

/** 手機條碼是「/」加 7 碼，可用字元只有數字、大寫英文與 . - + 。 */
const CARRIER_PATTERN = /^\/[0-9A-Z.\-+]{7}$/;
const LOVE_CODE_PATTERN = /^\d{3,7}$/;
const TAX_ID_PATTERN = /^\d{8}$/;

export function validateInvoice(input: InvoiceInput): InvoiceErrors {
  const errors: InvoiceErrors = {};

  if (input.kind === "mobile" && !CARRIER_PATTERN.test(input.carrierId.trim().toUpperCase())) {
    errors.carrierId = "手機條碼是「/」加 7 碼，例如 /ABC1234。";
  }

  if (input.kind === "donate" && !LOVE_CODE_PATTERN.test(input.loveCode.trim())) {
    errors.loveCode = "愛心碼是 3～7 位數字。";
  }

  if (input.kind === "company") {
    if (!TAX_ID_PATTERN.test(input.taxId.trim())) errors.taxId = "統一編號是 8 位數字。";
    if (!input.companyName.trim()) errors.companyName = "請填公司名稱。";
  }

  return errors;
}

export function hasInvoiceErrors(errors: InvoiceErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** 收斂成要存進訂單的形狀：只留這個發票類型用得到的欄位。 */
export function normalizeInvoice(input: InvoiceInput): InvoiceInput {
  const base = createInvoiceInput();
  switch (input.kind) {
    case "mobile":
      return { ...base, kind: "mobile", carrierId: input.carrierId.trim().toUpperCase() };
    case "donate":
      return { ...base, kind: "donate", loveCode: input.loveCode.trim() };
    case "company":
      return {
        ...base,
        kind: "company",
        taxId: input.taxId.trim(),
        companyName: input.companyName.trim().slice(0, 60),
      };
    default:
      return base;
  }
}

/** 從不可信的 JSON 讀回發票資訊（資料庫欄位是 jsonb）。 */
export function parseInvoice(value: unknown): InvoiceInput {
  if (!value || typeof value !== "object") return createInvoiceInput();
  const raw = value as Record<string, unknown>;
  const kind = raw.kind;

  return normalizeInvoice({
    kind: kind === "mobile" || kind === "donate" || kind === "company" ? kind : "cloud",
    carrierId: typeof raw.carrierId === "string" ? raw.carrierId : "",
    loveCode: typeof raw.loveCode === "string" ? raw.loveCode : "",
    taxId: typeof raw.taxId === "string" ? raw.taxId : "",
    companyName: typeof raw.companyName === "string" ? raw.companyName : "",
  });
}
