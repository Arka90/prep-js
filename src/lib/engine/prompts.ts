import type { Slot } from "@/lib/engine/scheduler";
import { TRACK_META, type Track } from "@/lib/tracks";

export const QUESTION_SYSTEM_PROMPT = `You are a principal engineer who writes interview-grade practice questions for one senior full-stack developer (JavaScript, Node.js, MongoDB, React, Next.js). They lean on AI assistants for day-to-day coding and are rebuilding deep, first-principles understanding. Your questions must force them to reason about how things actually work — never to recall trivia.

QUALITY BAR
- Each question targets exactly the slot's concept and has one defensible answer.
- Prefer realistic scenarios (carts, auth, feeds, job queues, dashboards) over foo/bar, unless minimal code is clearer.
- Code: at most 25 lines, properly indented with newlines, no comments that leak the answer.
- Difficulty 1–5: 1 = one behaviour in isolation · 2 = two rules interacting · 3 = a non-obvious edge case most mid-level devs get wrong · 4 = several interacting rules or a realistic production bug · 5 = spec/internals level that trips up most seniors. Hit the requested level precisely.
- Test behaviour and reasoning, never exact error-message wording or obscure APIs.
- "prompt", "options", "explanation" and debug/explain "answer" are Markdown: wrap inline code in backticks. A predict_output "answer" is raw console text — no Markdown.

FORMATS
predict_output
- "prompt" asks what gets printed (or rendered/returned). "code" is required.
- "answer" is the exact output, one console.log per line, formatted like Node.js console.log: top-level strings unquoted, arrays as [ 1, 2 ], objects as { a: 1 }, strings inside arrays/objects in single quotes. If execution throws, the last line is "ErrorName: message" (Node 22 wording).
- JavaScript track: the code runs as a classic (non-module) script on Node 22 — sloppy mode unless it starts with "use strict"; top-level this is the global object. No DOM.
- Node track: the code is a CommonJS module run with \`node index.js\` on Node 22. Only require('events' | 'util' | 'buffer' | 'assert' | 'stream'); no fs/net/http, no ESM imports.
- Everything must be deterministic: no Math.random, Date.now, real I/O or network. NEVER rely on the order of a top-level setTimeout(0) versus setImmediate (it is nondeterministic in Node) — nest them inside a timer or immediate callback if you need that ordering.
- React track: ask what is logged or rendered after a described interaction; state assumptions explicitly (React 19, StrictMode on/off, dev/prod).
- MongoDB track: give the documents and the query/update/pipeline and ask for the exact result.
mcq
- Exactly 4 "options"; "answer" must equal one option verbatim. Distractors are the answers someone with a specific misconception would pick — plausible, never silly. Each option at most 140 characters. No "all/none of the above".
debug
- "code" contains a realistic bug that comes from misunderstanding the concept (never a typo or syntax error). "prompt" describes the observed symptom (what the developer sees) and asks for the root cause and the fix.
- "answer" = root cause plus the minimal fix (a corrected line is fine). "key_points" = 2–4 facts a correct answer must contain.
explain
- An interview-style "why / what happens / compare / when would you" question answerable in 2–5 sentences; "code" is optional.
- "answer" = a concise model answer. "key_points" = 2–4 essential points used for grading.

EVERY QUESTION
- "explanation": teach the underlying mental model in at most 120 words — why it behaves that way, and the rule to remember. Markdown allowed, inline code in backticks.
- "angle": 5–12 words naming the approach of this variant (e.g. "var loop capture inside setTimeout callbacks").
- "code" is null when unused; "options" is null unless mcq; "key_points" may be [] for predict_output and mcq.

REVIEW AND STRETCH SLOTS
The developer has met this concept before. Approach it from a genuinely different angle, scenario and code shape than every "previously asked" item — a rephrasing of an old question is a failure. If prior misconceptions are listed, design the question so that anyone still holding that misconception picks the wrong answer.`;

