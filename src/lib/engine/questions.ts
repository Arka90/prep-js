import "server-only";
import { db, must } from "@/lib/db";
import { env } from "@/lib/env";
import { cosine, embed, structured, toVector } from "@/lib/openai";
import { canExecute, runSnippet } from "@/lib/sandbox";
import type { Slot } from "@/lib/engine/scheduler";
import { outputsMatch } from "@/lib/engine/grade";
import {
  QUESTION_SYSTEM_PROMPT,
  QUESTIONS_SCHEMA,
  REPAIR_SCHEMA,
  REPAIR_SYSTEM_PROMPT,
  questionUserPrompt,
} from "@/lib/engine/prompts";
import type { Track } from "@/lib/tracks";
import type { QuestionRow } from "@/lib/types";

/** Cosine similarity above which a new question counts as a repeat of an old one. */
const DUPLICATE_THRESHOLD = 0.92;
/** How many earlier questions per concept are shown to the model as "don't repeat". */
const AVOID_LIST_SIZE = 8;

interface Draft {
  slot: number;
  angle: string;
  prompt: string;
  code: string | null;
  options: string[] | null;
  answer: string;
  key_points: string[];
  explanation: string;
}

interface Candidate {
  slotIndex: number;
  slot: Slot;
  draft: Draft;
  verified: boolean;
  embedding?: number[];
}

type Insert = Omit<QuestionRow, "id" | "created_at"> & { embedding: string };

/** Last few questions per concept, summarised for the "previously asked" list. */
async function loadAvoidLists(conceptIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!conceptIds.length) return map;
  const rows = must(
    await db()
      .from("questions")
      .select("concept_id, prompt, code, angle")
      .in("concept_id", conceptIds)
      .order("created_at", { ascending: false })
      .limit(conceptIds.length * AVOID_LIST_SIZE * 2),
    "load previous questions",
  ) as { concept_id: string; prompt: string; code: string | null; angle: string | null }[];
  for (const row of rows) {
    const list = map.get(row.concept_id) ?? [];
    if (list.length >= AVOID_LIST_SIZE) continue;
    const code = row.code ? ` | code: ${row.code.replace(/\s+/g, " ").slice(0, 160)}` : "";
    list.push(`${row.angle ? `[${row.angle}] ` : ""}${row.prompt.slice(0, 160)}${code}`);
    map.set(row.concept_id, list);
  }
  return map;
}

