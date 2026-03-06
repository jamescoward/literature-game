import { describe, it, expect } from 'vitest';
import {
  initState,
  submitGuess,
  useHint,
  advanceRound,
  isRoundOver,
  getRevealedLetters,
} from '../state.js';

const mockPuzzle = {
  id: 'test-book',
  rounds: [
    { word: 'fine', passage: 'It must be so fine for you.', hint: 'Of high quality' },
    { word: 'tempt', passage: 'Not handsome enough to tempt me.', hint: 'To entice' },
    { word: 'selfish', passage: 'I have been a selfish being.', hint: 'Self-centred' },
  ],
};

const DATE = '2026-03-06';

// ─── initState ───────────────────────────────────────────────────────────────

describe('initState', () => {
  it('sets the date and puzzleId', () => {
    const state = initState(mockPuzzle, DATE);
    expect(state.date).toBe(DATE);
    expect(state.puzzleId).toBe('test-book');
  });

  it('starts at round 0', () => {
    const state = initState(mockPuzzle, DATE);
    expect(state.currentRound).toBe(0);
  });

  it('creates an empty round entry for each puzzle round', () => {
    const state = initState(mockPuzzle, DATE);
    expect(state.rounds).toHaveLength(3);
    for (const round of state.rounds) {
      expect(round.guesses).toEqual([]);
      expect(round.solved).toBe(false);
      expect(round.hintUsed).toBe(false);
    }
  });

  it('starts with complete = false', () => {
    const state = initState(mockPuzzle, DATE);
    expect(state.complete).toBe(false);
  });
});

// ─── submitGuess ─────────────────────────────────────────────────────────────

describe('submitGuess', () => {
  it('marks round as solved on a correct guess', () => {
    const state = initState(mockPuzzle, DATE);
    const next = submitGuess(state, mockPuzzle, 'fine');
    expect(next.rounds[0].solved).toBe(true);
  });

  it('correct guess is case-insensitive', () => {
    const state = initState(mockPuzzle, DATE);
    const next = submitGuess(state, mockPuzzle, 'FINE');
    expect(next.rounds[0].solved).toBe(true);
  });

  it('does NOT add a correct guess to the guesses array', () => {
    const state = initState(mockPuzzle, DATE);
    const next = submitGuess(state, mockPuzzle, 'fine');
    expect(next.rounds[0].guesses).toHaveLength(0);
  });

  it('adds a wrong guess to the guesses array', () => {
    const state = initState(mockPuzzle, DATE);
    const next = submitGuess(state, mockPuzzle, 'fire');
    expect(next.rounds[0].guesses).toContain('FIRE');
    expect(next.rounds[0].solved).toBe(false);
  });

  it('stores wrong guesses in uppercase', () => {
    const state = initState(mockPuzzle, DATE);
    const next = submitGuess(state, mockPuzzle, 'fire');
    expect(next.rounds[0].guesses[0]).toBe('FIRE');
  });

  it('does not mutate the original state', () => {
    const state = initState(mockPuzzle, DATE);
    submitGuess(state, mockPuzzle, 'fire');
    expect(state.rounds[0].guesses).toHaveLength(0);
  });

  it('does nothing if the round is already over', () => {
    let state = initState(mockPuzzle, DATE);
    state = submitGuess(state, mockPuzzle, 'fine'); // solve round
    const after = submitGuess(state, mockPuzzle, 'fire');
    expect(after.rounds[0].guesses).toHaveLength(0);
    expect(after.rounds[0].solved).toBe(true);
  });

  it('does nothing if game is complete', () => {
    let state = initState(mockPuzzle, DATE);
    state = { ...state, complete: true };
    const after = submitGuess(state, mockPuzzle, 'fine');
    expect(after.rounds[0].solved).toBe(false);
  });
});

// ─── isRoundOver ─────────────────────────────────────────────────────────────

