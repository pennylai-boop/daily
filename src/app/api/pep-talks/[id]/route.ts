import { NextResponse } from "next/server";

import { deleteSharedPepTalk } from "@/server/pep-talks";
import { requireUser } from "@/server/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "缺少金句。" }, { status: 400 });

  try {
    const result = await deleteSharedPepTalk(auth.userId, id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[pep-talks] DELETE", error);
    return NextResponse.json({ error: "暫時無法刪除。" }, { status: 500 });
  }
}
