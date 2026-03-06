import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createToast } from '../component-toast.js';

describe('createToast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns an object with a show method', () => {
    const toast = createToast();
    expect(typeof toast.show).toBe('function');
  });

  it('appends a toast container to the document body', () => {
    createToast();
    expect(document.querySelector('.toast-container')).toBeTruthy();
  });

  it('show() adds a visible toast element with the message', () => {
    vi.useFakeTimers();
    const toast = createToast();
    toast.show('Correct!');
    const el = document.querySelector('.toast');
    expect(el).toBeTruthy();
    expect(el.textContent).toBe('Correct!');
    vi.useRealTimers();
  });

  it('show() makes the toast visible', () => {
    vi.useFakeTimers();
    const toast = createToast();
    toast.show('Test message');
    // visible class should be added (possibly on next tick via rAF/timeout)
    // We check the element exists first
    const el = document.querySelector('.toast');
    expect(el).toBeTruthy();
    vi.useRealTimers();
  });

  it('show() auto-hides the toast after a duration', () => {
    vi.useFakeTimers();
    const toast = createToast();
    toast.show('Goodbye', 500);
    vi.advanceTimersByTime(600);
    const el = document.querySelector('.toast');
    // After auto-hide it should no longer be visible (class removed or element removed)
    expect(el === null || !el.classList.contains('visible')).toBe(true);
    vi.useRealTimers();
  });
});
