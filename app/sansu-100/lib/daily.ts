import { hashStringToSeed } from './problem-generator';

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Daily challenge seed derived from date only — same problems for all users on the same day.
 */
export function dailySeed(d: Date = new Date()): number {
  return hashStringToSeed(`daily-${todayKey(d)}`);
}

/**
 * Pick a level for today's challenge based on date — rotates through a curated list.
 */
export function dailyLevel(d: Date = new Date()): number {
  const rotation = [1, 2, 3, 4, 5, 6, 5, 7, 8, 9, 5, 10, 11];
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) /
      (24 * 60 * 60 * 1000)
  );
  return rotation[dayOfYear % rotation.length];
}
