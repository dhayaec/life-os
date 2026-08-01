import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rateLimit } from '@/server/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to the limit then rejects', () => {
    const key = 'k1';
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(true);
    expect(rateLimit(key, 3, 60_000)).toBe(false);
  });

  it('refills tokens after the window elapses', () => {
    const key = 'k2';
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(false);

    vi.setSystemTime(new Date('2026-08-01T00:01:00Z'));
    expect(rateLimit(key, 2, 60_000)).toBe(true);
  });

  it('tracks keys independently', () => {
    expect(rateLimit('a', 1, 60_000)).toBe(true);
    expect(rateLimit('a', 1, 60_000)).toBe(false);
    expect(rateLimit('b', 1, 60_000)).toBe(true);
  });
});
