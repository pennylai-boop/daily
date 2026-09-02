import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 給 Supabase Auth 用的 LINE userinfo 代理。
 *
 * LINE 的 /v2/profile 回的是 userId，不是 OAuth2 慣例的 sub。
 * Supabase 的 attribute_mapping 是在把 JSON 解進 Claims 之後才套用，
 * userId 這種非標準欄位那時候已經被丟掉，所以 mapping 設了也一樣
 * missing provider id（supabase/auth#2519，PR #2528 尚未上線）。
 *
 * 這裡在進 Supabase 之前先轉成 sub／name／picture。
 * 這個 URL 是給 Supabase 伺服器打的，必須是公開網址，不能是 localhost。
 */
export async function GET(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "missing access token" }, { status: 401 });
  }

  const response = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: authorization },
    cache: "no-store",
  });
  const profile = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    return NextResponse.json(profile, { status: response.status });
  }

  const userId = typeof profile.userId === "string" ? profile.userId : "";
  if (!userId) {
    return NextResponse.json({ error: "LINE profile missing userId" }, { status: 502 });
  }

  return NextResponse.json({
    sub: userId,
    name: typeof profile.displayName === "string" ? profile.displayName : "",
    picture: typeof profile.pictureUrl === "string" ? profile.pictureUrl : "",
    userId,
    displayName: profile.displayName ?? "",
    pictureUrl: profile.pictureUrl ?? "",
  });
}
