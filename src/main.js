import { getDailyPuzzle, getTodayDateString } from './game/puzzle.js';
import { initState, loadState, saveState } from './game/state.js';
import { renderGameScreen } from './ui/screen-game.js';
import { renderSummary } from './ui/screen-summary.js';

const app = document.getElementById('app');

function showError(message) {
  app.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'error-msg';
  el.textContent = message;
  app.appendChild(el);
}

function showLoading() {
  app.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'loading';
  el.textContent = 'Loading…';
  app.appendChild(el);
}

function mountSummary(state, puzzle) {
  app.innerHTML = '';
  const screen = renderSummary(state, puzzle);
  app.appendChild(screen);
}

function mountGame(state, puzzle) {
  app.innerHTML = '';
  const screen = renderGameScreen(state, puzzle, (finalState) => {
    saveState(finalState);
    mountSummary(finalState, puzzle);
  });
  app.appendChild(screen);
}

async function boot() {
  showLoading();

  let puzzles;
  try {
    const resp = await fetch('./data/puzzles.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    puzzles = data.puzzles;
  } catch (err) {
    showError('Failed to load puzzle data. Please refresh the page.');
    return;
  }

  const today = getTodayDateString();
  const puzzle = getDailyPuzzle(puzzles, today);

  // Restore or initialise state
  let state = loadState(today);

  if (!state || state.puzzleId !== puzzle.id) {
    state = initState(puzzle, today);
    saveState(state);
  }

  if (state.complete) {
    mountSummary(state, puzzle);
  } else {
    mountGame(state, puzzle);
  }
}

boot();
