import type { Concept } from "@/data/curriculum";
import { TRACK_META, type Track } from "@/lib/tracks";
import type { ChallengeKind } from "@/lib/types";

export const CHALLENGE_SYSTEM_PROMPT = `You design the daily coding-arena challenge for one senior full-stack developer whose raw problem-solving has gone soft from leaning on AI. Each challenge is a 10–25 minute kata that works the logic muscle — careful reasoning, edge cases, data structures, async control flow — while building intuition for their stack. No libraries, no AI needed.

HARD CONSTRAINTS (tests run automatically on Node 22)
- The solution is ONE plain JavaScript function named exactly "function_name", declared as \`function name(...) { }\` or \`async function name(...) { }\`. No imports/require, no DOM, no network, no randomness, no Date.now; timers only if essential and at most 20ms.
- Arguments and return values are JSON-serialisable (numbers, strings, booleans, null, arrays, plain objects). Never return undefined — return null. For stateful designs (caches, emitters, stores, rate limiters, schedulers) take an array of operations and return an array of results, e.g. lruCache(capacity, ops) → results.
- 8–12 tests. The first 3–4 are visible (hidden: false): the main example and one edge case. The rest are hidden and cover edge cases: empty input, duplicates, boundaries, nesting, ordering, a larger input. "input_json" is a JSON array of the arguments; "expected_json" is the exact JSON return value. Trace the reference solution by hand for every test — a wrong expected value ruins the challenge.
- "reference_solution" is complete, correct, readable code defining the function.

THEMES — tie the problem to its track:
- JavaScript: re-implement language behaviour (deep equal, curry, flatten to depth, debounce-like schedulers via op logs, promise utilities such as allSettled / a concurrency-limited pool, template parsing, iterator helpers).
- Node.js: middleware composer, EventEmitter semantics (once, prepend, error), chunked stream/line splitter with backpressure-like limits, path normalisation, retry with backoff using tiny delays, semaphore/queue.
- MongoDB: mini query matcher match(doc, filter) with $eq/$gt/$in/$elemMatch/dot paths/array semantics, update-operator applier ($set/$inc/$push/$addToSet/$unset), aggregation-stage simulator ($match/$group/$sort/$limit/$unwind), cursor/keyset pagination.
- React: keyed list reconciliation (produce insert/move/remove ops), hook-slot simulator showing why hook order matters, state-update batching with updater functions, effect/cleanup ordering for a component tree, virtual-DOM-to-HTML renderer.
- Next.js: app-router path matcher ([id], [...slug], [[...opt]], (groups)), tag-based cache/revalidation simulator, proxy/middleware matcher evaluation, searchParams/route-params parsing, redirect/rewrite resolution.

KINDS
- build: "starter_code" is the function signature with a JSDoc block (params, return) and a body that just returns null.
- debug: "starter_code" is a COMPLETE, plausible implementation containing 1–3 subtle logic bugs of the kind real code has (off-by-one, mutating the input, wrong sort comparator, falsy-zero check, missing await / wrong async order, shallow copy, closure capture, wrong boundary). It must pass at least one visible test and fail at least one test. "description" explains what the function should do and the symptom reported by a user — never where the bug is. "reference_solution" is the fixed version.

"description": Markdown — problem statement, input/output contract, 1–2 worked examples, constraints. No solution hints.
"hints": exactly 3 progressive hints (nudge → approach → almost there), no code.
"concepts": ids of the listed concepts the challenge exercises (may be empty).
"difficulty" 1–5 means: 1 warm-up · 2 a few edge cases · 3 needs a clear plan · 4 tricky state/async/edge interplay · 5 hard — would take a strong senior 25+ minutes.`;

export function challengeUserPrompt(input: {
  kind: ChallengeKind;
  track: Track;
  difficulty: number;
  dayNumber: number;
  concepts: Concept[];
  avoid: string[];
  feedback: string | null;
}): string {
  return [
    `Kind: ${input.kind}. Track: ${TRACK_META[input.track].label}. Difficulty: ${input.difficulty}/5. Day ${input.dayNumber} of training.`,
    input.concepts.length
      ? `Concepts the developer is currently learning (build around one if it fits naturally):\n${input.concepts
          .map((c) => `- ${c.id}: ${c.name} — ${c.focus}`)
          .join("\n")}`
      : null,
    input.avoid.length
      ? `Previous challenges — do NOT repeat these problems or close variants:\n${input.avoid.map((a) => `- ${a}`).join("\n")}`
      : null,
    input.feedback ? `Your previous attempt was rejected by the automatic validator:\n${input.feedback}\nFix it.` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const CHALLENGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "function_name", "description", "starter_code", "reference_solution", "tests", "hints", "concepts"],
  properties: {
    title: { type: "string" },
    function_name: { type: "string" },
    description: { type: "string" },
    starter_code: { type: "string" },
    reference_solution: { type: "string" },
    tests: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "input_json", "expected_json", "hidden"],
        properties: {
          name: { type: "string" },
          input_json: { type: "string" },
          expected_json: { type: "string" },
          hidden: { type: "boolean" },
        },
      },
    },
    hints: { type: "array", items: { type: "string" } },
    concepts: { type: "array", items: { type: "string" } },
  },
} as const;
