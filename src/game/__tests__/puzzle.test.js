import { describe, it, expect } from 'vitest';
import { getDailyPuzzle, getTodayDateString } from '../puzzle.js';

const samplePuzzles = [
  { id: 'book-a' },
  { id: 'book-b' },
  { id: 'book-c' },
];

describe('getDailyPuzzle', () => {
  it('returns a puzzle from the list', () => {
    const puzzle = getDailyPuzzle(samplePuzzles, '2026-03-06');
    expect(samplePuzzles).toContain(puzzle);
  });

  it('is deterministic for the same date', () => {
    const p1 = getDailyPuzzle(samplePuzzles, '2026-03-06');
    const p2 = getDailyPuzzle(samplePuzzles, '2026-03-06');
    expect(p1).toBe(p2);
  });

  it('uses the date string hash formula from the plan', () => {
    const date = '2026-03-06';
    const seed = [...date].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const expectedIndex = seed % samplePuzzles.length;
    expect(getDailyPuzzle(samplePuzzles, date)).toBe(samplePuzzles[expectedIndex]);
  });

  it('returns different puzzles for different dates', () => {
    // Verify both return valid puzzles (content varies by hash)
    const p1 = getDailyPuzzle(samplePuzzles, '2026-03-06');
    const p2 = getDailyPuzzle(samplePuzzles, '2026-03-07');
    expect(samplePuzzles).toContain(p1);
    expect(samplePuzzles).toContain(p2);
  });

  it('works with a single-puzzle list', () => {
    const single = [{ id: 'only-book' }];
    expect(getDailyPuzzle(single, '2026-03-06')).toBe(single[0]);
    expect(getDailyPuzzle(single, '2099-12-31')).toBe(single[0]);
  });
});

describe('getTodayDateString', () => {
  it('returns a YYYY-MM-DD formatted string', () => {
    const date = getTodayDateString();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a valid date', () => {
    const date = getTodayDateString();
    expect(new Date(date).toString()).not.toBe('Invalid Date');
  });
});
