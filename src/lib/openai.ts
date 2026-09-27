import "server-only";
import { env } from "@/lib/env";

type JsonSchema = Record<string, unknown>;

interface StructuredCall {
  model?: string;
  system: string;
  user: string;
  /** Name + JSON schema for OpenAI Structured Outputs (strict mode). */
  schemaName: string;
  schema: JsonSchema;
  /** Only used by reasoning models (gpt-5*, o*). */
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
  maxTokens?: number;
}

const isReasoningModel = (model: string) => /^(gpt-5|o\d)/.test(model);

/** Calls Chat Completions with a strict JSON schema and returns the parsed object. */
export async function structured<T>(call: StructuredCall): Promise<T> {
  const model = call.model ?? env.openaiModel;
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: call.system },
      { role: "user", content: call.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: call.schemaName, strict: true, schema: call.schema },
    },
    max_completion_tokens: call.maxTokens ?? 32000,
  };
  if (isReasoningModel(model)) {
    body.reasoning_effort = call.reasoningEffort ?? "medium";
  } else {
    body.temperature = 0.8;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  if (choice?.message?.refusal) throw new Error(`OpenAI refused: ${choice.message.refusal}`);
  if (choice?.finish_reason === "length") {
    throw new Error("OpenAI response was cut off (max tokens). Try fewer questions per day.");
  }
  return JSON.parse(choice.message.content) as T;
}

/** Embeds many texts in one request. Returns vectors in input order. */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: env.embeddingModel, input: texts }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI embeddings ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  const data = await response.json();
  return (data.data as { index: number; embedding: number[] }[])
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/** pgvector accepts the JSON array text form. */
export const toVector = (embedding: number[]) => JSON.stringify(embedding);

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
