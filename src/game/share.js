import { calcTotalScore } from './scoring.js';

const CORRECT = '🟩';
const WRONG = '⬛';

export function buildShareString(state, puzzle) {
  const score = calcTotalScore(state.rounds);

  const grid = state.rounds.map((round) => {
    const wrongCount = round.guesses.length + (round.hintUsed ? 1 : 0);
    if (round.solved) {
      return WRONG.repeat(wrongCount) + CORRECT;
    }
    return WRONG.repeat(6);
  }).join('\n');

  return `📖 Literature Game — ${state.date}\n${puzzle.title}\n${score}/36\n\n${grid}`;
}
