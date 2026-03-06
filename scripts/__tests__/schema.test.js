import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const puzzlesPath = join(process.cwd(), 'public/data/puzzles.json');

let data = null;
if (existsSync(puzzlesPath)) {
  data = JSON.parse(readFileSync(puzzlesPath, 'utf-8'));
}

const EXPECTED_WORD_LENGTHS = [4, 5, 6, 7, 8]; // rounds 1-5; round 6 is 9-12

describe('puzzles.json — schema', () => {
  it('file exists', () => {
    expect(existsSync(puzzlesPath)).toBe(true);
  });

  it('parses as valid JSON with a puzzles array', () => {
    expect(data).not.toBeNull();
    expect(Array.isArray(data.puzzles)).toBe(true);
  });

  it('contains at least 5 puzzle entries', () => {
    expect(data.puzzles.length).toBeGreaterThanOrEqual(5);
  });

  it('each puzzle has required top-level fields', () => {
    for (const puzzle of data.puzzles) {
      expect(puzzle, `puzzle "${puzzle.id}" missing id`).toHaveProperty('id');
      expect(puzzle, `puzzle "${puzzle.id}" missing title`).toHaveProperty('title');
      expect(puzzle, `puzzle "${puzzle.id}" missing author`).toHaveProperty('author');
      expect(puzzle, `puzzle "${puzzle.id}" missing gutenberg_id`).toHaveProperty('gutenberg_id');
      expect(puzzle, `puzzle "${puzzle.id}" missing rounds`).toHaveProperty('rounds');
    }
  });

  it('each puzzle has exactly 6 rounds', () => {
    for (const puzzle of data.puzzles) {
      expect(puzzle.rounds.length, `"${puzzle.id}" should have 6 rounds`).toBe(6);
    }
  });

  it('each round has required fields', () => {
    for (const puzzle of data.puzzles) {
      for (let i = 0; i < puzzle.rounds.length; i++) {
        const round = puzzle.rounds[i];
        const label = `"${puzzle.id}" round ${i + 1}`;
        expect(round, `${label} missing passage`).toHaveProperty('passage');
        expect(round, `${label} missing word`).toHaveProperty('word');
        expect(round, `${label} missing word_start`).toHaveProperty('word_start');
        expect(round, `${label} missing word_end`).toHaveProperty('word_end');
        expect(round, `${label} missing hint`).toHaveProperty('hint');
      }
    }
  });

  it('rounds 1-5 have words of lengths 4, 5, 6, 7, 8 respectively', () => {
    for (const puzzle of data.puzzles) {
      EXPECTED_WORD_LENGTHS.forEach((expectedLen, i) => {
        const word = puzzle.rounds[i].word;
        expect(word.length, `"${puzzle.id}" round ${i + 1}: word "${word}" should be ${expectedLen} letters`).toBe(expectedLen);
      });
    }
  });

  it('round 6 has a word of 9-12 letters', () => {
    for (const puzzle of data.puzzles) {
      const word = puzzle.rounds[5].word;
      expect(word.length, `"${puzzle.id}" round 6: word "${word}" should be 9-12 letters`).toBeGreaterThanOrEqual(9);
      expect(word.length, `"${puzzle.id}" round 6: word "${word}" should be 9-12 letters`).toBeLessThanOrEqual(12);
    }
  });

  it('word_start and word_end correctly index into the passage', () => {
    for (const puzzle of data.puzzles) {
      for (let i = 0; i < puzzle.rounds.length; i++) {
        const { passage, word, word_start, word_end } = puzzle.rounds[i];
        const label = `"${puzzle.id}" round ${i + 1}`;
        const extracted = passage.slice(word_start, word_end + 1);
        expect(extracted.toLowerCase(), `${label}: passage slice should match word`).toBe(word.toLowerCase());
        expect(word_end - word_start + 1, `${label}: word_end - word_start + 1 should equal word.length`).toBe(word.length);
      }
    }
  });

  it('all puzzle ids are unique', () => {
    const ids = data.puzzles.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('words contain only letters (no proper nouns starting with uppercase mid-word)', () => {
    for (const puzzle of data.puzzles) {
      for (const round of puzzle.rounds) {
        expect(round.word).toMatch(/^[a-z]+$/);
      }
    }
  });
});
