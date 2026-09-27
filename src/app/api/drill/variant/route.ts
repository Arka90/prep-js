import type { NextRequest } from "next/server";
import { createVariant } from "@/lib/engine/drill";
import { badRequest, json } from "@/lib/http";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { questionId?: string } | null;
  if (!body?.questionId) return badRequest("questionId is required");
  return json(async () => ({ question: await createVariant(body.questionId!) }));
}
