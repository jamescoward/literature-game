import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderSummary } from '../screen-summary.js';

const puzzle = {
  id: 'test-book',
  title: 'Test Book',
  author: 'Test Author',
  gutenberg_id: 123,
  rounds: [
    { passage: 'A test passage.', word: 'test', word_start: 2, word_end: 5, hint: 'An exam' },
    { passage: 'She walked alone.', word: 'alone', word_start: 11, word_end: 15, hint: 'Solo' },
  ],
};

const solvedState = {
  date: '2026-03-06',
  puzzleId: 'test-book',
  currentRound: 1,
  complete: true,
  rounds: [
    { guesses: [], solved: true, hintUsed: false },
    { guesses: ['WRONG'], solved: true, hintUsed: false },
  ],
};

const failedState = {
  ...solvedState,
  rounds: [
    { guesses: ['A', 'B', 'C', 'D', 'E', 'F'], solved: false, hintUsed: false },
    { guesses: [], solved: false, hintUsed: false },
  ],
};

describe('renderSummary', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it('renders the summary screen container', () => {
    const el = renderSummary(solvedState, puzzle);
    expect(el.classList.contains('screen-summary')).toBe(true);
  });

  it('shows the book title', () => {
    const el = renderSummary(solvedState, puzzle);
    expect(el.textContent).toContain('Test Book');
  });

  it('shows the book author', () => {
    const el = renderSummary(solvedState, puzzle);
    expect(el.textContent).toContain('Test Author');
  });

  it('shows the total score', () => {
    const el = renderSummary(solvedState, puzzle);
    // round 0: 6pts (0 wrong), round 1: 5pts (1 wrong) => 11
    expect(el.textContent).toContain('11');
  });

  it('shows each word from the puzzle', () => {
    const el = renderSummary(solvedState, puzzle);
    expect(el.textContent).toContain('test');
    expect(el.textContent).toContain('alone');
  });

  it('marks solved rounds visually', () => {
    const el = renderSummary(solvedState, puzzle);
    const solvedRounds = el.querySelectorAll('.summary-round.solved');
    expect(solvedRounds.length).toBe(2);
  });

  it('marks failed rounds visually', () => {
    const el = renderSummary(failedState, puzzle);
    const failedRounds = el.querySelectorAll('.summary-round.failed');
    expect(failedRounds.length).toBe(2);
  });

  it('has a share button', () => {
    const el = renderSummary(solvedState, puzzle);
    const shareBtn = el.querySelector('.btn-share');
    expect(shareBtn).toBeTruthy();
  });

  it('has a link to the Gutenberg page', () => {
    const el = renderSummary(solvedState, puzzle);
    const link = el.querySelector('.btn-gutenberg');
    expect(link).toBeTruthy();
    expect(link.href).toContain('gutenberg.org');
  });

  it('share button copies text to clipboard', async () => {
    const el = renderSummary(solvedState, puzzle);
    document.body.appendChild(el);
    const shareBtn = el.querySelector('.btn-share');
    shareBtn.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const text = navigator.clipboard.writeText.mock.calls[0][0];
    expect(text).toContain('Test Book');
  });
});
