import type { Track } from "@/lib/tracks";

export type QuestionKind = "predict_output" | "mcq" | "debug" | "explain";
export type Verdict = "correct" | "partial" | "wrong";
export type SlotMode = "new" | "review" | "stretch";

export const KIND_LABEL: Record<QuestionKind, string> = {
  predict_output: "Predict the output",
  mcq: "Multiple choice",
  debug: "Find the bug",
  explain: "Explain it",
};

export interface QuestionRow {
  id: string;
  track: Track;
  concept_id: string;
  kind: QuestionKind;
  mode: SlotMode;
  difficulty: number;
  prompt: string;
  code: string | null;
  options: string[] | null;
  answer: string;
  key_points: string[];
  explanation: string;
  angle: string | null;
  verified: boolean;
  created_at: string;
}

export interface AnswerRow {
  id: string;
  session_id: string;
  question_id: string;
  concept_id: string;
  response: string;
  verdict: Verdict;
  score: number;
  feedback: string | null;
  misconception: string | null;
  time_ms: number | null;
  created_at: string;
}

export interface ConceptProgressRow {
  concept_id: string;
  track: Track;
  box: number;
  level: number;
  streak: number;
  attempts: number;
  correct: number;
  last_result: Verdict | null;
  last_kind: QuestionKind | null;
  misconceptions: string[];
  next_due: string | null;
  last_seen: string | null;
  mastered_at: string | null;
}

export interface SessionRow {
  id: string;
  day: string;
  day_number: number;
  question_ids: string[];
  status: "active" | "completed";
  created_at: string;
  completed_at: string | null;
}

export interface AppState {
  started_on: string;
  daily_question_count: number;
  enabled_tracks: Track[];
}

/** What the client sees for a question: the answer is withheld until it has been answered. */
export interface DrillQuestion {
  id: string;
  track: Track;
  conceptId: string;
  conceptName: string;
  kind: QuestionKind;
  difficulty: number;
  mode: SlotMode;
  prompt: string;
  code: string | null;
  options: string[] | null;
  result: DrillResult | null;
}

export interface DrillResult {
  response: string;
  verdict: Verdict;
  score: number;
  feedback: string | null;
  misconception: string | null;
  answer: string;
  explanation: string;
  keyPoints: string[];
  verified: boolean;
}

export interface ArenaTest {
  name: string;
  input: unknown[];
  expected: unknown;
  hidden: boolean;
}

export type ChallengeKind = "build" | "debug";

export interface ChallengeRow {
  id: string;
  day: string;
  kind: ChallengeKind;
  track: Track;
  title: string;
  difficulty: number;
  description: string;
  function_name: string;
  starter_code: string;
  reference_solution: string;
  tests: ArenaTest[];
  hints: string[];
  concepts: string[];
  status: "open" | "solved" | "revealed";
  best_code: string | null;
  attempts: number;
  solved_at: string | null;
  created_at: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  hidden: boolean;
  input?: unknown[];
  expected?: unknown;
  actual?: unknown;
  error?: string;
  ms: number;
}
