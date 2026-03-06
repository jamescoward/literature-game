import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderGameScreen } from '../screen-game.js';
import { initState } from '../../game/state.js';

const puzzle = {
  id: 'test-book',
  title: 'Classic Novel',
  author: 'An Author',
  gutenberg_id: 42,
  rounds: [
    { passage: 'She walked through the dark wood.', word: 'dark', word_start: 22, word_end: 25, hint: 'Opposite of light' },
    { passage: 'The brave knight stood there.', word: 'brave', word_start: 4, word_end: 8, hint: 'Courageous' },
    { passage: 'A simple puzzle for now.', word: 'simple', word_start: 2, word_end: 7, hint: 'Easy' },
    { passage: 'An ancient temple stood here.', word: 'ancient', word_start: 3, word_end: 9, hint: 'Very old' },
    { passage: 'The faithful soldier returned home.', word: 'faithful', word_start: 4, word_end: 11, hint: 'Loyal' },
    { passage: 'She discovered something remarkable.', word: 'discovered', word_start: 4, word_end: 13, hint: 'Found' },
  ],
};

describe('renderGameScreen', () => {
  let state;
  let onComplete;

  beforeEach(() => {
    document.body.innerHTML = '';
    state = initState(puzzle, '2026-03-06');
    onComplete = vi.fn();
  });

  it('renders the game screen container', () => {
    const el = renderGameScreen(state, puzzle, onComplete);
    expect(el.classList.contains('screen-game')).toBe(true);
  });

  it('shows the book title in the header', () => {
    const el = renderGameScreen(state, puzzle, onComplete);
    expect(el.textContent).toContain('Classic Novel');
  });

  it('renders the progress dots', () => {
    const el = renderGameScreen(state, puzzle, onComplete);
    const dots = el.querySelectorAll('.dot');
    expect(dots.length).toBe(6);
  });

  it('renders the passage text', () => {
    const el = renderGameScreen(state, puzzle, onComplete);
    expect(el.querySelector('.passage-text')).toBeTruthy();
  });

  it('renders the keyboard', () => {
    const el = renderGameScreen(state, puzzle, onComplete);
    expect(el.querySelector('.keyboard')).toBeTruthy();
  });

  it('typing letters updates the guess display', () => {
    const el = renderGameScreen(state, puzzle, onComplete);
    document.body.appendChild(el);
    const dBtn = [...el.querySelectorAll('button')].find(b => b.textContent === 'D');
    dBtn.click();
    const display = el.querySelector('.guess-display');
    expect(display.textContent).toContain('D');
  });

  it('submitting the correct word advances the round', () => {
    vi.useFakeTimers();
    const el = renderGameScreen(state, puzzle, onComplete);
    document.body.appendChild(el);

    // Type 'DARK' (round 0 word)
    ['D', 'A', 'R', 'K'].forEach(letter => {
      const btn = [...el.querySelectorAll('button')].find(b => b.textContent === letter);
      btn.click();
    });
    const enterBtn = [...el.querySelectorAll('button')].find(b => b.textContent.toUpperCase().includes('ENTER'));
    enterBtn.click();

    // After a short delay, should advance
    vi.advanceTimersByTime(1000);
    const dots = el.querySelectorAll('.dot');
    // current round should now be 1 (dot-current on index 1)
    expect(dots[1].classList.contains('dot-current')).toBe(true);
    vi.useRealTimers();
  });

  it('backspace removes the last typed letter', () => {
    const el = renderGameScreen(state, puzzle, onComplete);
    document.body.appendChild(el);

    const aBtn = [...el.querySelectorAll('button')].find(b => b.textContent === 'A');
    aBtn.click();
    const bsBtn = [...el.querySelectorAll('button')].find(b =>
      b.textContent.includes('⌫') || b.getAttribute('aria-label')?.toLowerCase().includes('backspace')
    );
    bsBtn.click();
    const display = el.querySelector('.guess-display');
    expect(display.textContent.trim()).toBe('');
  });

  // Round 0 word is 'dark': d(0,revealed) a(1,blank) r(2,blank) k(3,revealed)
  it('fills typed letters into passage blanks in real time', () => {
    const el = renderGameScreen(state, puzzle, onComplete);
    document.body.appendChild(el);

    // Type 'D' then 'A' — position 1 ('A') is a blank
    const dBtn = [...el.querySelectorAll('button')].find(b => b.textContent === 'D');
    dBtn.click();
    const aBtn2 = [...el.querySelectorAll('button')].find(b => b.textContent === 'A');
    aBtn2.click();

    const filled = el.querySelectorAll('.word-blank-filled');
    expect(filled.length).toBe(1);
    expect(filled[0].textContent.toUpperCase()).toBe('A');
  });

  it('removes filled letters from passage blanks on backspace', () => {
    const el = renderGameScreen(state, puzzle, onComplete);
    document.body.appendChild(el);

    const dBtn = [...el.querySelectorAll('button')].find(b => b.textContent === 'D');
    dBtn.click();
    const aBtn2 = [...el.querySelectorAll('button')].find(b => b.textContent === 'A');
    aBtn2.click();

    const bsBtn = [...el.querySelectorAll('button')].find(b =>
      b.textContent.includes('⌫') || b.getAttribute('aria-label')?.toLowerCase().includes('backspace')
    );
    bsBtn.click();

    expect(el.querySelectorAll('.word-blank-filled').length).toBe(0);
  });
});