describe('isRoundOver', () => {
  it('returns false when a round is not yet solved and has fewer than 6 wrong guesses', () => {
    const round = { guesses: ['BAD', 'ALSO'], solved: false, hintUsed: false };
    expect(isRoundOver(round)).toBe(false);
  });

  it('returns true when a round is solved', () => {
    const round = { guesses: [], solved: true, hintUsed: false };
    expect(isRoundOver(round)).toBe(true);
  });

  it('returns true when 6 wrong guesses have been made', () => {
    const round = {
      guesses: ['A', 'B', 'C', 'D', 'E', 'F'],
      solved: false,
      hintUsed: false,
    };
    expect(isRoundOver(round)).toBe(true);
  });

  it('counts hint toward the 6-attempt limit', () => {
    const round = {
      guesses: ['A', 'B', 'C', 'D', 'E'],
      solved: false,
      hintUsed: true,
    };
    expect(isRoundOver(round)).toBe(true);
  });
});

// ─── useHint ─────────────────────────────────────────────────────────────────

describe('useHint', () => {
  it('marks hintUsed as true', () => {
    const state = initState(mockPuzzle, DATE);
    const next = useHint(state);
    expect(next.rounds[0].hintUsed).toBe(true);
  });

  it('does not mutate the original state', () => {
    const state = initState(mockPuzzle, DATE);
    useHint(state);
    expect(state.rounds[0].hintUsed).toBe(false);
  });

  it('does nothing if hint already used this round', () => {
    let state = initState(mockPuzzle, DATE);
    state = useHint(state);
    const after = useHint(state);
    expect(after).toBe(state); // same reference = no change
  });

  it('does nothing if the round is already over', () => {
    let state = initState(mockPuzzle, DATE);
    state = submitGuess(state, mockPuzzle, 'fine');
    const after = useHint(state);
    expect(after).toBe(state);
  });
});

// ─── advanceRound ─────────────────────────────────────────────────────────────

describe('advanceRound', () => {
  it('increments currentRound by 1', () => {
    const state = initState(mockPuzzle, DATE);
    const next = advanceRound(state, mockPuzzle);
    expect(next.currentRound).toBe(1);
  });

  it('sets complete = true when advancing past the last round', () => {
    let state = initState(mockPuzzle, DATE);
    state = { ...state, currentRound: 2 }; // last round index
    const next = advanceRound(state, mockPuzzle);
    expect(next.complete).toBe(true);
  });

  it('does not mutate the original state', () => {
    const state = initState(mockPuzzle, DATE);
    advanceRound(state, mockPuzzle);
    expect(state.currentRound).toBe(0);
  });
});

// ─── getRevealedLetters ───────────────────────────────────────────────────────

describe('getRevealedLetters', () => {
  it('always reveals first and last letters with no wrong guesses', () => {
    const letters = getRevealedLetters('fine', 0);
    expect(letters[0]).toEqual({ letter: 'f', revealed: true });
    expect(letters[3]).toEqual({ letter: 'e', revealed: true });
  });

  it('hides middle letters initially for a short word', () => {
    const letters = getRevealedLetters('fine', 0); // 4 letters
    expect(letters[1].revealed).toBe(false);
    expect(letters[2].revealed).toBe(false);
  });

  it('reveals additional letters left-to-right after each wrong guess', () => {
    const after1 = getRevealedLetters('fine', 1);
    expect(after1[1].revealed).toBe(true); // position 1 revealed after 1 wrong
    expect(after1[2].revealed).toBe(false);
  });

  it('reveals middle anchor for words of 7+ letters', () => {
    // 'selfish' = 7 letters, middle = index 3 ('f')
    const letters = getRevealedLetters('selfish', 0);
    expect(letters[0].revealed).toBe(true);  // first
    expect(letters[3].revealed).toBe(true);  // middle anchor
    expect(letters[6].revealed).toBe(true);  // last
    expect(letters[1].revealed).toBe(false);
    expect(letters[2].revealed).toBe(false);
    expect(letters[4].revealed).toBe(false);
    expect(letters[5].revealed).toBe(false);
  });

  it('does not reveal more than available positions', () => {
    // 'fine' (4 letters): positions 0, 3 are always revealed; 1, 2 can be revealed
    const letters = getRevealedLetters('fine', 10); // more wrong guesses than positions
    expect(letters.every((l) => l.revealed)).toBe(true);
  });

  it('returns the correct letter at each position', () => {
    const letters = getRevealedLetters('tempt', 0);
    expect(letters.map((l) => l.letter)).toEqual(['t', 'e', 'm', 'p', 't']);
  });
});
