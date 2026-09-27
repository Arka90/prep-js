// Single-user auth: one password from the environment, one signed httpOnly cookie.
// Uses Web Crypto only, so it runs in both the proxy and route handlers.

export const SESSION_COOKIE = "prep_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Buffer.from(signature).toString("base64url");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(secret: string): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${expires}.${await hmac(secret, `session:${expires}`)}`;
}

export async function verifySessionToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (Number(expires) < Date.now() / 1000) return false;
  return timingSafeEqual(signature, await hmac(secret, `session:${expires}`));
}

export async function passwordMatches(input: string, expected: string, secret: string): Promise<boolean> {
  // Compare HMACs so the comparison is constant-time regardless of input length.
  return timingSafeEqual(await hmac(secret, `pw:${input}`), await hmac(secret, `pw:${expected}`));
}
