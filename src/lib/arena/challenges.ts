import "server-only";
import { CONCEPTS_BY_ID, CURRICULUM, type Concept } from "@/data/curriculum";
import { db, must } from "@/lib/db";
import { acquireLock, getDayContext, isLocked, loadProgress, releaseLock } from "@/lib/engine/drill";
import { dayFloor, maxTier } from "@/lib/engine/scheduler";
import { embed, structured, toVector } from "@/lib/openai";
import { runTests } from "@/lib/sandbox";
import { CHALLENGE_SCHEMA, CHALLENGE_SYSTEM_PROMPT, challengeUserPrompt } from "@/lib/arena/prompts";
import type { Track } from "@/lib/tracks";
import type { ArenaTest, ChallengeKind, ChallengeRow, TestResult } from "@/lib/types";

const DUPLICATE_THRESHOLD = 0.9;
const KINDS: ChallengeKind[] = ["build", "debug"];

interface ChallengeDraft {
  title: string;
  function_name: string;
  description: string;
  starter_code: string;
  reference_solution: string;
  tests: { name: string; input_json: string; expected_json: string; hidden: boolean }[];
  hints: string[];
  concepts: string[];
}

export const CHALLENGE_COLUMNS =
  "id, day, kind, track, title, difficulty, description, function_name, starter_code, reference_solution, tests, hints, concepts, status, best_code, attempts, solved_at, created_at";

// ── Picking today's challenge parameters ────────────────────────────────────

async function arenaDifficulty(kind: ChallengeKind, dayNumber: number): Promise<number> {
  const recent = must(
    await db().from("challenges").select("status").eq("kind", kind).order("day", { ascending: false }).limit(3),
    "load recent challenges",
  ) as { status: string }[];
  let level = dayFloor(dayNumber);
  if (recent.length === 3 && recent.every((r) => r.status === "solved")) level += 1;
  if (recent.slice(0, 2).length === 2 && recent.slice(0, 2).every((r) => r.status !== "solved")) level -= 1;
  return Math.max(1, Math.min(5, level));
}

/** Weakest concepts you've already met in this track — the arena reinforces what the drill is teaching. */
async function focusConcepts(track: Track, dayNumber: number): Promise<Concept[]> {
  const progress = (await loadProgress())
    .filter((p) => p.track === track && CONCEPTS_BY_ID[p.concept_id])
    .sort((a, b) => a.box - b.box);
  const learning = progress.slice(0, 4).map((p) => CONCEPTS_BY_ID[p.concept_id]);
  if (learning.length) return learning;
  return CURRICULUM.filter((c) => c.track === track && c.tier <= maxTier(dayNumber)).slice(0, 4);
}

async function recentTitles(): Promise<string[]> {
  const rows = must(
    await db().from("challenges").select("title, description").order("created_at", { ascending: false }).limit(20),
    "load challenge history",
  ) as { title: string; description: string }[];
  return rows.map((r) => `${r.title}: ${r.description.replace(/\s+/g, " ").slice(0, 120)}`);
}

// ── Generation with automatic validation ────────────────────────────────────

function parseTests(draft: ChallengeDraft): ArenaTest[] | string {
  const tests: ArenaTest[] = [];
  for (const t of draft.tests) {
    try {
      const input = JSON.parse(t.input_json);
      if (!Array.isArray(input)) return `test "${t.name}": input_json must be a JSON array of arguments`;
      tests.push({ name: t.name, input, expected: JSON.parse(t.expected_json), hidden: t.hidden });
    } catch {
      return `test "${t.name}": input_json/expected_json is not valid JSON`;
    }
  }
  if (tests.length < 6) return "write at least 8 tests";
  return tests;
}

