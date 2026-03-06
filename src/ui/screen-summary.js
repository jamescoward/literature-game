import { calcTotalScore, getWrongGuessCount } from '../game/scoring.js';
import { buildShareString } from '../game/share.js';
import { createToast } from './component-toast.js';

export function renderSummary(state, puzzle) {
  const screen = document.createElement('div');
  screen.className = 'screen-summary';

  // Header
  const header = document.createElement('div');
  header.className = 'summary-header';

  const title = document.createElement('div');
  title.className = 'summary-title';
  title.textContent = puzzle.title;

  const author = document.createElement('div');
  author.className = 'summary-author';
  author.textContent = puzzle.author;

  header.appendChild(title);
  header.appendChild(author);
  screen.appendChild(header);

  // Score
  const totalScore = calcTotalScore(state.rounds);

  const scoreEl = document.createElement('div');
  scoreEl.className = 'summary-score';
  scoreEl.textContent = `${totalScore} / ${puzzle.rounds.length * 6}`;

  const scoreLabel = document.createElement('div');
  scoreLabel.className = 'summary-score-label';
  scoreLabel.textContent = 'Score';

  screen.appendChild(scoreEl);
  screen.appendChild(scoreLabel);

  // Round breakdown
  const roundsList = document.createElement('div');
  roundsList.className = 'summary-rounds';

  state.rounds.forEach((round, i) => {
    const puzzleRound = puzzle.rounds[i];
    const row = document.createElement('div');
    row.className = `summary-round ${round.solved ? 'solved' : 'failed'}`;

    const word = document.createElement('div');
    word.className = 'summary-round-word';
    word.textContent = puzzleRound.word;

    const result = document.createElement('div');
    result.className = 'summary-round-result';
    if (round.solved) {
      const wrong = getWrongGuessCount(round);
      result.textContent = wrong === 0 ? 'Perfect' : `${wrong} wrong`;
    } else {
      result.textContent = 'Failed';
    }

    row.appendChild(word);
    row.appendChild(result);
    roundsList.appendChild(row);
  });

  screen.appendChild(roundsList);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'summary-actions';

  const shareBtn = document.createElement('button');
  shareBtn.className = 'btn-share';
  shareBtn.textContent = 'Share Results';
  shareBtn.addEventListener('click', () => {
    const text = buildShareString(state, puzzle);
    navigator.clipboard.writeText(text).then(() => {
      const toast = createToast();
      toast.show('Copied to clipboard!', 1500);
    }).catch(() => {});
  });
  actions.appendChild(shareBtn);

  const gutenbergLink = document.createElement('a');
  gutenbergLink.className = 'btn-gutenberg';
  gutenbergLink.href = `https://www.gutenberg.org/ebooks/${puzzle.gutenberg_id}`;
  gutenbergLink.target = '_blank';
  gutenbergLink.rel = 'noopener noreferrer';
  gutenbergLink.textContent = 'Read the full book';
  actions.appendChild(gutenbergLink);

  screen.appendChild(actions);

  return screen;
}
