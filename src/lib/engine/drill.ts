import "server-only";
import { CONCEPTS_BY_ID } from "@/data/curriculum";
import { db, must } from "@/lib/db";
import { daysBetween, todayIn } from "@/lib/dates";
import { env } from "@/lib/env";
import { gradeAnswer } from "@/lib/engine/grade";
import { generateQuestions, QUESTION_COLUMNS } from "@/lib/engine/questions";
import { applyResult, pickKind, planSession } from "@/lib/engine/scheduler";
import { isTrack, TRACKS } from "@/lib/tracks";
import type {
  AnswerRow,
  AppState,
  ConceptProgressRow,
  DrillQuestion,
  DrillResult,
  QuestionRow,
  SessionRow,
} from "@/lib/types";

// ── Day context ──────────────────────────────────────────────────────────────

export async function getAppState(): Promise<AppState> {
  const row = must(
    await db().from("app_state").select("started_on, daily_question_count, enabled_tracks").eq("id", 1).single(),
    "load app state",
  ) as AppState;
  const tracks = row.enabled_tracks.filter(isTrack);
  return { ...row, enabled_tracks: tracks.length ? tracks : TRACKS };
}

export interface DayContext {
  today: string;
  dayNumber: number;
  state: AppState;
}

export async function getDayContext(): Promise<DayContext> {
  const state = await getAppState();
  const today = todayIn(env.timezone);
  return { today, state, dayNumber: Math.max(1, daysBetween(state.started_on, today) + 1) };
}

// ── Locks (one generator per day, even with two tabs open) ───────────────────

const LOCK_TTL_MS = 5 * 60_000;

export async function acquireLock(key: string): Promise<boolean> {
  await db()
    .from("generation_locks")
    .delete()
    .eq("key", key)
    .lt("created_at", new Date(Date.now() - LOCK_TTL_MS).toISOString());
  const { error } = await db().from("generation_locks").insert({ key });
  return !error;
}

export async function releaseLock(key: string) {
  await db().from("generation_locks").delete().eq("key", key);
}

