import { describe, it, expect, vi } from 'vitest';
import { renderKeyboard } from '../component-keyboard.js';

describe('renderKeyboard', () => {
  const noCallbacks = { onKey: () => {}, onEnter: () => {}, onBackspace: () => {} };

  it('renders a keyboard element', () => {
    const el = renderKeyboard({}, noCallbacks);
    expect(el.classList.contains('keyboard')).toBe(true);
  });

  it('renders all 26 letter buttons', () => {
    const el = renderKeyboard({}, noCallbacks);
    const letterBtns = [...el.querySelectorAll('button.key')].filter(
      b => b.textContent.length === 1 && /[A-Z]/i.test(b.textContent)
    );
    expect(letterBtns.length).toBe(26);
  });

  it('renders an ENTER button', () => {
    const el = renderKeyboard({}, noCallbacks);
    const enterBtn = [...el.querySelectorAll('button')].find(b => b.textContent.toUpperCase().includes('ENTER'));
    expect(enterBtn).toBeTruthy();
  });

  it('renders a backspace/delete button', () => {
    const el = renderKeyboard({}, noCallbacks);
    const delBtn = [...el.querySelectorAll('button')].find(b =>
      b.textContent.includes('⌫') || b.getAttribute('aria-label')?.toLowerCase().includes('backspace')
    );
    expect(delBtn).toBeTruthy();
  });

  it('applies key-wrong class to wrong letters', () => {
    const el = renderKeyboard({ A: 'wrong' }, noCallbacks);
    const aBtn = [...el.querySelectorAll('button')].find(b => b.textContent === 'A');
    expect(aBtn.classList.contains('key-wrong')).toBe(true);
  });

  it('applies key-correct class to correct letters', () => {
    const el = renderKeyboard({ B: 'correct' }, noCallbacks);
    const bBtn = [...el.querySelectorAll('button')].find(b => b.textContent === 'B');
    expect(bBtn.classList.contains('key-correct')).toBe(true);
  });

  it('calls onKey with the letter when a letter button is clicked', () => {
    const onKey = vi.fn();
    const el = renderKeyboard({}, { ...noCallbacks, onKey });
    const sBtn = [...el.querySelectorAll('button')].find(b => b.textContent === 'S');
    sBtn.click();
    expect(onKey).toHaveBeenCalledWith('S');
  });

  it('calls onEnter when ENTER is clicked', () => {
    const onEnter = vi.fn();
    const el = renderKeyboard({}, { ...noCallbacks, onEnter });
    const enterBtn = [...el.querySelectorAll('button')].find(b => b.textContent.toUpperCase().includes('ENTER'));
    enterBtn.click();
    expect(onEnter).toHaveBeenCalled();
  });

  it('calls onBackspace when backspace button is clicked', () => {
    const onBackspace = vi.fn();
    const el = renderKeyboard({}, { ...noCallbacks, onBackspace });
    const delBtn = [...el.querySelectorAll('button')].find(b =>
      b.textContent.includes('⌫') || b.getAttribute('aria-label')?.toLowerCase().includes('backspace')
    );
    delBtn.click();
    expect(onBackspace).toHaveBeenCalled();
  });

  it('each letter key has an aria-label', () => {
    const el = renderKeyboard({}, noCallbacks);
    const letterBtns = [...el.querySelectorAll('button.key')].filter(
      b => b.textContent.length === 1 && /[A-Z]/i.test(b.textContent)
    );
    letterBtns.forEach(btn => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
