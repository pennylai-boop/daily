import { ADFREE_DAYS } from "@/lib/adfree";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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
