import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderHowToPlay,
  hasSeenHowToPlay,
  markHowToPlaySeen,
  showHowToPlayIfFirstVisit,
} from '../component-howtoplay.js';

const STORAGE_KEY = 'literature-game-howtoplay-seen';

describe('How to Play modal', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('renderHowToPlay returns a modal element', () => {
    const el = renderHowToPlay(() => {});
    expect(el.classList.contains('modal-howtoplay')).toBe(true);
  });

  it('modal contains game instructions', () => {
    const el = renderHowToPlay(() => {});
    const text = el.textContent.toLowerCase();
    expect(text).toContain('how to play');
  });

  it('modal has a close button', () => {
    const el = renderHowToPlay(() => {});
    const closeBtn = el.querySelector('.modal-close');
    expect(closeBtn).toBeTruthy();
  });

  it('calls onClose callback when close button is clicked', () => {
    let closed = false;
    const el = renderHowToPlay(() => { closed = true; });
    el.querySelector('.modal-close').click();
    expect(closed).toBe(true);
  });

  it('hasSeenHowToPlay returns false when never visited', () => {
    expect(hasSeenHowToPlay()).toBe(false);
  });

  it('hasSeenHowToPlay returns true after markHowToPlaySeen', () => {
    markHowToPlaySeen();
    expect(hasSeenHowToPlay()).toBe(true);
  });

  it('showHowToPlayIfFirstVisit appends modal on first visit', () => {
    showHowToPlayIfFirstVisit(document.body);
    expect(document.body.querySelector('.modal-howtoplay')).toBeTruthy();
  });

  it('showHowToPlayIfFirstVisit does not append modal on repeat visit', () => {
    markHowToPlaySeen();
    showHowToPlayIfFirstVisit(document.body);
    expect(document.body.querySelector('.modal-howtoplay')).toBeFalsy();
  });

  it('modal is removed from DOM when close button is clicked', () => {
    showHowToPlayIfFirstVisit(document.body);
    const closeBtn = document.body.querySelector('.modal-close');
    closeBtn.click();
    expect(document.body.querySelector('.modal-howtoplay')).toBeFalsy();
  });

  it('markHowToPlaySeen is called when modal is closed via close button', () => {
    showHowToPlayIfFirstVisit(document.body);
    const closeBtn = document.body.querySelector('.modal-close');
    closeBtn.click();
    expect(hasSeenHowToPlay()).toBe(true);
  });

  it('modal explains the blank letter mechanic', () => {
    const el = renderHowToPlay(() => {});
    const text = el.textContent.toLowerCase();
    // Should mention guessing or typing letters
    expect(text.includes('guess') || text.includes('letter') || text.includes('word')).toBe(true);
  });
});
