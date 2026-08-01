import { describe, expect, it } from 'vitest';

import { currentStreak } from '@/features/dashboard/services/streak';

describe('currentStreak', () => {
  it('counts consecutive days ending today when today is done', () => {
    const done = ['2026-07-30', '2026-07-31', '2026-08-01'];
    expect(currentStreak(done, '2026-08-01')).toBe(3);
  });

  it('starts from yesterday when today is not done yet', () => {
    const done = ['2026-07-30', '2026-07-31'];
    expect(currentStreak(done, '2026-08-01')).toBe(2);
  });

  it('returns 0 when neither today nor yesterday is done', () => {
    expect(currentStreak([], '2026-08-01')).toBe(0);
    expect(currentStreak(['2026-07-29'], '2026-08-01')).toBe(0);
  });

  it('breaks the streak on a gap', () => {
    const done = ['2026-07-28', '2026-07-29', '2026-07-31', '2026-08-01'];
    expect(currentStreak(done, '2026-08-01')).toBe(2);
  });

  it('ignores duplicates and order', () => {
    const done = ['2026-08-01', '2026-07-31', '2026-07-31', '2026-07-30'];
    expect(currentStreak(done, '2026-08-01')).toBe(3);
  });
});
