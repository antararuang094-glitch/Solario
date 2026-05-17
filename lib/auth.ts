import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000;
const MIN_SECRET_LENGTH = 32;

/**
 * Reads ADMIN_SESSION_SECRET. Throws if missing/too short.
 * Caller MUST handle the thrown error gracefully (return invalid session).
 */
function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET environment variable is required. " +
        "Generate one with: openssl rand -base64 48"
    );
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `ADMIN_SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`
    );
  }
  return secret;
}

async function sign(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Constant-time string comparison. Note: when lengths differ we still
 * iterate over the longer string to avoid leaking length information via
 * timing. Returns false for any length mismatch.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let result = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    // XOR each char code; for indices past a string's end use 0 so the
    // loop body cost stays constant regardless of which string is longer.
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    result |= ca ^ cb;
  }
  return result === 0;
}

export async function createSessionToken(username: string): Promise<string> {
  const expires = Date.now() + SESSION_DURATION;
  const payload = `${username}.${expires}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

/**
 * Verifies a session token. Returns { valid: false } on ANY failure
 * (missing secret, malformed token, expired, bad signature, etc.) without
 * leaking the failure reason to callers.
 */
export async function verifySessionToken(token: string | undefined): Promise<{
  valid: boolean;
  username?: string;
}> {
  if (!token) return { valid: false };
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };

    const [username, expiresStr, signature] = parts;
    const payload = `${username}.${expiresStr}`;
    const expected = await sign(payload);

    if (!timingSafeEqualStr(signature, expected)) return { valid: false };

    const expires = Number(expiresStr);
    if (Number.isNaN(expires) || expires < Date.now()) return { valid: false };

    return { valid: true, username };
  } catch (err) {
    // Logs to server only — never expose internal errors to client
    console.error("[auth] Session verification failed:", err);
    return { valid: false };
  }
}

export async function isAdminSession(): Promise<{ valid: boolean; username?: string }> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/**
 * Validates admin credentials. Returns false (without throwing) if
 * ADMIN_USER or ADMIN_PASS env vars are not set — so missing config
 * fails closed rather than allowing default credentials.
 */
export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASS;
  if (!expectedUser || !expectedPass) {
    console.error(
      "[auth] ADMIN_USER and/or ADMIN_PASS env vars are not set. Login disabled."
    );
    return false;
  }
  return (
    timingSafeEqualStr(username, expectedUser) &&
    timingSafeEqualStr(password, expectedPass)
  );
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION / 1000;
