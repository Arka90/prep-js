import "server-only";
import { NextResponse } from "next/server";

/** Wraps a route handler body: JSON in, JSON out, errors become { error } with a 500. */
export async function json<T>(fn: () => Promise<T>, status = 200) {
  try {
    return NextResponse.json(await fn(), { status });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