function embeddingText(c: Candidate): string {
  return [c.slot.concept.name, c.draft.prompt, c.draft.code ?? "", (c.draft.options ?? []).join(" | ")].join("\n");
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Structural checks; returns a reason when the draft is unusable. */
function shapeProblem(slot: Slot, d: Draft): string | null {
  if (!d.prompt.trim() || !d.answer.trim() || !d.explanation.trim()) return "empty fields";
  if (slot.kind === "mcq") {
    if (!d.options || d.options.length !== 4) return "mcq needs 4 options";
    if (!d.options.includes(d.answer)) return "mcq answer is not one of the options";
    if (new Set(d.options).size !== 4) return "duplicate options";
  }
  if ((slot.kind === "predict_output" || slot.kind === "debug") && !d.code?.trim()) return "missing code";
  return null;
}

/**
 * For runnable JS/Node output questions, executes the code and makes the real
 * output the answer. Returns a reason string when the question must be dropped.
 */
async function verifyOutput(c: Candidate): Promise<string | null> {
  const { slot, draft } = c;
  const track = slot.concept.track;
  if (slot.kind !== "predict_output" || (track !== "javascript" && track !== "node")) return null;
  if (!draft.code || !canExecute(draft.code)) return null;

  const run = await runSnippet(draft.code, track === "node" ? "commonjs" : "script");
  if (run === null) return null; // runner hiccup: keep the model's answer, unverified
  if (run === "nondeterministic") return "output depends on setTimeout vs setImmediate timing";
  if (run.timedOut) return "code does not terminate";
  const actual = [...run.lines, ...(run.error ? [run.error] : [])].join("\n").trim();
  if (!actual) return "code prints nothing";

  if (!outputsMatch(draft.answer, actual)) {
    const repaired = await structured<{ explanation: string }>({
      model: env.openaiFastModel,
      reasoningEffort: "low",
      system: REPAIR_SYSTEM_PROMPT,
      user: `Code:\n${draft.code}\n\nReal output:\n${actual}\n\nExplanation to fix:\n${draft.explanation}`,
      schemaName: "repair",
      schema: REPAIR_SCHEMA,
      maxTokens: 4000,
    }).catch(() => null);
    if (!repaired) return "prediction was wrong and could not be repaired";
    draft.explanation = repaired.explanation;
  }
  draft.answer = actual;
  c.verified = true;
  return null;
}

async function draftForTrack(
  track: Track,
  dayNumber: number,
  items: { index: number; slot: Slot; avoid: string[] }[],
  effort: "low" | "medium",
): Promise<Candidate[]> {
  const result = await structured<{ questions: Draft[] }>({
    system: QUESTION_SYSTEM_PROMPT,
    user: questionUserPrompt(track, dayNumber, items),
    schemaName: "questions",
    schema: QUESTIONS_SCHEMA,
    reasoningEffort: effort,
  });
  const bySlot = new Map(items.map((i) => [i.index, i]));
  const out: Candidate[] = [];
  for (const draft of result.questions) {
    const item = bySlot.get(draft.slot);
    if (!item) continue;
    bySlot.delete(draft.slot);
    out.push({ slotIndex: item.index, slot: item.slot, draft, verified: false });
  }
  return out;
}

/**
 * Generates one fresh question per slot. Questions are checked for shape,
 * verified by execution where possible, and compared against every question
 * ever asked (pgvector) and each other; failures get one regeneration round.
 * Slots that still fail are dropped rather than repeating an old question.
 */
export async function generateQuestions(
  slots: Slot[],
  dayNumber: number,
  options: { effort?: "low" | "medium" } = {},
): Promise<QuestionRow[]> {
  const avoidLists = await loadAvoidLists([...new Set(slots.map((s) => s.concept.id))]);
  const extraAvoid = new Map<number, string[]>();
  const accepted: Candidate[] = [];
  let pending = slots.map((slot, index) => ({ index, slot }));

  for (let round = 0; round < 2 && pending.length; round++) {
    const byTrack = new Map<Track, { index: number; slot: Slot; avoid: string[] }[]>();
    for (const { index, slot } of pending) {
      const avoid = [...(avoidLists.get(slot.concept.id) ?? []), ...(extraAvoid.get(index) ?? [])];
      const list = byTrack.get(slot.concept.track) ?? [];
      list.push({ index, slot, avoid });
      byTrack.set(slot.concept.track, list);
    }

    const batches = await Promise.allSettled(
      [...byTrack.entries()].map(([track, items]) => draftForTrack(track, dayNumber, items, options.effort ?? "medium")),
    );
    const candidates: Candidate[] = [];
    for (const batch of batches) {
      if (batch.status === "fulfilled") candidates.push(...batch.value);
      else console.error("[generate] track batch failed:", batch.reason);
    }

    const checked = await Promise.all(
      candidates.map(async (c) => {
        const problem = shapeProblem(c.slot, c.draft) ?? (await verifyOutput(c).catch(() => null));
        if (problem) console.warn(`[generate] dropped slot ${c.slotIndex} (${c.slot.concept.id}): ${problem}`);
        return problem ? null : c;
      }),
    );
    const valid = checked.filter((c): c is Candidate => c !== null);

    const vectors = await embed(valid.map(embeddingText));
    valid.forEach((c, i) => (c.embedding = vectors[i]));

    const unique: Candidate[] = [];
    for (const c of valid) {
      const matches = must(
        await db().rpc("match_questions", { query_embedding: toVector(c.embedding!), match_count: 1 }),
        "match questions",
      ) as { prompt: string; similarity: number }[];
      const nearest = matches[0];
      const twin = [...accepted, ...unique].find((u) => cosine(u.embedding!, c.embedding!) > DUPLICATE_THRESHOLD);
      if (nearest && nearest.similarity > DUPLICATE_THRESHOLD) {
        console.warn(`[generate] slot ${c.slotIndex} too close to an old question (${nearest.similarity.toFixed(3)})`);
        extraAvoid.set(c.slotIndex, [...(extraAvoid.get(c.slotIndex) ?? []), nearest.prompt.slice(0, 200)]);
      } else if (twin) {
        extraAvoid.set(c.slotIndex, [...(extraAvoid.get(c.slotIndex) ?? []), twin.draft.prompt.slice(0, 200)]);
      } else {
        unique.push(c);
      }
    }
    accepted.push(...unique);
    const done = new Set(accepted.map((c) => c.slotIndex));
    pending = pending.filter((p) => !done.has(p.index));
  }

  if (!accepted.length) return [];
  accepted.sort((a, b) => a.slotIndex - b.slotIndex);
  const rows: Insert[] = accepted.map((c) => ({
    track: c.slot.concept.track,
    concept_id: c.slot.concept.id,
    kind: c.slot.kind,
    mode: c.slot.mode,
    difficulty: c.slot.difficulty,
    prompt: c.draft.prompt,
    code: c.draft.code,
    options: c.draft.options ? shuffle(c.draft.options) : null,
    answer: c.draft.answer,
    key_points: c.draft.key_points,
    explanation: c.draft.explanation,
    angle: c.draft.angle,
    verified: c.verified,
    embedding: toVector(c.embedding!),
  }));
  return must(
    await db().from("questions").insert(rows).select(QUESTION_COLUMNS),
    "insert questions",
  ) as unknown as QuestionRow[];
}

/** Every column except the embedding (which is large and never needed client-side). */
export const QUESTION_COLUMNS =
  "id, track, concept_id, kind, mode, difficulty, prompt, code, options, answer, key_points, explanation, angle, verified, created_at";
