import type { NextRequest } from "next/server";
import { db, must } from "@/lib/db";
import { badRequest, json } from "@/lib/http";
import { isTrack } from "@/lib/tracks";

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { dailyQuestionCount?: number; enabledTracks?: string[] }
    | null;
  if (!body) return badRequest("Invalid body");

  const update: Record<string, unknown> = {};
  if (body.dailyQuestionCount !== undefined) {
    const count = Math.round(Number(body.dailyQuestionCount));
    if (!(count >= 4 && count <= 30)) return badRequest("Daily questions must be between 4 and 30");
    update.daily_question_count = count;
  }
  if (body.enabledTracks !== undefined) {
    const tracks = [...new Set(body.enabledTracks)].filter(isTrack);
    if (!tracks.length) return badRequest("Keep at least one track enabled");
    update.enabled_tracks = tracks;
  }
  return json(async () => {
    must(await db().from("app_state").update(update).eq("id", 1), "save settings");
    return { ok: true };
  });
}