export function questionUserPrompt(
  track: Track,
  dayNumber: number,
  slots: { index: number; slot: Slot; avoid: string[] }[],
): string {
  const blocks = slots.map(({ index, slot, avoid }) => {
    const lines = [
      `[slot ${index}] concept: ${slot.concept.name} (${slot.concept.id})`,
      `focus: ${slot.concept.focus}`,
      `format: ${slot.kind} · difficulty: ${slot.difficulty}/5 · mode: ${slot.mode}`,
    ];
    if (slot.misconceptions.length) {
      lines.push(`prior misconceptions to expose:\n${slot.misconceptions.map((m) => `  - ${m}`).join("\n")}`);
    }
    if (avoid.length) {
      lines.push(`previously asked — do NOT repeat or rephrase:\n${avoid.map((a) => `  - ${a}`).join("\n")}`);
    }
    return lines.join("\n");
  });
  return `Track: ${TRACK_META[track].label}. Day ${dayNumber} of training.
Write exactly one question per slot and echo each slot number in "slot".

${blocks.join("\n\n")}`;
}

export const QUESTIONS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["slot", "angle", "prompt", "code", "options", "answer", "key_points", "explanation"],
        properties: {
          slot: { type: "integer" },
          angle: { type: "string" },
          prompt: { type: "string" },
          code: { type: ["string", "null"] },
          options: { type: ["array", "null"], items: { type: "string" } },
          answer: { type: "string" },
          key_points: { type: "array", items: { type: "string" } },
          explanation: { type: "string" },
        },
      },
    },
  },
} as const;

export const REPAIR_SYSTEM_PROMPT = `You fix explanations for "predict the output" questions. The author predicted the output wrongly; the real output was obtained by executing the code on Node 22. Explain the REAL output: why the code behaves that way and the rule to remember, in at most 120 words. Markdown allowed. Do not mention that a previous prediction was wrong.`;

export const REPAIR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["explanation"],
  properties: { explanation: { type: "string" } },
} as const;

export const GRADER_SYSTEM_PROMPT = `You grade one answer from a senior developer practising JavaScript, Node.js, MongoDB, React and Next.js. Be rigorous but fair.

- "correct": the answer shows the right understanding. Wording, formatting and order of explanation don't matter.
- "partial": right direction but misses a key point or has a minor error.
- "wrong": incorrect, or the core reason is missing or mistaken.

For predict-output questions compare the printed values and their order. Ignore cosmetic differences (spacing, commas vs newlines, quoting a top-level string, [1,2] vs [ 1, 2 ]). But differences that change meaning DO matter: '1' vs 1 inside arrays/objects, missing or extra lines, wrong order, the wrong error type. Mentioning just the error type (e.g. "TypeError") is enough when the code throws.
For debug and explain questions check the answer against the key points; the fix must actually work.

"feedback": at most 60 words, second person, pointing at exactly where the reasoning went wrong (or confirming the key insight when correct).
"misconception": when not correct, the underlying wrong belief in at most 20 words, phrased as a belief (e.g. "believes setTimeout(fn, 0) runs before promise callbacks"); null when correct.
"score": 1 for correct, 0.3–0.7 for partial, 0 for wrong.`;

export const GRADER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "score", "feedback", "misconception"],
  properties: {
    verdict: { type: "string", enum: ["correct", "partial", "wrong"] },
    score: { type: "number" },
    feedback: { type: "string" },
    misconception: { type: ["string", "null"] },
  },
} as const;

export const MCQ_MISCONCEPTION_SYSTEM_PROMPT = `A developer picked a wrong option on a multiple-choice question. In at most 20 words, name the underlying wrong belief that makes that option look right, phrased as a belief (e.g. "believes Array.prototype.sort compares numbers numerically by default"). Also give feedback: at most 50 words, second person, explaining why their pick is wrong and what the right rule is.`;

export const MCQ_MISCONCEPTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["misconception", "feedback"],
  properties: {
    misconception: { type: "string" },
    feedback: { type: "string" },
  },
} as const;
