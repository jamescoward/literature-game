const MAX_WRONG = 6;

function dotClass(roundState, index, currentRound) {
  if (index === currentRound) return 'dot-current';
  if (index > currentRound) return 'dot-future';
  if (roundState.solved) return 'dot-success';
  return 'dot-fail';
}

function attemptCount(roundState) {
  return roundState.guesses.length + (roundState.hintUsed ? 1 : 0);
}

export function renderProgress(state) {
  const { currentRound, rounds } = state;

  const container = document.createElement('div');
  container.className = 'progress';

  const track = document.createElement('div');
  track.className = 'progress-track';

  rounds.forEach((round, i) => {
    const dot = document.createElement('div');
    const cls = dotClass(round, i, currentRound);
    dot.className = `dot ${cls}`;

    if (i === currentRound) {
      dot.textContent = String(attemptCount(round));
      dot.setAttribute('aria-label', `Round ${i + 1}, ${attemptCount(round)} of ${MAX_WRONG} attempts used`);
    } else if (cls === 'dot-success') {
      dot.setAttribute('aria-label', `Round ${i + 1} solved`);
    } else if (cls === 'dot-fail') {
      dot.setAttribute('aria-label', `Round ${i + 1} failed`);
    } else {
      dot.setAttribute('aria-label', `Round ${i + 1} upcoming`);
    }

    track.appendChild(dot);

    if (i < rounds.length - 1) {
      const line = document.createElement('div');
      line.className = 'progress-line';
      track.appendChild(line);
    }
  });

  container.appendChild(track);
  return container;
}
