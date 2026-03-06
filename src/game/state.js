const MAX_WRONG_GUESSES = 6;
const STORAGE_KEY_PREFIX = 'literature-game-';

export function initState(puzzle, date) {
  return {
    date,
    puzzleId: puzzle.id,
    currentRound: 0,
    rounds: puzzle.rounds.map(() => ({
      guesses: [],    // wrong guesses only
      solved: false,
      hintUsed: false,
    })),
    complete: false,
  };
}

export function isRoundOver(roundState) {
  const wrongCount = roundState.guesses.length + (roundState.hintUsed ? 1 : 0);
  return roundState.solved || wrongCount >= MAX_WRONG_GUESSES;
}

export function submitGuess(state, puzzle, guess) {
  if (state.complete) return state;

  const roundIndex = state.currentRound;
  const roundState = state.rounds[roundIndex];

  if (isRoundOver(roundState)) return state;

  const word = puzzle.rounds[roundIndex].word;
  const isCorrect = guess.toLowerCase() === word.toLowerCase();

  const newRoundState = isCorrect
    ? { ...roundState, solved: true }
    : { ...roundState, guesses: [...roundState.guesses, guess.toUpperCase()] };

  const updatedRounds = state.rounds.map((r, i) =>
    i === roundIndex ? newRoundState : r
  );

  return { ...state, rounds: updatedRounds };
}

export function useHint(state) {
  const roundIndex = state.currentRound;
  const roundState = state.rounds[roundIndex];

  if (roundState.hintUsed || isRoundOver(roundState) || state.complete) return state;

  const newRoundState = { ...roundState, hintUsed: true };
  const updatedRounds = state.rounds.map((r, i) =>
    i === roundIndex ? newRoundState : r
  );

  return { ...state, rounds: updatedRounds };
}

export function advanceRound(state, puzzle) {
  const nextRound = state.currentRound + 1;
  if (nextRound >= puzzle.rounds.length) {
    return { ...state, complete: true };
  }
  return { ...state, currentRound: nextRound };
}

export function getRevealedLetters(word, wrongGuessCount) {
  const len = word.length;
  const revealed = new Set([0, len - 1]);

  if (len >= 7) {
    revealed.add(Math.floor(len / 2));
  }

  // Reveal additional positions left-to-right, skipping already revealed ones
  let reveals = 0;
  for (let pos = 1; pos < len - 1 && reveals < wrongGuessCount; pos++) {
    if (!revealed.has(pos)) {
      revealed.add(pos);
      reveals++;
    }
  }

  return word.split('').map((letter, i) => ({
    letter,
    revealed: revealed.has(i),
  }));
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + state.date, JSON.stringify(state));
  } catch (_) {
    // localStorage unavailable (SSR, private mode, storage full)
  }
}

export function loadState(date) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + date);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}
