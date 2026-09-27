import type { NextRequest } from "next/server";
import { revealChallenge } from "@/lib/arena/challenges";
import { json } from "@/lib/http";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  return json(() => revealChallenge(id, typeof body?.code === "string" ? body.code.slice(0, 50_000) : null));
}
