/**
 * 六十四卦參考筆記（admin 編輯，見 divination_hexagram_notes 表）。
 *
 * 查不到、查詢失敗、或表還沒建立（尚未跑 migration）都直接回傳 null，
 * 讓 analyzeHexagram 照舊只靠卦名解讀——這份筆記是加分，不是必需品。
 */
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function getHexagramNote(
  upperTrigramId: number,
  lowerTrigramId: number,
): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("divination_hexagram_notes")
      .select("reference_note")
      .eq("upper_trigram_id", upperTrigramId)
      .eq("lower_trigram_id", lowerTrigramId)
      .maybeSingle();

    if (error) {
      console.warn(`[divination-notes] 查詢失敗（忽略，不影響解卦）：${error.message}`);
      return null;
    }
    const note = data?.reference_note;
    return typeof note === "string" && note.trim() ? note.trim() : null;
  } catch (err) {
    console.warn(
      `[divination-notes] 查詢失敗（忽略，不影響解卦）：${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}
