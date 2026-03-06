import { describe, it, expect } from 'vitest';
import { calcRoundScore, calcTotalScore, getWrongGuessCount } from '../scoring.js';

describe('getWrongGuessCount', () => {
  it('returns 0 when no wrong guesses and no hint', () => {
    expect(getWrongGuessCount({ guesses: [], hintUsed: false })).toBe(0);
  });

  it('counts each wrong guess', () => {
    expect(getWrongGuessCount({ guesses: ['BAD', 'ALSO'], hintUsed: false })).toBe(2);
  });

  it('adds 1 when hint is used', () => {
    expect(getWrongGuessCount({ guesses: [], hintUsed: true })).toBe(1);
  });

  it('counts wrong guesses plus hint together', () => {
    expect(getWrongGuessCount({ guesses: ['BAD', 'NOPE'], hintUsed: true })).toBe(3);
  });
});

describe('calcRoundScore', () => {
  it('returns 6 for 0 wrong guesses (solved first try)', () => {
    expect(calcRoundScore(0)).toBe(6);
  });

  it('deducts 1 per wrong guess', () => {
    expect(calcRoundScore(1)).toBe(5);
    expect(calcRoundScore(3)).toBe(3);
    expect(calcRoundScore(5)).toBe(1);
  });

  it('returns 0 when 6 wrong guesses used', () => {
    expect(calcRoundScore(6)).toBe(0);
  });

  it('never returns a negative score', () => {
    expect(calcRoundScore(7)).toBe(0);
    expect(calcRoundScore(100)).toBe(0);
  });
});

describe('calcTotalScore', () => {
  it('returns 6 for a single round solved on first try', () => {
    const rounds = [{ guesses: [], solved: true, hintUsed: false }];
    expect(calcTotalScore(rounds)).toBe(6);
  });

  it('scores 0 for an unsolved round', () => {
    const rounds = [
      { guesses: ['A', 'B', 'C', 'D', 'E', 'F'], solved: false, hintUsed: false },
    ];
    expect(calcTotalScore(rounds)).toBe(0);
  });

  it('sums scores across all rounds', () => {
    const rounds = [
      { guesses: [], solved: true, hintUsed: false },            // 6 pts
      { guesses: ['WRONG'], solved: true, hintUsed: false },     // 5 pts
      { guesses: ['A', 'B', 'C', 'D', 'E', 'F'], solved: false, hintUsed: false }, // 0 pts
    ];
    expect(calcTotalScore(rounds)).toBe(11);
  });

  it('counts hint as one wrong guess toward scoring', () => {
    // Solved with 1 wrong guess + hint used = 2 wrong guesses total → 4 pts
    const rounds = [{ guesses: ['WRONG'], solved: true, hintUsed: true }];
    expect(calcTotalScore(rounds)).toBe(4);
  });

  it('returns max 36 for all 6 rounds solved first try', () => {
    const rounds = Array(6).fill(null).map(() => ({ guesses: [], solved: true, hintUsed: false }));
    expect(calcTotalScore(rounds)).toBe(36);
  });

  it('returns 0 for all rounds failed', () => {
    const rounds = Array(6).fill(null).map(() => ({
      guesses: ['A', 'B', 'C', 'D', 'E', 'F'],
      solved: false,
      hintUsed: false,
    }));
    expect(calcTotalScore(rounds)).toBe(0);
  });
});
