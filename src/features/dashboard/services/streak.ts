// Pure streak logic — no DB access, extracted so it can be unit-tested.

export function toKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function currentStreak(doneDates: string[], todayKeyValue: string): number {
  const done = new Set(doneDates);
  let cursor = todayKeyValue;
  if (!done.has(cursor)) {
    const yesterday = new Date(`${cursor}T00:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    cursor = yesterday.toISOString().slice(0, 10);
  }
  let count = 0;
  while (done.has(cursor)) {
    count += 1;
    const prev = new Date(`${cursor}T00:00:00Z`);
    prev.setUTCDate(prev.getUTCDate() - 1);
    cursor = prev.toISOString().slice(0, 10);
  }
  return count;
}
