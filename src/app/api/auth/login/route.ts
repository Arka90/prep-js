import { NextResponse, type NextRequest } from "next/server";
import { createSessionToken, passwordMatches, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (!password || !(await passwordMatches(password, env.appPassword, env.authSecret))) {
    // Slow down guessing a little; this is a single-user app with no lockout.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(env.authSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
