import {
  submitGuess,
  useHint,
  advanceRound,
  isRoundOver,
  getRevealedLetters,
  saveState,
} from '../game/state.js';
import { renderProgress } from './component-progress.js';
import { renderPassage } from './component-passage.js';
import { renderKeyboard } from './component-keyboard.js';
import { createToast } from './component-toast.js';

const ADVANCE_DELAY_MS = 800;

/**
 * renderGameScreen(initialState, puzzle, onComplete)
 *
 * initialState - game state object from initState() or loadState()
 * puzzle       - puzzle data object
 * onComplete   - called with final state when game is fully done
 *
 * Returns a DOM element for the full game screen.
 */
export function renderGameScreen(initialState, puzzle, onComplete) {
  let state = initialState;
  let currentGuess = '';

  const screen = document.createElement('div');
  screen.className = 'screen-game';

  // Header
  const header = document.createElement('div');
  header.className = 'game-header';
  const titleEl = document.createElement('div');
  titleEl.className = 'game-title';
  titleEl.textContent = puzzle.title;
  const authorEl = document.createElement('div');
  authorEl.className = 'game-author';
  authorEl.textContent = puzzle.author;
  header.appendChild(titleEl);
  header.appendChild(authorEl);
  screen.appendChild(header);

  // Progress (placeholder, will be replaced on render)
  let progressEl = document.createElement('div');
  screen.appendChild(progressEl);

  // Passage (placeholder)
  let passageEl = document.createElement('div');
  screen.appendChild(passageEl);

  // Guess display
  const guessDisplay = document.createElement('div');
  guessDisplay.className = 'guess-display';
  screen.appendChild(guessDisplay);

  // Keyboard (placeholder)
  let keyboardEl = document.createElement('div');
  screen.appendChild(keyboardEl);

  const toast = createToast();

  // Build letter state map from all past wrong guesses in current round
  function buildLetterStates() {
    const states = {};
    const roundState = state.rounds[state.currentRound];
    roundState.guesses.forEach(guess => {
      [...guess].forEach(letter => {
        if (!states[letter] || states[letter] !== 'correct') {
          states[letter] = 'wrong';
        }
      });
    });
    return states;
  }

  function getRoundData() {
    const roundIndex = state.currentRound;
    const puzzleRound = puzzle.rounds[roundIndex];
    const roundState = state.rounds[roundIndex];
    const wrongCount = roundState.guesses.length + (roundState.hintUsed ? 1 : 0);
    const revealed = getRevealedLetters(puzzleRound.word, wrongCount);
    return { puzzleRound, roundState, revealed, wrongCount };
  }

  function render() {
    const { puzzleRound, roundState, revealed } = getRoundData();

    // Replace progress
    const newProgress = renderProgress(state);
    screen.replaceChild(newProgress, progressEl);
    progressEl = newProgress;

    // Replace passage
    const newPassage = renderPassage(
      puzzleRound.passage,
      puzzleRound.word,
      puzzleRound.word_start,
      puzzleRound.word_end,
      revealed,
      roundState.hintUsed ? puzzleRound.hint : null,
      roundState.hintUsed,
      handleHint,
    );
    screen.replaceChild(newPassage, passageEl);
    passageEl = newPassage;

    // Guess display
    guessDisplay.textContent = currentGuess;

    // Replace keyboard
    const newKeyboard = renderKeyboard(buildLetterStates(), {
      onKey: handleKey,
      onEnter: handleEnter,
      onBackspace: handleBackspace,
    });
    screen.replaceChild(newKeyboard, keyboardEl);
    keyboardEl = newKeyboard;
  }

  function handleKey(letter) {
    const roundState = state.rounds[state.currentRound];
    if (isRoundOver(roundState) || state.complete) return;
    const maxLen = puzzle.rounds[state.currentRound].word.length;
    if (currentGuess.length >= maxLen) return;
    currentGuess += letter;
    guessDisplay.textContent = currentGuess;
  }

  function handleBackspace() {
    if (currentGuess.length === 0) return;
    currentGuess = currentGuess.slice(0, -1);
    guessDisplay.textContent = currentGuess;
  }

  function handleEnter() {
    const roundState = state.rounds[state.currentRound];
    if (isRoundOver(roundState) || state.complete) return;

    const expectedLen = puzzle.rounds[state.currentRound].word.length;
    if (currentGuess.length !== expectedLen) {
      toast.show(`Word must be ${expectedLen} letters`);
      return;
    }

    const prevState = state;
    state = submitGuess(state, puzzle, currentGuess);
    currentGuess = '';

    const newRoundState = state.rounds[state.currentRound];

    if (newRoundState.solved) {
      saveState(state);
      toast.show('Correct!');
      render();
      if (passageEl) passageEl.classList.add('flash-green');
      setTimeout(() => {
        state = advanceRound(state, puzzle);
        saveState(state);
        if (state.complete) {
          onComplete(state);
        } else {
          render();
        }
      }, ADVANCE_DELAY_MS);
    } else if (isRoundOver(newRoundState)) {
      saveState(state);
      toast.show(`The word was: ${puzzle.rounds[state.currentRound].word.toUpperCase()}`);
      render();
      setTimeout(() => {
        state = advanceRound(state, puzzle);
        saveState(state);
        if (state.complete) {
          onComplete(state);
        } else {
          render();
        }
      }, ADVANCE_DELAY_MS * 2);
    } else {
      saveState(state);
      if (passageEl) {
        passageEl.classList.remove('shake');
        void passageEl.offsetWidth; // force reflow
        passageEl.classList.add('shake');
      }
      render();
    }
  }

  function handleHint() {
    state = useHint(state);
    saveState(state);
    render();
  }

  render();
  return screen;
}
