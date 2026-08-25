import { NextResponse } from "next/server";

import { fetchSharedJournals, requireUser } from "@/server/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const journals = await fetchSharedJournals(auth.userId);
  return NextResponse.json({ journals });
}
