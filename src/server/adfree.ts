import { ADFREE_DAYS } from "@/lib/adfree";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * 無廣告訂閱的兩件事要分開看：
 * - `until`（expires_at）＝已經付過錢的效期，取消訂閱不會把它收回。
 * - `status`／`periodTradeNo`＝PAYUNi 那張續期約定還會不會繼續扣款。
 */
export interface AdFreeSubscription {
  until: string | null;
  status: "active" | "cancelled";
  periodTradeNo: string | null;
  cancelledAt: string | null;
  nextChargeAt: string | null;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
}

type EntitlementRow = {
  expires_at: string | null;
  status: string | null;
  period_trade_no: string | null;
  cancelled_at: string | null;
  next_charge_at: string | null;
  last_failure_at: string | null;
  last_failure_reason: string | null;
};

const COLUMNS =
  "expires_at, status, period_trade_no, cancelled_at, next_charge_at, last_failure_at, last_failure_reason";

export async function getAdFreeUntil(userId: string): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("adfree_entitlements")
    .select("expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[adfree] 查詢效期失敗：", error.message);
    return null;
  }
  return typeof data?.expires_at === "string" ? data.expires_at : null;
}

export async function getAdFreeSubscription(userId: string): Promise<AdFreeSubscription> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("adfree_entitlements")
    .select(COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[adfree] 查詢訂閱狀態失敗：", error.message);
  }

  const row = (data ?? null) as EntitlementRow | null;
  return {
    until: row?.expires_at ?? null,
    status: row?.status === "cancelled" ? "cancelled" : "active",
    periodTradeNo: row?.period_trade_no ?? null,
    cancelledAt: row?.cancelled_at ?? null,
    nextChargeAt: row?.next_charge_at ?? null,
    lastFailureAt: row?.last_failure_at ?? null,
    lastFailureReason: row?.last_failure_reason ?? null,
  };
}

/** 把效期往後加 30 天；已在期內則從原到期日接著算。 */
export async function extendAdFree(userId: string, email: string): Promise<string | null> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.rpc("extend_adfree_entitlement", {
    p_user_id: userId,
    p_email: email,
    p_days: ADFREE_DAYS,
  });

  if (error) {
    console.error("[adfree] 延長效期失敗：", error.message);
    return null;
  }
  return typeof data === "string" ? data : null;
}

/**
 * 每期授權成功後記下約定資訊。
 *
 * 一定要在 extendAdFree 之後呼叫（那支 RPC 負責建立列）。扣款成功代表這張約定是活的，
 * 所以順手把 status 復歸 active、清掉上一次的失敗紀錄。
 */
export async function recordAdFreeCharge(params: {
  userId: string;
  periodTradeNo: string | null;
  /** PAYUNi 回傳的 NextAuthDate，格式 YYYY-MM-DD；最後一期為空字串。 */
  nextAuthDate: string | null;
}): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("adfree_entitlements")
    .update({
      status: "active",
      cancelled_at: null,
      last_failure_at: null,
      last_failure_reason: null,
      next_charge_at: toTimestamp(params.nextAuthDate),
      ...(params.periodTradeNo ? { period_trade_no: params.periodTradeNo } : {}),
    })
    .eq("user_id", params.userId);

  if (error) console.error("[adfree] 記錄扣款狀態失敗：", error.message);
}

export async function markAdFreeCancelled(userId: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("adfree_entitlements")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      next_charge_at: null,
    })
    .eq("user_id", userId);

  if (error) console.error("[adfree] 標記取消失敗：", error.message);
}

export async function recordAdFreeFailure(userId: string, reason: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("adfree_entitlements")
    .update({
      last_failure_at: new Date().toISOString(),
      last_failure_reason: reason.slice(0, 300),
    })
    .eq("user_id", userId);

  if (error) console.error("[adfree] 記錄扣款失敗狀態失敗：", error.message);
}

/**
 * PAYUNi 的日期是台灣時間，補上時區才不會被當成 UTC 而差一天。
 * 文件沒寫明 NextAuthDate 的格式，而同一份通知的 AuthDay 用 YYYYMMDD，所以兩種都接；
 * 認不出來就回 null，只是畫面上不顯示下次扣款日，不影響扣款。
 */
function toTimestamp(date: string | null): string | null {
  const trimmed = date?.trim() ?? "";
  const compact = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}T00:00:00+08:00`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00+08:00`;
  return null;
}
