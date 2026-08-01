import 'server-only';

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/**
 * Token-bucket rate limiter.
 *
 * Returns true when the request is allowed, false when the limit is exceeded.
 * Note: state is in-memory, so on Vercel this bounds abuse per serverless
 * instance rather than globally. Sufficient to slow brute-force and token
 * generation abuse, not a hard cross-region limit — reach for Vercel Firewall
 * rules when that's required.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    // Bound memory: drop all tracking when the cache grows too large. A reset
    // is acceptable — buckets self-heal by refilling to the full limit.
    if (buckets.size >= MAX_BUCKETS) {
      buckets.clear();
    }
    bucket = { tokens: limit, lastRefill: now };
    buckets.set(key, bucket);
  }

  const refill = ((now - bucket.lastRefill) / windowMs) * limit;
  bucket.tokens = Math.min(limit, bucket.tokens + refill);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    return false;
  }
  bucket.tokens -= 1;
  return true;
}
