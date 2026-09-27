import { challengesForDay, ensureTodayChallenges, publicChallenge } from "@/lib/arena/challenges";
import { getDayContext } from "@/lib/engine/drill";
import { json } from "@/lib/http";

// Each challenge may take a few generate → run tests → regenerate rounds.
export const maxDuration = 300;

/** Generates today's build + debug challenges if they don't exist yet. */
export async function POST() {
  return json(async () => {
    const result = await ensureTodayChallenges();
    const { today } = await getDayContext();
    return { ...result, challenges: (await challengesForDay(today)).map(publicChallenge) };
  });
}
