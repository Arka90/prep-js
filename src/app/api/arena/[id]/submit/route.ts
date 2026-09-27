import type { NextRequest } from "next/server";
import { submitChallenge } from "@/lib/arena/challenges";
import { badRequest, json } from "@/lib/http";

export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  if (typeof body?.code !== "string" || !body.code.trim()) return badRequest("code is required");
  if (body.code.length > 50_000) return badRequest("Code is too long");
  return json(() => submitChallenge(id, body.code!));
}
