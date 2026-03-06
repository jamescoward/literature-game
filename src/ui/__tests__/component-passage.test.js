import { describe, it, expect } from 'vitest';
import { renderPassage } from '../component-passage.js';
import { getRevealedLetters } from '../../game/state.js';

// A short passage with a known word for testing
const PASSAGE = 'She walked through the forest alone.';
const WORD = 'forest';
// word_start: index of 'f' in the passage
const WORD_START = PASSAGE.indexOf('forest');
const WORD_END = WORD_START + WORD.length - 1;

describe('renderPassage', () => {
  const revealedZero = getRevealedLetters(WORD, 0);

  it('renders a passage wrapper element', () => {
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, null, false, () => {});
    expect(el.querySelector('.passage-text')).toBeTruthy();
  });

  it('renders text before and after the hidden word', () => {
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, null, false, () => {});
    const text = el.textContent;
    expect(text).toContain('She walked through the');
    expect(text).toContain('alone.');
  });

  it('renders revealed letters as bold chars', () => {
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, null, false, () => {});
    const chars = el.querySelectorAll('.word-char');
    // 'forest': first (f) and last (t) always revealed
    expect(chars.length).toBe(2);
    expect(chars[0].textContent).toBe('f');
    expect(chars[1].textContent).toBe('t');
  });

  it('renders unrevealed positions as blanks', () => {
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, null, false, () => {});
    const blanks = el.querySelectorAll('.word-blank');
    // 'forest' = 6 letters, 2 revealed (first/last), 4 blank
    expect(blanks.length).toBe(4);
  });

  it('reveals more letters after wrong guesses', () => {
    const revealed2 = getRevealedLetters(WORD, 2);
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealed2, null, false, () => {});
    const chars = el.querySelectorAll('.word-char');
    // 2 wrong guesses reveals 2 extra, so 4 total revealed
    expect(chars.length).toBe(4);
  });

  it('renders HINT button', () => {
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, null, false, () => {});
    const btn = el.querySelector('.hint-btn');
    expect(btn).toBeTruthy();
    expect(btn.textContent.toUpperCase()).toContain('HINT');
  });

  it('disables HINT button when hint already used', () => {
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, 'A clue', true, () => {});
    const btn = el.querySelector('.hint-btn');
    expect(btn.disabled).toBe(true);
  });

  it('shows hint text when hint is used', () => {
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, 'A dense woodland', true, () => {});
    expect(el.textContent).toContain('A dense woodland');
  });

  it('calls onHint when HINT button clicked', () => {
    let called = false;
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, null, false, () => { called = true; });
    el.querySelector('.hint-btn').click();
    expect(called).toBe(true);
  });

  // 'forest': positions 0=f(revealed), 1=o, 2=r, 3=e, 4=s, 5=t(revealed)
  // blanks at positions 1,2,3,4
  it('fills blank positions with typed letters from currentGuess', () => {
    // currentGuess 'FO' → position 1 ('O') is a blank and has a typed letter
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, null, false, () => {}, 'FO');
    const filled = el.querySelectorAll('.word-blank-filled');
    expect(filled.length).toBe(1);
    expect(filled[0].textContent.toUpperCase()).toBe('O');
  });

  it('shows no filled blanks when currentGuess is empty', () => {
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, null, false, () => {}, '');
    expect(el.querySelectorAll('.word-blank-filled').length).toBe(0);
  });

  it('fills multiple blanks when currentGuess covers several positions', () => {
    // 'FORE': positions 0=F(revealed), 1=O(blank), 2=R(blank), 3=E(blank)
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, null, false, () => {}, 'FORE');
    const filled = el.querySelectorAll('.word-blank-filled');
    expect(filled.length).toBe(3); // positions 1, 2, 3
    expect(filled[0].textContent.toUpperCase()).toBe('O');
    expect(filled[1].textContent.toUpperCase()).toBe('R');
    expect(filled[2].textContent.toUpperCase()).toBe('E');
  });

  it('does not fill revealed positions (they are .word-char not blanks)', () => {
    // Position 0 is always revealed, so typing 'F' only → no blank filled
    const el = renderPassage(PASSAGE, WORD, WORD_START, WORD_END, revealedZero, null, false, () => {}, 'F');
    expect(el.querySelectorAll('.word-blank-filled').length).toBe(0);
  });
});