export async function isLocked(key: string): Promise<boolean> {
  const { data } = await db()
    .from("generation_locks")
    .select("key")
    .eq("key", key)
    .gt("created_at", new Date(Date.now() - LOCK_TTL_MS).toISOString())
    .maybeSingle();
  return Boolean(data);
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function getSession(day: string): Promise<SessionRow | null> {
  const { data } = await db().from("sessions").select("*").eq("day", day).maybeSingle();
  return (data as SessionRow) ?? null;
}

export async function loadProgress(): Promise<ConceptProgressRow[]> {
  return must(await db().from("concept_progress").select("*"), "load progress") as ConceptProgressRow[];
}

export type EnsureResult = { status: "ready"; session: SessionRow } | { status: "generating" };

/** Returns today's drill, generating it first if needed. Slow (tens of seconds) on first call. */
export async function ensureTodaySession(): Promise<EnsureResult> {
  const ctx = await getDayContext();
  const existing = await getSession(ctx.today);
  if (existing) return { status: "ready", session: existing };

  const lockKey = `drill:${ctx.today}`;
  if (!(await acquireLock(lockKey))) return { status: "generating" };
  try {
    const raced = await getSession(ctx.today);
    if (raced) return { status: "ready", session: raced };

    // First drill ever: day 1 is today, however long ago the database was set up.
    const { count } = await db().from("sessions").select("id", { count: "exact", head: true });
    if (!count) {
      await db().from("app_state").update({ started_on: ctx.today }).eq("id", 1);
      ctx.dayNumber = 1;
    }

    const slots = planSession({
      count: ctx.state.daily_question_count,
      tracks: ctx.state.enabled_tracks,
      dayNumber: ctx.dayNumber,
      today: ctx.today,
      progress: await loadProgress(),
    });
    const questions = await generateQuestions(slots, ctx.dayNumber);
    if (!questions.length) throw new Error("The AI could not produce any valid questions. Try again.");

    const session = must(
      await db()
        .from("sessions")
        .insert({ day: ctx.today, day_number: ctx.dayNumber, question_ids: questions.map((q) => q.id) })
        .select("*")
        .single(),
      "create session",
    ) as SessionRow;
    return { status: "ready", session };
  } finally {
    await releaseLock(lockKey);
  }
}

function toResult(q: QuestionRow, a: AnswerRow): DrillResult {
  return {
    response: a.response,
    verdict: a.verdict,
    score: a.score,
    feedback: a.feedback,
    misconception: a.misconception,
    answer: q.answer,
    explanation: q.explanation,
    keyPoints: q.key_points,
    verified: q.verified,
  };
}

function toDrillQuestion(q: QuestionRow, a: AnswerRow | undefined): DrillQuestion {
  return {
    id: q.id,
    track: q.track,
    conceptId: q.concept_id,
    conceptName: CONCEPTS_BY_ID[q.concept_id]?.name ?? q.concept_id,
    kind: q.kind,
    difficulty: q.difficulty,
    mode: q.mode,
    prompt: q.prompt,
    code: q.code,
    options: q.options,
    result: a ? toResult(q, a) : null,
  };
}

export async function loadSessionQuestions(session: SessionRow): Promise<DrillQuestion[]> {
  if (!session.question_ids.length) return [];
  const [questions, answers] = await Promise.all([
    db().from("questions").select(QUESTION_COLUMNS).in("id", session.question_ids),
    db().from("answers").select("*").eq("session_id", session.id),
  ]);
  const qById = new Map((must(questions, "load questions") as unknown as QuestionRow[]).map((q) => [q.id, q]));
  const aByQ = new Map((must(answers, "load answers") as AnswerRow[]).map((a) => [a.question_id, a]));
  return session.question_ids
    .map((id) => qById.get(id))
    .filter((q): q is QuestionRow => Boolean(q))
    .map((q) => toDrillQuestion(q, aByQ.get(q.id)));
}

// ── Answering ────────────────────────────────────────────────────────────────

async function loadQuestion(id: string): Promise<QuestionRow> {
  return must(
    await db().from("questions").select(QUESTION_COLUMNS).eq("id", id).single(),
    "load question",
  ) as unknown as QuestionRow;
}

export async function submitAnswer(input: {
  questionId: string;
  response: string;
  timeMs: number | null;
}): Promise<{ result: DrillResult; sessionCompleted: boolean }> {
  const ctx = await getDayContext();
  const session = await getSession(ctx.today);
  if (!session || !session.question_ids.includes(input.questionId)) {
    throw new Error("That question is not part of today's drill.");
  }
  const question = await loadQuestion(input.questionId);
  const { data: previous } = await db()
    .from("answers")
    .select("*")
    .eq("session_id", session.id)
    .eq("question_id", question.id)
    .maybeSingle();
  if (previous) return { result: toResult(question, previous as AnswerRow), sessionCompleted: session.status === "completed" };

  const grade = await gradeAnswer(question, input.response);
  const answer = must(
    await db()
      .from("answers")
      .insert({
        session_id: session.id,
        question_id: question.id,
        concept_id: question.concept_id,
        response: input.response,
        verdict: grade.verdict,
        score: grade.score,
        feedback: grade.feedback,
        misconception: grade.misconception,
        time_ms: input.timeMs,
      })
      .select("*")
      .single(),
    "save answer",
  ) as AnswerRow;

  const { data: current } = await db()
    .from("concept_progress")
    .select("*")
    .eq("concept_id", question.concept_id)
    .maybeSingle();
  const next = applyResult((current as ConceptProgressRow) ?? null, {
    conceptId: question.concept_id,
    track: question.track,
    verdict: grade.verdict,
    kind: question.kind,
    difficulty: question.difficulty,
    misconception: grade.misconception,
    today: ctx.today,
  });
  must(
    await db().from("concept_progress").upsert({ ...next, updated_at: new Date().toISOString() }),
    "update progress",
  );

  const { count } = await db()
    .from("answers")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session.id);
  const sessionCompleted = (count ?? 0) >= session.question_ids.length;
  if (sessionCompleted && session.status !== "completed") {
    await db()
      .from("sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", session.id);
  }
  return { result: toResult(question, answer), sessionCompleted };
}

/**
 * "Ask me again, differently": a fresh question on the same concept in another
 * format, aimed at the misconception just shown. Inserted right after the original.
 */
export async function createVariant(questionId: string): Promise<DrillQuestion> {
  const ctx = await getDayContext();
  const session = await getSession(ctx.today);
  if (!session || !session.question_ids.includes(questionId)) {
    throw new Error("That question is not part of today's drill.");
  }
  const original = await loadQuestion(questionId);
  const concept = CONCEPTS_BY_ID[original.concept_id];
  if (!concept) throw new Error("Unknown concept.");
  const { data: progress } = await db()
    .from("concept_progress")
    .select("misconceptions")
    .eq("concept_id", concept.id)
    .maybeSingle();

  const [variant] = await generateQuestions(
    [
      {
        concept,
        mode: "review",
        kind: pickKind(concept.track, original.kind, `${questionId}:${Date.now()}`),
        difficulty: original.difficulty,
        misconceptions: (progress?.misconceptions as string[] | undefined)?.slice(-3) ?? [],
      },
    ],
    ctx.dayNumber,
    { effort: "low" },
  );
  if (!variant) throw new Error("Couldn't produce a fresh variant this time. Try again.");

  const ids = [...session.question_ids];
  ids.splice(ids.indexOf(questionId) + 1, 0, variant.id);
  await db().from("sessions").update({ question_ids: ids, status: "active", completed_at: null }).eq("id", session.id);
  return toDrillQuestion(variant, undefined);
}
