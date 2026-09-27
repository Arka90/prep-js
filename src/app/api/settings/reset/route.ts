import type { NextRequest } from "next/server";
import { db, must } from "@/lib/db";
import { todayIn } from "@/lib/dates";
import { env } from "@/lib/env";
import { badRequest, json } from "@/lib/http";

/** Deletes every question, answer, challenge and all progress. Settings are kept. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { confirm?: string } | null;
  if (body?.confirm !== "RESET") return badRequest('Type RESET to confirm');
  return json(async () => {
    must(await db().rpc("reset_all_progress"), "reset progress");
    must(await db().from("app_state").update({ started_on: todayIn(env.timezone) }).eq("id", 1), "reset start day");
    return { ok: true };
  });
}
