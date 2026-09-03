/**
 * PAYUNi 續期收款的幕後管理 API（不是支付頁，是伺服器對伺服器）。
 *
 * 規格見 docs/PAYUNi_API_金流物流串接資料.md：
 * - 續期收款狀態修改 period/mdfStatus：暫停／啟用／終止整張約定
 * - 續期收款訂單查詢 period/query：總期數、已扣期數與每期排程
 *
 * 請求與支付頁同一套加密（EncryptInfo + HashInfo），差別在這裡是我們自己送 POST、
 * 回應是 JSON，內層 EncryptInfo 解開後仍是 query string。文件要求帶 user-agent: payuni。
 *
 * 卡號修改（period/exchange）沒有實作：那個機制要另外向 PAYUNi 申請核准，
 * 而且文件沒有寫明回傳的變更網址欄位名稱，沒辦法照著寫。
 */

import { decryptInfo, encryptInfo, hashInfo, type PayuniConfig } from "@/server/payuni";

const API_BASE = {
  sandbox: "https://sandbox-api.payuni.com.tw/api",
  production: "https://api.payuni.com.tw/api",
} as const;

function apiBase(): string {
  return process.env.PAYUNI_ENV === "production" ? API_BASE.production : API_BASE.sandbox;
}

type ApiResult =
  | { ok: true; data: Record<string, string> }
  | { ok: false; message: string };

async function callPeriodApi(
  config: PayuniConfig,
  path: "mdfStatus" | "query",
  payload: Record<string, string | number>,
): Promise<ApiResult> {
  const encrypted = encryptInfo({ MerID: config.merId, ...payload }, config);

  const body = new URLSearchParams({
    MerID: config.merId,
    Version: "1.0",
    EncryptInfo: encrypted,
    HashInfo: hashInfo(encrypted, config),
  });

  let response: Response;
  try {
    response = await fetch(`${apiBase()}/period/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "user-agent": "payuni",
      },
      body,
      cache: "no-store",
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "連線 PAYUNi 失敗。" };
  }

  if (!response.ok) {
    return { ok: false, message: `PAYUNi 回應 HTTP ${response.status}` };
  }

  let outer: Record<string, unknown>;
  try {
    outer = (await response.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, message: "PAYUNi 回應不是 JSON。" };
  }

  const encryptedOut = typeof outer.EncryptInfo === "string" ? outer.EncryptInfo : "";
  if (!encryptedOut) {
    const status = typeof outer.Status === "string" ? outer.Status : "";
    const message = typeof outer.Message === "string" ? outer.Message : "";
    return { ok: false, message: `${status || "PAYUNi 未回傳 EncryptInfo"}${message ? `：${message}` : ""}` };
  }

  let data: Record<string, string>;
  try {
    data = decryptInfo(encryptedOut, config);
  } catch {
    return { ok: false, message: "PAYUNi 回應解密失敗。" };
  }

  if (data.Status !== "SUCCESS") {
    return { ok: false, message: `${data.Status ?? "FAIL"}：${data.Message ?? "沒有錯誤說明"}` };
  }

  return { ok: true, data };
}

/**
 * 終止整張續期約定，之後不再扣款。
 *
 * 已經付過的效期不受影響（那是 adfree_entitlements.expires_at 的事）。
 * 文件註明：終止後無法再啟用或暫停，要再訂閱就得重新建立一張約定。
 */
export async function endPeriodAgreement(
  config: PayuniConfig,
  periodTradeNo: string,
  merTradeNo?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const result = await callPeriodApi(config, "mdfStatus", {
    ReviseTradeStatus: "end",
    PeriodTradeNo: periodTradeNo,
    ...(merTradeNo ? { MerTradeNo: merTradeNo } : {}),
  });

  return result.ok ? { ok: true } : result;
}

export interface PeriodSchedule {
  period: number;
  /** 排定或實際的扣款時間，格式同 PAYUNi 回傳（YYYY-MM-DD HH:mm:ss）。 */
  expAuthAt: string;
  amount: number;
  /** 例如「授權完成」、「排程中」、「授權失敗」。 */
  statusDesc: string;
}

export interface PeriodAgreement {
  periodTradeNo: string;
  merTradeNo: string;
  totalTimes: number;
  alreadyTimes: number;
  schedule: PeriodSchedule[];
  /** 第一筆還沒授權的排程，用來顯示「下次扣款」。 */
  nextCharge: PeriodSchedule | null;
}

/**
 * 查一張約定的期數與排程。
 *
 * 解密後的 Result 是 `Result[0][Period]` 這種括號鍵名，URLSearchParams 會原樣留著，
 * 所以這裡自己把索引拆出來重組成陣列。
 */
export async function queryPeriodAgreement(
  config: PayuniConfig,
  periodTradeNo: string,
): Promise<{ ok: true; agreement: PeriodAgreement } | { ok: false; message: string }> {
  const result = await callPeriodApi(config, "query", { PeriodTradeNo: periodTradeNo });
  if (!result.ok) return result;

  const data = result.data;
  const rows = new Map<number, Record<string, string>>();

  for (const [key, value] of Object.entries(data)) {
    const match = /^Result\[(\d+)]\[(\w+)]$/.exec(key);
    if (!match) continue;
    const index = Number(match[1]);
    const row = rows.get(index) ?? {};
    row[match[2]] = value;
    rows.set(index, row);
  }

  const schedule: PeriodSchedule[] = [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => ({
      period: Number(row.Period ?? 0),
      expAuthAt: row.ExpAuthDT ?? "",
      amount: Number(row.Amt ?? 0),
      statusDesc: row.StatusDesc ?? "",
    }));

  // 已授權的期數會有 TradeNo，未授權的顯示 "-"；用 StatusDesc 判斷比對照 TradeNo 穩。
  const nextCharge = schedule.find((item) => !item.statusDesc.includes("完成")) ?? null;

  return {
    ok: true,
    agreement: {
      periodTradeNo: data.PeriodTradeNo ?? periodTradeNo,
      merTradeNo: data.MerTradeNo ?? "",
      totalTimes: Number(data.TotalTimes ?? 0),
      alreadyTimes: Number(data.AlreadyTimes ?? 0),
      schedule,
      nextCharge,
    },
  };
}
