import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000;

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me-please";
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

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function createSessionToken(username: string): Promise<string> {
  const expires = Date.now() + SESSION_DURATION;
  const payload = `${username}.${expires}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined): Promise<{
  valid: boolean;
  username?: string;
}> {
  if (!token) return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false };

  const [username, expiresStr, signature] = parts;
  const payload = `${username}.${expiresStr}`;
  const expected = await sign(payload);

  if (!timingSafeEqualStr(signature, expected)) return { valid: false };

  const expires = Number(expiresStr);
  if (Number.isNaN(expires) || expires < Date.now()) return { valid: false };

  return { valid: true, username };
}

export async function isAdminSession(): Promise<{ valid: boolean; username?: string }> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASS || "solario2026";
  return (
    timingSafeEqualStr(username, expectedUser) &&
    timingSafeEqualStr(password, expectedPass)
  );
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION / 1000;
