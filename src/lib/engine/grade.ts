import "server-only";
import { env } from "@/lib/env";
import { structured } from "@/lib/openai";
import {
  GRADER_SCHEMA,
  GRADER_SYSTEM_PROMPT,
  MCQ_MISCONCEPTION_SCHEMA,
  MCQ_MISCONCEPTION_SYSTEM_PROMPT,
} from "@/lib/engine/prompts";
import { CONCEPTS_BY_ID } from "@/data/curriculum";
import type { QuestionRow, Verdict } from "@/lib/types";

export interface Grade {
  verdict: Verdict;
  score: number;
  feedback: string | null;
  misconception: string | null;
}

/** Cosmetic normalisation only: spacing, quote style, trailing separators. */
function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/[;,]+$/, "")
        .replace(/"/g, "'")
        .replace(/\s+/g, " ")
        .replace(/\s*([[\]{}(),:])\s*/g, "$1"),
    )
    .filter(Boolean)
    .join("\n");
}

export function outputsMatch(a: string, b: string): boolean {
  const na = normalizeOutput(a);
  const nb = normalizeOutput(b);
  if (na === nb) return true;
  // Tolerate a quoted top-level string on a line: "hello" vs hello.
  const unquote = (s: string) => s.replace(/^'(.*)'$/gm, "$1");
  return unquote(na) === unquote(nb);
}

export async function gradeAnswer(question: QuestionRow, response: string): Promise<Grade> {
  const trimmed = response.trim();
  if (!trimmed || /^(idk|i don'?t know|no idea|\?+|skip)$/i.test(trimmed)) {
    return { verdict: "wrong", score: 0, feedback: "Skipped — read the explanation, this concept will come back tomorrow.", misconception: null };
  }

  if (question.kind === "mcq") {
    if (trimmed === question.answer) return { verdict: "correct", score: 1, feedback: null, misconception: null };
    const diagnosis = await structured<{ misconception: string; feedback: string }>({
      model: env.openaiFastModel,
      reasoningEffort: "low",
      system: MCQ_MISCONCEPTION_SYSTEM_PROMPT,
      user: `Question: ${question.prompt}\n${question.code ? `Code:\n${question.code}\n` : ""}Options:\n${(question.options ?? []).map((o) => `- ${o}`).join("\n")}\nCorrect: ${question.answer}\nPicked: ${trimmed}\nWhy the correct answer is right: ${question.explanation}`,
      schemaName: "mcq_diagnosis",
      schema: MCQ_MISCONCEPTION_SCHEMA,
      maxTokens: 3000,
    }).catch(() => null);
    return {
      verdict: "wrong",
      score: 0,
      feedback: diagnosis?.feedback ?? null,
      misconception: diagnosis?.misconception ?? null,
    };
  }

  if (question.kind === "predict_output" && outputsMatch(trimmed, question.answer)) {
    return { verdict: "correct", score: 1, feedback: null, misconception: null };
  }

  const concept = CONCEPTS_BY_ID[question.concept_id];
  const grade = await structured<Grade>({
    model: env.openaiFastModel,
    reasoningEffort: "low",
    system: GRADER_SYSTEM_PROMPT,
    user: [
      `Concept: ${concept?.name ?? question.concept_id}`,
      `Question type: ${question.kind}`,
      `Question: ${question.prompt}`,
      question.code ? `Code:\n${question.code}` : null,
      `Reference answer${question.verified ? " (verified by executing the code)" : ""}:\n${question.answer}`,
      question.key_points.length ? `Key points:\n${question.key_points.map((k) => `- ${k}`).join("\n")}` : null,
      `Developer's answer:\n${trimmed}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    schemaName: "grade",
    schema: GRADER_SCHEMA,
    maxTokens: 4000,
  });
  const score = grade.verdict === "correct" ? 1 : grade.verdict === "wrong" ? 0 : Math.min(0.7, Math.max(0.3, grade.score));
  return { ...grade, score, misconception: grade.verdict === "correct" ? null : grade.misconception };
}
