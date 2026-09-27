import { CURRICULUM, CONCEPTS_BY_ID, type Concept } from "@/data/curriculum";
import { addDays, daysBetween } from "@/lib/dates";
import type { Track } from "@/lib/tracks";
import type { ConceptProgressRow, QuestionKind, SlotMode, Verdict } from "@/lib/types";

// ── Spaced repetition ────────────────────────────────────────────────────────
// Leitner boxes. A correct answer moves a concept up one box and pushes the next
// review further out; a miss drops it back and makes it due tomorrow, where it
// is asked again in a different format until it sticks. Box >= 4 means it
// climbed four spaced recalls: mastered.

/** Days until the next review, indexed by the box the concept lands in. */
export const REVIEW_INTERVALS = [1, 2, 4, 7, 14, 30, 60];
export const MASTERED_BOX = 4;
const MAX_BOX = REVIEW_INTERVALS.length - 1;

// ── Progressive difficulty ───────────────────────────────────────────────────

/** Minimum difficulty for the day: everything creeps up one level every 12 days. */
export function dayFloor(dayNumber: number): number {
  return Math.min(5, 1 + Math.floor((dayNumber - 1) / 12));
}

/** Highest curriculum tier unlocked for brand-new concepts on this day. */
export function maxTier(dayNumber: number): number {
  if (dayNumber <= 4) return 1;
  if (dayNumber <= 10) return 2;
  if (dayNumber <= 18) return 3;
  if (dayNumber <= 28) return 4;
  return 5;
}

const clampLevel = (n: number) => Math.max(1, Math.min(5, n));

// ── Formats ──────────────────────────────────────────────────────────────────
// Weighted per track: output prediction is the best muscle-builder where the
// code can actually run; Next.js leans on reasoning and debugging instead.

const KIND_WEIGHTS: Record<Track, Partial<Record<QuestionKind, number>>> = {
  javascript: { predict_output: 4, debug: 2, mcq: 2, explain: 1 },
  node: { predict_output: 3, debug: 2, mcq: 2, explain: 1 },
  mongodb: { predict_output: 2, mcq: 3, debug: 2, explain: 1 },
  react: { predict_output: 2, debug: 3, mcq: 2, explain: 1 },
  nextjs: { mcq: 3, debug: 3, explain: 2 },
};

