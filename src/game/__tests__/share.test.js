import { describe, it, expect } from 'vitest';
import { buildShareString } from '../share.js';

const mockPuzzle = {
  id: 'frankenstein',
  title: 'Frankenstein',
  author: 'Mary Shelley',
};

const completedState = {
  date: '2026-03-06',
  puzzleId: 'frankenstein',
  currentRound: 5,
  complete: true,
  rounds: [
    { guesses: [], solved: true, hintUsed: false },                                  // 6 pts: 🟩
    { guesses: ['WRONG'], solved: true, hintUsed: false },                           // 5 pts: ⬛🟩
    { guesses: ['A', 'B', 'C', 'D', 'E', 'F'], solved: false, hintUsed: false },    // 0 pts: ⬛⬛⬛⬛⬛⬛
    { guesses: ['BAD'], solved: true, hintUsed: true },                              // 4 pts: ⬛⬛🟩
    { guesses: [], solved: true, hintUsed: false },                                  // 6 pts: 🟩
    { guesses: [], solved: true, hintUsed: false },                                  // 6 pts: 🟩
  ], // total: 6+5+0+4+6+6 = 27
};

describe('buildShareString', () => {
  it('includes the date', () => {
    const result = buildShareString(completedState, mockPuzzle);
    expect(result).toContain('2026-03-06');
  });

  it('includes the book title', () => {
    const result = buildShareString(completedState, mockPuzzle);
    expect(result).toContain('Frankenstein');
  });

  it('includes the total score out of 36', () => {
    const result = buildShareString(completedState, mockPuzzle);
    expect(result).toContain('27/36');
  });

  it('shows 🟩 alone for a round solved on first try with no hint', () => {
    const result = buildShareString(completedState, mockPuzzle);
    // Round 1 and round 5 have no wrong guesses → single 🟩
    const lines = result.split('\n');
    expect(lines).toContain('🟩');
  });

  it('shows ⬛ before 🟩 for each wrong guess before solving', () => {
    const result = buildShareString(completedState, mockPuzzle);
    // Round 2: 1 wrong → ⬛🟩
    expect(result).toContain('⬛🟩');
  });

  it('shows 6 ⬛ for a failed round', () => {
    const result = buildShareString(completedState, mockPuzzle);
    // Round 3: all 6 wrong → ⬛⬛⬛⬛⬛⬛
    expect(result).toContain('⬛⬛⬛⬛⬛⬛');
  });

  it('counts hint as an extra ⬛ in the share grid', () => {
    const result = buildShareString(completedState, mockPuzzle);
    // Round 4: 1 wrong + hint + solved → ⬛⬛🟩
    expect(result).toContain('⬛⬛🟩');
  });

  it('has exactly 6 grid rows for a completed game', () => {
    const result = buildShareString(completedState, mockPuzzle);
    const emojiLines = result.split('\n').filter(
      (line) => line.includes('🟩') || line.includes('⬛')
    );
    expect(emojiLines).toHaveLength(6);
  });

  it('calculates score 0/36 for all-failed rounds', () => {
    const allFailed = {
      ...completedState,
      rounds: Array(6).fill(null).map(() => ({
        guesses: ['A', 'B', 'C', 'D', 'E', 'F'],
        solved: false,
        hintUsed: false,
      })),
    };
    expect(buildShareString(allFailed, mockPuzzle)).toContain('0/36');
  });
});