async function validate(draft: ChallengeDraft, kind: ChallengeKind): Promise<ArenaTest[] | string> {
  if (!/^[A-Za-z_$][\w$]*$/.test(draft.function_name)) return "function_name must be a valid identifier";
  const parsed = parseTests(draft);
  if (typeof parsed === "string") return parsed;
  let tests = parsed;

  const reference = await runTests(draft.reference_solution, draft.function_name, tests);
  if (reference.fatal) return `reference_solution does not run: ${reference.fatal}`;
  const failing = reference.results.filter((r) => !r.passed);
  if (failing.length) {
    // A couple of bad expectations: drop them. More than that: the reference itself is suspect.
    if (failing.length > 2 || tests.length - failing.length < 6) {
      return failing
        .slice(0, 4)
        .map((f) => `test "${f.name}": reference returned ${f.actual ?? f.error} but expected_json says otherwise`)
        .join("\n");
    }
    const bad = new Set(failing.map((f) => f.name));
    tests = tests.filter((t) => !bad.has(t.name));
  }

  if (kind === "debug") {
    const buggy = await runTests(draft.starter_code, draft.function_name, tests);
    if (buggy.fatal) return `buggy starter_code must run (logic bug, not a crash on load): ${buggy.fatal}`;
    if (buggy.results.every((r) => r.passed)) return "the bug in starter_code is not caught by any test";
    if (!buggy.results.some((r, i) => r.passed && !tests[i].hidden)) {
      return "the buggy starter_code should still pass at least one visible test";
    }
  }

  if (tests.filter((t) => !t.hidden).length < 2) tests = tests.map((t, i) => (i < 3 ? { ...t, hidden: false } : t));
  return tests;
}

async function generateChallenge(kind: ChallengeKind, day: string, dayNumber: number, track: Track) {
  const [difficulty, concepts, avoid] = await Promise.all([
    arenaDifficulty(kind, dayNumber),
    focusConcepts(track, dayNumber),
    recentTitles(),
  ]);

  let feedback: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const draft = await structured<ChallengeDraft>({
      system: CHALLENGE_SYSTEM_PROMPT,
      user: challengeUserPrompt({ kind, track, difficulty, dayNumber, concepts, avoid, feedback }),
      schemaName: "challenge",
      schema: CHALLENGE_SCHEMA,
      reasoningEffort: "medium",
    });

    const tests = await validate(draft, kind);
    if (typeof tests === "string") {
      console.warn(`[arena] ${kind} attempt ${attempt + 1} rejected: ${tests}`);
      feedback = tests;
      continue;
    }

    const [vector] = await embed([`${draft.title}\n${draft.description}`]);
    const matches = must(
      await db().rpc("match_challenges", { query_embedding: toVector(vector), match_count: 1 }),
      "match challenges",
    ) as { title: string; similarity: number }[];
    if (matches[0] && matches[0].similarity > DUPLICATE_THRESHOLD) {
      feedback = `too similar to an earlier challenge ("${matches[0].title}") — pick a different problem`;
      avoid.push(matches[0].title);
      continue;
    }

    const { error } = await db()
      .from("challenges")
      .insert({
        day,
        kind,
        track,
        title: draft.title,
        difficulty,
        description: draft.description,
        function_name: draft.function_name,
        starter_code: draft.starter_code,
        reference_solution: draft.reference_solution,
        tests,
        hints: draft.hints.slice(0, 3),
        concepts: draft.concepts.filter((c) => CONCEPTS_BY_ID[c]),
        embedding: toVector(vector),
      });
    if (error && !error.message.includes("duplicate")) throw new Error(`save challenge: ${error.message}`);
    return;
  }
  throw new Error(`Could not generate a valid ${kind} challenge: ${feedback}`);
}