/** Deterministic 0..1 pseudo-random from a string, so plans are stable within a day. */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Picks a format, never the same one the concept was last asked in. */
export function pickKind(track: Track, avoid: QuestionKind | null, seed: string): QuestionKind {
  const entries = Object.entries(KIND_WEIGHTS[track]).filter(([k]) => k !== avoid) as [QuestionKind, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = hash01(seed) * total;
  for (const [kind, weight] of entries) {
    roll -= weight;
    if (roll < 0) return kind;
  }
  return entries[entries.length - 1][0];
}

// ── Planning a day ───────────────────────────────────────────────────────────

export interface Slot {
  concept: Concept;
  mode: SlotMode;
  kind: QuestionKind;
  difficulty: number;
  misconceptions: string[];
}

/** Takes up to n items, alternating between tracks so no single track dominates. */
function roundRobin<T>(items: T[], trackOf: (item: T) => Track, n: number): T[] {
  const queues = new Map<Track, T[]>();
  for (const item of items) {
    const track = trackOf(item);
    if (!queues.has(track)) queues.set(track, []);
    queues.get(track)!.push(item);
  }
  const picked: T[] = [];
  while (picked.length < n && [...queues.values()].some((q) => q.length)) {
    for (const queue of queues.values()) {
      if (picked.length >= n) break;
      const next = queue.shift();
      if (next) picked.push(next);
    }
  }
  return picked;
}

export function planSession(input: {
  count: number;
  tracks: Track[];
  dayNumber: number;
  today: string;
  progress: ConceptProgressRow[];
}): Slot[] {
  const { count, tracks, dayNumber, today, progress } = input;
  const enabled = new Set(tracks);
  const floor = dayFloor(dayNumber);
  const known = progress.filter((p) => enabled.has(p.track) && CONCEPTS_BY_ID[p.concept_id]);
  const seen = new Set(progress.map((p) => p.concept_id));
  // Most overdue first; among equally overdue, the shakiest first. Sorting by
  // box alone would starve concepts that are one review away from mastery.
  const byPriority = (a: ConceptProgressRow, b: ConceptProgressRow) =>
    (a.next_due ?? "").localeCompare(b.next_due ?? "") || a.box - b.box;

  const due = known.filter((p) => p.next_due && p.next_due <= today).sort(byPriority);
  const stretchPool =
    dayNumber >= 8
      ? known
          .filter((p) => p.box >= MASTERED_BOX && (!p.next_due || p.next_due > today))
          .filter((p) => !p.last_seen || daysBetween(p.last_seen, today) >= 5)
          .sort((a, b) => (a.last_seen ?? "").localeCompare(b.last_seen ?? ""))
      : [];

  const unlockedTier = maxTier(dayNumber);
  const unseen = CURRICULUM.filter((c) => enabled.has(c.track) && !seen.has(c.id));
  const lowestUnseenTier = Math.min(...unseen.map((c) => c.tier), 99);
  const fresh = unseen
    .filter((c) => c.tier <= Math.max(unlockedTier, lowestUnseenTier))
    .sort((a, b) => a.tier - b.tier);

  // New material only enters while the working set of not-yet-mastered
  // concepts is small enough to actually review; otherwise reviews pile up
  // faster than they can be cleared and nothing ever gets mastered.
  const active = known.filter((p) => p.box < MASTERED_BOX).length;
  const capacity = Math.max(0, Math.round(count * 2.5) - active);
  const newBudget = Math.min(Math.ceil(count * 0.4), capacity);
  const stretchBudget = stretchPool.length && count >= 6 ? 1 : 0;

  const reviews = roundRobin(due, (p) => p.track, count - newBudget - stretchBudget);
  const stretch = roundRobin(stretchPool, (p) => p.track, Math.min(stretchBudget, count - reviews.length));
  const room = count - reviews.length - stretch.length;
  // Few reviews due today: spend the spare room on new concepts, still within the working-set cap.
  const news = roundRobin(fresh, (c) => c.track, Math.min(room, capacity));

  const slots: Slot[] = [];
  const fromProgress = (p: ConceptProgressRow, mode: SlotMode): Slot => {
    const base = clampLevel(Math.max(p.level, floor));
    return {
      concept: CONCEPTS_BY_ID[p.concept_id],
      mode,
      kind: pickKind(p.track, p.last_kind, `${today}:${p.concept_id}`),
      difficulty: mode === "stretch" ? clampLevel(base + 1) : base,
      misconceptions: p.misconceptions.slice(-3),
    };
  };
  reviews.forEach((p) => slots.push(fromProgress(p, "review")));
  stretch.forEach((p) => slots.push(fromProgress(p, "stretch")));
  news.forEach((c) =>
    slots.push({
      concept: c,
      mode: "new",
      kind: pickKind(c.track, null, `${today}:${c.id}`),
      difficulty: clampLevel(Math.max(floor, c.tier)),
      misconceptions: [],
    }),
  );

  // Nothing new left and not much due: keep drilling the least-solid concepts.
  if (slots.length < count) {
    const used = new Set(slots.map((s) => s.concept.id));
    const extra = known
      .filter((p) => !used.has(p.concept_id))
      .sort(byPriority);
    roundRobin(extra, (p) => p.track, count - slots.length).forEach((p) =>
      slots.push(fromProgress(p, p.box >= MASTERED_BOX ? "stretch" : "review")),
    );
  }

  // Interleave tracks in the final order so consecutive questions switch context.
  return roundRobin(slots, (s) => s.concept.track, slots.length);
}

// ── Recording an answer ──────────────────────────────────────────────────────

export function applyResult(
  current: ConceptProgressRow | null,
  input: {
    conceptId: string;
    track: Track;
    verdict: Verdict;
    kind: QuestionKind;
    difficulty: number;
    misconception: string | null;
    today: string;
  },
): ConceptProgressRow {
  const p: ConceptProgressRow = current
    ? { ...current, misconceptions: [...current.misconceptions] }
    : {
        concept_id: input.conceptId,
        track: input.track,
        box: 0,
        level: clampLevel(input.difficulty),
        streak: 0,
        attempts: 0,
        correct: 0,
        last_result: null,
        last_kind: null,
        misconceptions: [],
        next_due: null,
        last_seen: null,
        mastered_at: null,
      };

  p.attempts += 1;
  p.last_result = input.verdict;
  p.last_kind = input.kind;
  p.last_seen = input.today;

  if (input.verdict === "correct") {
    p.correct += 1;
    p.streak += 1;
    // Answering right at a higher difficulty proves that level.
    p.level = Math.max(p.level, clampLevel(input.difficulty));
    p.box = Math.min(MAX_BOX, p.box + 1);
    // Two right in a row at this difficulty: ask harder next time.
    if (p.streak % 2 === 0) p.level = clampLevel(p.level + 1);
    p.next_due = addDays(input.today, REVIEW_INTERVALS[p.box]);
  } else {
    // A miss costs two boxes (one for a partial) and the concept is due again tomorrow.
    p.streak = 0;
    p.box = Math.max(0, p.box - (input.verdict === "partial" ? 1 : 2));
    p.next_due = addDays(input.today, 1);
    if (input.misconception) {
      p.misconceptions = [...p.misconceptions.filter((m) => m !== input.misconception), input.misconception].slice(-5);
    }
  }

  if (p.box >= MASTERED_BOX) {
    p.mastered_at ??= new Date().toISOString();
    p.misconceptions = [];
  } else {
    p.mastered_at = null;
  }
  return p;
}

export type ConceptStatus = "unseen" | "learning" | "reviewing" | "mastered";

export function conceptStatus(p: ConceptProgressRow | undefined): ConceptStatus {
  if (!p) return "unseen";
  if (p.box >= MASTERED_BOX) return "mastered";
  if (p.box >= 2) return "reviewing";
  return "learning";
}
