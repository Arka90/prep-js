import "server-only";
import { CONCEPTS_BY_ID, CURRICULUM } from "@/data/curriculum";
import { db, must } from "@/lib/db";
import { addDays, todayIn } from "@/lib/dates";
import { env } from "@/lib/env";
import { getDayContext, isLocked, loadProgress } from "@/lib/engine/drill";
import { conceptStatus, dayFloor, maxTier, type ConceptStatus } from "@/lib/engine/scheduler";
import { TRACKS, type Track } from "@/lib/tracks";
import type { ChallengeRow, ConceptProgressRow, SessionRow } from "@/lib/types";

export interface TrackMastery {
  track: Track;
  total: number;
  counts: Record<ConceptStatus, number>;
}

function trackMastery(progress: ConceptProgressRow[], tracks: Track[]): TrackMastery[] {
  const byId = new Map(progress.map((p) => [p.concept_id, p]));
  return tracks.map((track) => {
    const counts: Record<ConceptStatus, number> = { unseen: 0, learning: 0, reviewing: 0, mastered: 0 };
    const concepts = CURRICULUM.filter((c) => c.track === track);
    concepts.forEach((c) => counts[conceptStatus(byId.get(c.id))]++);
    return { track, total: concepts.length, counts };
  });
}

function computeStreak(completedDays: Set<string>, today: string): number {
  let day = completedDays.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (completedDays.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** Just enough for the sidebar: which day it is and the current streak. */
export async function getShellInfo() {
  const ctx = await getDayContext();
  const sessions = must(
    await db().from("sessions").select("day").eq("status", "completed").gte("day", addDays(ctx.today, -400)),
    "load streak",
  ) as { day: string }[];
  return { dayNumber: ctx.dayNumber, streak: computeStreak(new Set(sessions.map((s) => s.day)), ctx.today) };
}

export async function getTodaySummary() {
  const ctx = await getDayContext();
  const since = addDays(ctx.today, -83);
  const [progress, sessionsRes, activityRes, challengesRes, drillLocked, arenaLocked] = await Promise.all([
    loadProgress(),
    db().from("sessions").select("id, day, status, question_ids").gte("day", addDays(ctx.today, -400)),
    db().rpc("answer_activity", { since: `${addDays(since, -1)}T00:00:00Z`, tz: env.timezone }),
    db()
      .from("challenges")
      .select("id, day, kind, track, title, difficulty, status, solved_at")
      .gte("day", since),
    isLocked(`drill:${ctx.today}`),
    isLocked(`arena:${ctx.today}`),
  ]);
  const sessions = must(sessionsRes, "load sessions") as Pick<SessionRow, "id" | "day" | "status" | "question_ids">[];
  const daily = must(activityRes, "load activity") as { day: string; answered: number; correct: number }[];
  const challenges = must(challengesRes, "load challenges") as Pick<
    ChallengeRow,
    "id" | "day" | "kind" | "track" | "title" | "difficulty" | "status" | "solved_at"
  >[];

  const todaySession = sessions.find((s) => s.day === ctx.today);
  const todayAnswers = todaySession
    ? (must(
        await db().from("answers").select("verdict").eq("session_id", todaySession.id),
        "load today's answers",
      ) as { verdict: string }[])
    : [];

  const activity = new Map<string, { answered: number; correct: number; solved: number }>();
  for (let i = 0; i < 84; i++) activity.set(addDays(since, i), { answered: 0, correct: 0, solved: 0 });
  for (const d of daily) {
    const cell = activity.get(d.day);
    if (cell) Object.assign(cell, { answered: d.answered, correct: d.correct });
  }
  for (const c of challenges) {
    if (c.status !== "solved" || !c.solved_at) continue;
    const cell = activity.get(todayIn(env.timezone, new Date(c.solved_at)));
    if (cell) cell.solved++;
  }

  const weakSpots = progress
    .filter((p) => CONCEPTS_BY_ID[p.concept_id] && p.last_result && p.last_result !== "correct")
    .sort((a, b) => a.box - b.box || (b.last_seen ?? "").localeCompare(a.last_seen ?? ""))
    .slice(0, 5)
    .map((p) => ({
      conceptId: p.concept_id,
      name: CONCEPTS_BY_ID[p.concept_id].name,
      track: p.track,
      misconception: p.misconceptions.at(-1) ?? null,
      accuracy: p.attempts ? p.correct / p.attempts : 0,
    }));

  return {
    today: ctx.today,
    dayNumber: ctx.dayNumber,
    difficultyFloor: dayFloor(ctx.dayNumber),
    unlockedTier: maxTier(ctx.dayNumber),
    streak: computeStreak(new Set(sessions.filter((s) => s.status === "completed").map((s) => s.day)), ctx.today),
    drill: {
      status: todaySession
        ? todaySession.status
        : drillLocked
          ? ("generating" as const)
          : ("none" as const),
      total: todaySession?.question_ids.length ?? ctx.state.daily_question_count,
      answered: todayAnswers.length,
      correct: todayAnswers.filter((a) => a.verdict === "correct").length,
    },
    dueCount: progress.filter((p) => p.next_due && p.next_due <= ctx.today).length,
    arena: {
      generating: arenaLocked,
      challenges: challenges.filter((c) => c.day === ctx.today).sort((a, b) => a.kind.localeCompare(b.kind)),
    },
    tracks: trackMastery(progress, ctx.state.enabled_tracks),
    weakSpots,
    activity: [...activity.entries()].map(([day, v]) => ({ day, ...v })),
  };
}
export type TodaySummary = Awaited<ReturnType<typeof getTodaySummary>>;

export async function getProgressOverview() {
  const ctx = await getDayContext();
  const [progress, sessionsRes, challengesRes] = await Promise.all([
    loadProgress(),
    db().from("sessions").select("id, day, day_number, status, question_ids").order("day", { ascending: false }).limit(30),
    db()
      .from("challenges")
      .select("id, day, kind, track, title, difficulty, status, attempts")
      .order("day", { ascending: false })
      .limit(30),
  ]);
  const byId = new Map(progress.map((p) => [p.concept_id, p]));
  const sessionRows = must(sessionsRes, "load sessions") as SessionRow[];
  const answers = must(
    await db()
      .from("answers")
      .select("session_id, verdict, score")
      .in("session_id", sessionRows.map((s) => s.id)),
    "load answers",
  ) as { session_id: string; verdict: string; score: number }[];
  const sessions = sessionRows.map((s) => {
    const mine = answers.filter((a) => a.session_id === s.id);
    return {
      day: s.day,
      dayNumber: s.day_number,
      status: s.status,
      total: s.question_ids.length,
      answered: mine.length,
      correct: mine.filter((a) => a.verdict === "correct").length,
      score: mine.length ? mine.reduce((sum, a) => sum + a.score, 0) / mine.length : 0,
    };
  });

  return {
    dayNumber: ctx.dayNumber,
    tracks: TRACKS.map((track) => ({
      track,
      enabled: ctx.state.enabled_tracks.includes(track),
      concepts: CURRICULUM.filter((c) => c.track === track).map((c) => {
        const p = byId.get(c.id);
        return {
          id: c.id,
          name: c.name,
          tier: c.tier,
          focus: c.focus,
          status: conceptStatus(p),
          box: p?.box ?? 0,
          level: p?.level ?? null,
          attempts: p?.attempts ?? 0,
          correct: p?.correct ?? 0,
          nextDue: p?.next_due ?? null,
          misconceptions: p?.misconceptions ?? [],
        };
      }),
    })),
    mastery: trackMastery(progress, TRACKS),
    sessions,
    challenges: must(challengesRes, "load challenges") as Pick<
      ChallengeRow,
      "id" | "day" | "kind" | "track" | "title" | "difficulty" | "status" | "attempts"
    >[],
  };
}
export type ProgressOverview = Awaited<ReturnType<typeof getProgressOverview>>;
