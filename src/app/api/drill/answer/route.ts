import type { NextRequest } from "next/server";
import { submitAnswer } from "@/lib/engine/drill";
import { badRequest, json } from "@/lib/http";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { questionId?: string; response?: string; timeMs?: number }
    | null;
  if (!body?.questionId || typeof body.response !== "string") return badRequest("questionId and response are required");
  if (body.response.length > 8000) return badRequest("Answer is too long");
  return json(() =>
    submitAnswer({
      questionId: body.questionId!,
      response: body.response!,
      timeMs: typeof body.timeMs === "number" ? Math.round(body.timeMs) : null,
    }),
  );
}
