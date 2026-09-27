import type { DrillQuestion, DrillResult } from "@/lib/types";

async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({ error: `Request failed (${response.status})` }));
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
  return data as T;
}

export type DrillLoad =
  | { status: "generating" }
  | { status: "ready"; dayNumber: number; completed: boolean; questions: DrillQuestion[] };

export const loadDrill = () => post<DrillLoad>("/api/drill");
export const sendAnswer = (questionId: string, response: string, timeMs: number) =>
  post<{ result: DrillResult; sessionCompleted: boolean }>("/api/drill/answer", { questionId, response, timeMs });
export const requestVariant = (questionId: string) =>
  post<{ question: DrillQuestion }>("/api/drill/variant", { questionId });
export { post };
