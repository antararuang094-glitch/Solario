/**
 * Simple in-memory sliding-window rate limiter keyed by an arbitrary
 * identifier (typically `${ip}:${route}` or `${username}:${route}`).
 *
 * Trade-offs:
 * - In-memory ⇒ NOT shared across Vercel function instances. On serverless
 *   each cold start gets a fresh map, so per-IP limits may be more
 *   permissive than configured under heavy distribution. For brute-force
 *   protection on a low-traffic admin login this is acceptable as a
 *   first defense; for production hardening, swap to Upstash Redis or
 *   a similar shared store.
 * - O(1) per check; entries are pruned lazily on next hit.
 *
 * Usage:
 *   const result = check(`login:${ip}`, 5, 15 * 60 * 1000);
 *   if (!result.allowed) return 429 with Retry-After: result.retryAfterSeconds;
 */

type Entry = { hits: number[] };
const buckets = new Map<string, Entry>();

/**
 * Returns whether `key` is allowed to perform another action right now,
 * given `max` attempts within a sliding `windowMs` window.
 */
export function check(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const entry = buckets.get(key) ?? { hits: [] };
  // Drop hits older than window
  const fresh = entry.hits.filter((t) => t > cutoff);

  if (fresh.length >= max) {
    const oldest = fresh[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, { hits: fresh });
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  fresh.push(now);
  buckets.set(key, { hits: fresh });
  return { allowed: true, remaining: max - fresh.length, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP extraction. Prefers `x-forwarded-for` (Vercel
 * proxy header) and falls back to a stable placeholder so unknown
 * clients still share a single bucket rather than bypassing limits.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
