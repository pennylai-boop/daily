/**
 * 分享邀請的跨使用者操作：接受邀請、組成「被分享紀錄」清單。
 *
 * 一律用 service role（src/lib/supabase-admin.ts）繞過 RLS，因為這裡本來就是唯一該碰到
 * 別人資料的地方；身分驗證改成自己拿 Bearer token 給 Supabase 認（見 requireUser）。
 * 前端呼叫時帶 `Authorization: Bearer <access_token>`（supabase.auth.getSession() 拿得到）。
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { DayEntry, SharedJournal, ShareScope } from "@/lib/types";

export type AuthResult =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; status: number; error: string };

export async function requireUser(request: Request): Promise<AuthResult> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "缺少登入憑證。" };

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return { ok: false, status: 401, error: "登入已過期，請重新登入。" };
  return { ok: true, userId: data.user.id, email: data.user.email ?? null };
}

/** 贊助／點數可以未登入下單；有帶 Bearer 就把訂單綁到帳號，付款紀錄才找得到。 */
export async function optionalUser(
  request: Request,
): Promise<{ userId: string; email: string | null } | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const auth = await requireUser(request);
  return auth.ok ? { userId: auth.userId, email: auth.email } : null;
}

type PeekResult =
  | { ok: true; ownerName: string; scope: ShareScope }
  | { ok: false; status: number; error: string };

/** 邀請落地頁用：不需要登入就能看發出邀請的人是誰、分享範圍是什麼，只是不能拿來接受。 */
export async function peekInvite(token: string): Promise<PeekResult> {
  const supabase = getSupabaseAdmin();

  const { data: invite } = await supabase
    .from("share_invites")
    .select("owner_id, scope, status")
    .eq("token", token)
    .maybeSingle();

  if (!invite || invite.status !== "pending") {
    return { ok: false, status: 404, error: "找不到這張邀請，可能已經被使用或過期。" };
  }

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", invite.owner_id)
    .maybeSingle();

  return { ok: true, ownerName: ownerProfile?.name || "對方", scope: invite.scope };
}

type AcceptResult = { ok: true; ownerName: string } | { ok: false; status: number; error: string };

export async function acceptInvite(userId: string, token: string): Promise<AcceptResult> {
  const supabase = getSupabaseAdmin();

  const { data: invite } = await supabase
    .from("share_invites")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!invite) return { ok: false, status: 404, error: "找不到這張邀請，可能已經被使用或過期。" };
  if (invite.owner_id === userId) {
    return { ok: false, status: 400, error: "不能接受自己發出的邀請。" };
  }

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("name, line_user_id, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const { error: shareError } = await supabase.from("shares").upsert({
    owner_id: invite.owner_id,
    viewer_id: userId,
    invite_token: token,
    name: invite.name || viewerProfile?.name || "",
    viewer_line_user_id: viewerProfile?.line_user_id ?? "",
    avatar_url: viewerProfile?.avatar_url ?? null,
    scope: invite.scope,
  });
  if (shareError) {
    console.error("[sharing] acceptInvite upsert shares", shareError);
    return { ok: false, status: 500, error: "接受邀請失敗，請稍後再試。" };
  }

  await supabase
    .from("share_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("token", token);

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", invite.owner_id)
    .maybeSingle();

  return { ok: true, ownerName: ownerProfile?.name || invite.name || "對方" };
}

interface DayEntryRow {
  date: string;
  mood: string | null;
  blocks: DayEntry["blocks"] | null;
  focus: DayEntry["focus"] | null;
  photos: DayEntry["photos"] | null;
  created_at: string;
  updated_at: string;
}

interface ShareRow {
  owner_id: string;
  viewer_id: string;
  name: string;
  scope: ShareScope;
}

/** 「被分享紀錄」頁：目前使用者身為 viewer 的每一段分享，組成可以直接渲染的 SharedJournal。 */
export async function fetchSharedJournals(userId: string): Promise<SharedJournal[]> {
  const supabase = getSupabaseAdmin();

  const { data: shares } = await supabase
    .from("shares")
    .select("owner_id, viewer_id, name, scope")
    .eq("viewer_id", userId);

  if (!shares || shares.length === 0) return [];

  const journals: SharedJournal[] = [];
  for (const share of shares as ShareRow[]) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", share.owner_id)
      .maybeSingle();

    // 兩種 scope 都整列查出來（Supabase 的 select() 對動態欄位字串沒辦法做型別推斷），
    // mood 範圍的書寫內容在下面組 entries 時就地丟掉，不會出現在回傳的 JSON 裡。
    const { data: rows } = await supabase
      .from("day_entries")
      .select("*")
      .eq("user_id", share.owner_id);

    const entries: DayEntry[] = ((rows ?? []) as DayEntryRow[]).map((row) => ({
      date: row.date,
      mood: row.mood,
      blocks: share.scope === "full" ? (row.blocks ?? []) : [],
      focus: share.scope === "full" ? (row.focus ?? []) : [],
      photos: share.scope === "full" ? (row.photos ?? []) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    journals.push({
      id: `${share.owner_id}:${share.viewer_id}`,
      ownerName: ownerProfile?.name || share.name || "對方",
      ownerLineUserId: "",
      emoji: "📓",
      scope: share.scope,
      entries,
    });
  }

  return journals;
}
