import { describe, it, expect } from 'vitest';
import { renderProgress } from '../component-progress.js';

describe('renderProgress', () => {
  const makeRounds = (count) =>
    Array.from({ length: count }, () => ({ guesses: [], solved: false, hintUsed: false }));

  it('renders a container with 6 dots for a 6-round puzzle', () => {
    const el = renderProgress({ currentRound: 0, rounds: makeRounds(6) });
    const dots = el.querySelectorAll('.dot');
    expect(dots.length).toBe(6);
  });

  it('marks the current round dot as dot-current', () => {
    const el = renderProgress({ currentRound: 2, rounds: makeRounds(6) });
    const dots = el.querySelectorAll('.dot');
    expect(dots[2].classList.contains('dot-current')).toBe(true);
  });

  it('shows attempt count (wrong guesses + hint) in the current dot', () => {
    const rounds = makeRounds(6);
    rounds[1].guesses = ['WRONG', 'ALSO'];
    const el = renderProgress({ currentRound: 1, rounds });
    const dots = el.querySelectorAll('.dot');
    expect(dots[1].textContent).toBe('2');
  });

  it('shows attempt count including hint in the current dot', () => {
    const rounds = makeRounds(6);
    rounds[0].guesses = ['MISS'];
    rounds[0].hintUsed = true;
    const el = renderProgress({ currentRound: 0, rounds });
    const dots = el.querySelectorAll('.dot');
    expect(dots[0].textContent).toBe('2');
  });

  it('marks solved past rounds as dot-success', () => {
    const rounds = makeRounds(6);
    rounds[0].solved = true;
    const el = renderProgress({ currentRound: 1, rounds });
    const dots = el.querySelectorAll('.dot');
    expect(dots[0].classList.contains('dot-success')).toBe(true);
  });

  it('marks failed past rounds as dot-fail', () => {
    const rounds = makeRounds(6);
    rounds[0].guesses = ['A', 'B', 'C', 'D', 'E', 'F']; // 6 wrong
    const el = renderProgress({ currentRound: 1, rounds });
    const dots = el.querySelectorAll('.dot');
    expect(dots[0].classList.contains('dot-fail')).toBe(true);
  });

  it('marks future rounds as dot-future', () => {
    const el = renderProgress({ currentRound: 0, rounds: makeRounds(6) });
    const dots = el.querySelectorAll('.dot');
    for (let i = 1; i < 6; i++) {
      expect(dots[i].classList.contains('dot-future')).toBe(true);
    }
  });

  it('renders connecting lines between dots', () => {
    const el = renderProgress({ currentRound: 0, rounds: makeRounds(6) });
    const lines = el.querySelectorAll('.progress-line');
    expect(lines.length).toBe(5);
  });

  it('shows 0 attempt count when no guesses made on current round', () => {
    const el = renderProgress({ currentRound: 0, rounds: makeRounds(6) });
    const dots = el.querySelectorAll('.dot');
    expect(dots[0].textContent).toBe('0');
  });

  it('has aria-label on current dot', () => {
    const el = renderProgress({ currentRound: 0, rounds: makeRounds(6) });
    const dots = el.querySelectorAll('.dot');
    expect(dots[0].getAttribute('aria-label')).toBeTruthy();
  });
});
