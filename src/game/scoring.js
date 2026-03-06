export function getWrongGuessCount(roundState) {
  return roundState.guesses.length + (roundState.hintUsed ? 1 : 0);
}

export function calcRoundScore(wrongGuessCount) {
  return Math.max(0, 6 - wrongGuessCount);
}

export function calcTotalScore(rounds) {
  return rounds.reduce((total, round) => {
    if (!round.solved) return total;
    return total + calcRoundScore(getWrongGuessCount(round));
  }, 0);
}
