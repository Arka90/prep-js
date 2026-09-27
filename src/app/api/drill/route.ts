import { ensureTodaySession, loadSessionQuestions } from "@/lib/engine/drill";
import { json } from "@/lib/http";

// Generating a day's drill calls the model once per track in parallel.
export const maxDuration = 300;

/** Returns today's drill, generating it on first request. */
export async function POST() {
  return json(async () => {
    const result = await ensureTodaySession();
    if (result.status === "generating") return { status: "generating" as const };
    return {
      status: "ready" as const,
      dayNumber: result.session.day_number,
      completed: result.session.status === "completed",
      questions: await loadSessionQuestions(result.session),
    };
  });
}
