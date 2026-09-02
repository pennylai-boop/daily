import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { SharedPepTalk } from "@/lib/types";

const TEXT_MAX = 120;

type Row = {
  id: string;
  user_id: string;
  text: string;
  author_name: string;
  created_at: string;
};

function fromRow(row: Row): SharedPepTalk {
  return {
    id: row.id,
    text: row.text,
    userId: row.user_id,
    authorName: row.author_name,
    createdAt: row.created_at,
  };
}

export async function listSharedPepTalks(): Promise<SharedPepTalk[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("pep_talk_quotes")
    .select("id, user_id, text, author_name, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[pep-talks] 讀取失敗：", error.message);
    return [];
  }
  return (data ?? []).map((row) => fromRow(row as Row));
}

export async function addSharedPepTalk(input: {
  userId: string;
  authorName: string;
  text: string;
}): Promise<{ ok: true; quote: SharedPepTalk } | { ok: false; error: string; status: number }> {
  const text = input.text.trim();
  if (!text) return { ok: false, error: "請寫下一則金句。", status: 400 };
  if (text.length > TEXT_MAX) return { ok: false, error: `金句請在 ${TEXT_MAX} 個字以內。`, status: 400 };

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("pep_talk_quotes")
    .insert({
      user_id: input.userId,
      author_name: input.authorName.trim().slice(0, 40),
      text,
    })
    .select("id, user_id, text, author_name, created_at")
    .single();

  if (error || !data) {
    console.error("[pep-talks] 新增失敗：", error?.message);
    return { ok: false, error: "暫時無法新增，請稍後再試。", status: 500 };
  }
  return { ok: true, quote: fromRow(data as Row) };
}

export async function deleteSharedPepTalk(
  userId: string,
  id: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("pep_talk_quotes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[pep-talks] 刪除失敗：", error.message);
    return { ok: false, error: "暫時無法刪除，請稍後再試。", status: 500 };
  }
  if (!data) return { ok: false, error: "只能刪自己新增的金句。", status: 403 };
  return { ok: true };
}