/** Generates whichever of today's two challenges don't exist yet. */
export async function ensureTodayChallenges(): Promise<{ status: "ready" | "generating"; error?: string }> {
  const ctx = await getDayContext();
  const existing = await challengesForDay(ctx.today);
  const missing = KINDS.filter((k) => !existing.some((c) => c.kind === k));
  if (!missing.length) return { status: "ready" };

  const lockKey = `arena:${ctx.today}`;
  if (!(await acquireLock(lockKey))) return { status: "generating" };
  try {
    const tracks = ctx.state.enabled_tracks;
    const trackFor = (kind: ChallengeKind): Track =>
      tracks[(ctx.dayNumber + (kind === "debug" ? 2 : 0)) % tracks.length];
    const results = await Promise.allSettled(
      missing.map((kind) => generateChallenge(kind, ctx.today, ctx.dayNumber, trackFor(kind))),
    );
    const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    return failed ? { status: "ready", error: String(failed.reason?.message ?? failed.reason) } : { status: "ready" };
  } finally {
    await releaseLock(lockKey);
  }
}

export async function arenaGenerating(): Promise<boolean> {
  const ctx = await getDayContext();
  return isLocked(`arena:${ctx.today}`);
}

// ── Reading and solving ─────────────────────────────────────────────────────

export async function challengesForDay(day: string): Promise<ChallengeRow[]> {
  return must(
    await db().from("challenges").select(CHALLENGE_COLUMNS).eq("day", day).order("kind"),
    "load challenges",
  ) as unknown as ChallengeRow[];
}

export async function getChallenge(id: string): Promise<ChallengeRow | null> {
  const { data } = await db().from("challenges").select(CHALLENGE_COLUMNS).eq("id", id).maybeSingle();
  return (data as unknown as ChallengeRow) ?? null;
}

/** What the browser gets: hidden tests are reduced to their names, the solution only once you're done. */
export function publicChallenge(c: ChallengeRow) {
  return {
    id: c.id,
    day: c.day,
    kind: c.kind,
    track: c.track,
    title: c.title,
    difficulty: c.difficulty,
    description: c.description,
    functionName: c.function_name,
    starterCode: c.starter_code,
    visibleTests: c.tests.filter((t) => !t.hidden),
    hiddenTestCount: c.tests.filter((t) => t.hidden).length,
    hints: c.hints,
    concepts: c.concepts.map((id) => CONCEPTS_BY_ID[id]?.name ?? id),
    status: c.status,
    bestCode: c.best_code,
    attempts: c.attempts,
    solution: c.status === "open" ? null : c.reference_solution,
  };
}
export type PublicChallenge = ReturnType<typeof publicChallenge>;

export async function submitChallenge(id: string, code: string) {
  const challenge = await getChallenge(id);
  if (!challenge) throw new Error("Challenge not found.");
  const run = await runTests(code, challenge.function_name, challenge.tests);
  const results: TestResult[] = run.results.map((r, i) => {
    const test = challenge.tests[i];
    return test.hidden
      ? { name: r.name, passed: r.passed, hidden: true, error: r.passed ? undefined : r.error, ms: r.ms }
      : { ...r, hidden: false, input: test.input, expected: test.expected };
  });
  const passed = !run.fatal && results.length === challenge.tests.length && results.every((r) => r.passed);

  const update: Record<string, unknown> = { attempts: challenge.attempts + 1 };
  if (passed && challenge.status === "open") {
    Object.assign(update, { status: "solved", solved_at: new Date().toISOString(), best_code: code });
  } else if (challenge.status === "open") {
    update.best_code = code;
  }
  await db().from("challenges").update(update).eq("id", id);

  return {
    passed,
    fatal: run.fatal ?? null,
    results,
    logs: run.logs,
    solution: passed ? challenge.reference_solution : null,
  };
}

export async function revealChallenge(id: string, code: string | null) {
  const challenge = await getChallenge(id);
  if (!challenge) throw new Error("Challenge not found.");
  if (challenge.status === "open") {
    await db()
      .from("challenges")
      .update({ status: "revealed", ...(code ? { best_code: code } : {}) })
      .eq("id", id);
  }
  return { solution: challenge.reference_solution };
}
