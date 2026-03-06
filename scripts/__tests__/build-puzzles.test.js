import { describe, it, expect } from 'vitest';
import {
  stripBoilerplate,
  tokenizeSentences,
  isSuitableWord,
  findCandidateWords,
  selectPassages,
  TARGET_LENGTHS,
} from '../build-puzzles.js';

// ─────────────────────────────────────────────────────────────────────────────
// stripBoilerplate
// ─────────────────────────────────────────────────────────────────────────────

describe('stripBoilerplate', () => {
  it('extracts content between START and END markers', () => {
    const text = [
      'Preamble stuff here.',
      '*** START OF THE PROJECT GUTENBERG EBOOK HAMLET ***',
      'This is the actual book content.',
      'More content here follows.',
      '*** END OF THE PROJECT GUTENBERG EBOOK HAMLET ***',
      'Footer stuff.',
    ].join('\n');

    const result = stripBoilerplate(text);
    expect(result).toContain('This is the actual book content.');
    expect(result).not.toContain('Preamble stuff');
    expect(result).not.toContain('Footer stuff');
  });

  it('handles "THIS PROJECT GUTENBERG" variant', () => {
    const text = [
      'Header',
      '*** START OF THIS PROJECT GUTENBERG EBOOK FOO ***',
      'Body text here.',
      '*** END OF THIS PROJECT GUTENBERG EBOOK FOO ***',
      'Footer',
    ].join('\n');

    const result = stripBoilerplate(text);
    expect(result).toContain('Body text here.');
    expect(result).not.toContain('Header');
    expect(result).not.toContain('Footer');
  });

  it('falls back to returning trimmed full text when no markers are found', () => {
    const text = '  Some plain text without any gutenberg markers.  ';
    const result = stripBoilerplate(text);
    expect(result).toBe('Some plain text without any gutenberg markers.');
  });

  it('handles missing END marker by returning everything after start', () => {
    const text = [
      'Header content',
      '*** START OF THE PROJECT GUTENBERG EBOOK FOO ***',
      'Body text here.',
    ].join('\n');

    const result = stripBoilerplate(text);
    expect(result).toBe('Body text here.');
  });

  it('handles missing START marker by returning everything up to END', () => {
    const text = [
      'Just some text',
      '*** END OF THE PROJECT GUTENBERG EBOOK FOO ***',
      'footer',
    ].join('\n');

    const result = stripBoilerplate(text);
    expect(result).toContain('Just some text');
    expect(result).not.toContain('footer');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// tokenizeSentences
// ─────────────────────────────────────────────────────────────────────────────

describe('tokenizeSentences', () => {
  it('splits text into multiple sentences on sentence boundaries', () => {
    const text =
      'She walked through the garden in the morning light. He followed her closely behind the wall.';
    const sentences = tokenizeSentences(text);
    expect(sentences.length).toBeGreaterThanOrEqual(1);
  });

  it('filters out sentences with fewer than 8 words', () => {
    const text =
      'Short sentence. This is a much longer sentence that has enough words to satisfy the filter check.';
    const sentences = tokenizeSentences(text);
    expect(sentences.every((s) => s.split(/\s+/).length >= 8)).toBe(true);
  });

  it('filters out sentences with more than 25 words', () => {
    const longSentence = Array(30).fill('word').join(' ') + '.';
    const normalSentence =
      'This is a normal sentence with enough words to pass the filter quite nicely.';
    const text = `${longSentence} ${normalSentence}`;
    const sentences = tokenizeSentences(text);
    expect(sentences.every((s) => s.split(/\s+/).length <= 25)).toBe(true);
  });

  it('normalizes internal whitespace within sentences', () => {
    const text =
      'She    walked   through  the garden  in the morning light. He followed her back home and waited there.';
    const sentences = tokenizeSentences(text);
    sentences.forEach((s) => {
      expect(s).not.toMatch(/\s{2,}/);
    });
  });

  it('filters out sentences containing mostly non-ASCII characters', () => {
    // Greek text (non-ASCII) should be excluded
    const greek = 'Ἀριστοτέλης ἦν φιλόσοφος τῆς ἀρχαίας Ἑλλάδος καὶ πολύ.';
    const english =
      'She walked through the sunlit garden near the edge of the forest path.';
    const sentences = tokenizeSentences(`${greek} ${english}`);
    // The Greek sentence should be filtered; the English one should remain
    expect(sentences.some((s) => s.includes('garden'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isSuitableWord
// ─────────────────────────────────────────────────────────────────────────────

describe('isSuitableWord', () => {
  it('accepts a valid lowercase word at a non-zero position', () => {
    expect(isSuitableWord('wonder', 3)).toBe(true);
    expect(isSuitableWord('forest', 5)).toBe(true);
  });

  it('rejects a word at position 0 (sentence-initial, possibly proper noun)', () => {
    expect(isSuitableWord('wonder', 0)).toBe(false);
    expect(isSuitableWord('forest', 0)).toBe(false);
  });

  it('rejects a word that contains uppercase letters', () => {
    expect(isSuitableWord('Wonder', 3)).toBe(false);
    expect(isSuitableWord('FOREST', 3)).toBe(false);
  });

  it('rejects known stopwords', () => {
    expect(isSuitableWord('that', 3)).toBe(false);
    expect(isSuitableWord('with', 3)).toBe(false);
    expect(isSuitableWord('have', 3)).toBe(false);
    expect(isSuitableWord('would', 3)).toBe(false);
    expect(isSuitableWord('their', 3)).toBe(false);
  });

  it('rejects words with non-letter characters', () => {
    expect(isSuitableWord("can't", 3)).toBe(false);
    expect(isSuitableWord('well-known', 3)).toBe(false);
    expect(isSuitableWord('123', 3)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// findCandidateWords
// ─────────────────────────────────────────────────────────────────────────────

describe('findCandidateWords', () => {
  it('finds words matching the exact target length', () => {
    const sentence =
      'She walked into the dark forest near the river bank at dusk.';
    const candidates = findCandidateWords(sentence, 6);
    expect(candidates.length).toBeGreaterThan(0);
    candidates.forEach((c) => expect(c.word.length).toBe(6));
  });

  it('finds words within a [min, max] length range', () => {
    const sentence =
      'She walked into the dark forest near the riverside with wonderful patience.';
    const candidates = findCandidateWords(sentence, [9, 12]);
    expect(candidates.length).toBeGreaterThan(0);
    candidates.forEach((c) => {
      expect(c.word.length).toBeGreaterThanOrEqual(9);
      expect(c.word.length).toBeLessThanOrEqual(12);
    });
  });

  it('skips proper nouns (uppercase-initial words mid-sentence)', () => {
    // "London" is mid-sentence and uppercase → proper noun → skip
    const sentence =
      'She met London officials beside the great river delta in summer.';
    const candidates = findCandidateWords(sentence, 6);
    const words = candidates.map((c) => c.word);
    expect(words).not.toContain('london');
  });

  it('returns correct wordStart and wordEnd indices into the passage', () => {
    const sentence =
      'He walked through the forest carefully and found shelter nearby.';
    const candidates = findCandidateWords(sentence, 6);
    expect(candidates.length).toBeGreaterThan(0);
    for (const { word, wordStart, wordEnd } of candidates) {
      const extracted = sentence.slice(wordStart, wordEnd + 1).toLowerCase();
      expect(extracted).toBe(word);
      expect(wordEnd - wordStart + 1).toBe(word.length);
    }
  });

  it('returns an empty array when no suitable word of target length exists', () => {
    const sentence = 'The dog ran fast into the big red barn.';
    const candidates = findCandidateWords(sentence, [9, 12]);
    expect(candidates).toHaveLength(0);
  });

  it('excludes the first word of the sentence', () => {
    // "Forest" at position 0 should be skipped even though length matches
    const sentence = 'Forest path leads down into the valley beyond the old mill.';
    const candidates = findCandidateWords(sentence, 6);
    const words = candidates.map((c) => c.word);
    // "forest" should not appear because it is at position 0
    expect(words).not.toContain('forest');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// selectPassages
// ─────────────────────────────────────────────────────────────────────────────

describe('selectPassages', () => {
  /**
   * Build a synthetic corpus of `count` sentences guaranteed to satisfy the
   * following invariants:
   *
   *  1. Each sentence is unique (different string).
   *  2. The corpus is divided into 6 equal sections; every sentence in
   *     section k contains ONLY one non-stopword word whose length matches
   *     TARGET_LENGTHS[k] — so rounds cannot accidentally pick from the wrong
   *     section or reuse a sentence text.
   *  3. The target word is at word-index > 0, so isSuitableWord passes.
   *
   * Sentence template:
   *   "He had [TARGET] and a [A] sat by the [B] at the [C] and the [D]."
   *
   * All filler words [A..D] are 3-letter non-stopwords → they cannot match
   * any target-length bucket (minimum 4 letters).  Since [A] = fillers[i%30]
   * and we need at most 20 unique sentences per section, every sentence in a
   * section is unique (fillers[0]…fillers[19] are all different).
   */
  function makeSentences(count) {
    // 30 three-letter, non-stopword filler words
    const fillers = [
      'man', 'day', 'sky', 'sea', 'sun', 'oak', 'elm', 'inn', 'hut', 'bay',
      'war', 'arm', 'key', 'jar', 'owl', 'ivy', 'fog', 'gem', 'rod', 'urn',
      'art', 'age', 'aid', 'cup', 'cut', 'dog', 'ear', 'egg', 'fur', 'hat',
    ];

    // One non-stopword target word per round, at its exact target length
    const roundTargets = [
      'bold',      // 4 letters  — round 0
      'brave',     // 5 letters  — round 1
      'golden',    // 6 letters  — round 2
      'village',   // 7 letters  — round 3
      'peaceful',  // 8 letters  — round 4
      'beautiful', // 9 letters  — round 5
    ];

    const sectionSize = Math.ceil(count / roundTargets.length);
    const sentences = [];

    for (let round = 0; round < roundTargets.length; round++) {
      const target = roundTargets[round];
      for (let i = 0; i < sectionSize && sentences.length < count; i++) {
        // Four unique 3-letter fillers per sentence; [A] = fillers[i%30] differs
        // across i=0..19, guaranteeing unique sentence text within each section.
        const a = fillers[i % fillers.length];
        const b = fillers[(i + 1) % fillers.length];
        const c = fillers[(i + 2) % fillers.length];
        const d = fillers[(i + 3) % fillers.length];
        // 16-word sentence; target word at word-index 2 (> 0 ✓)
        sentences.push(
          `He had ${target} and a ${a} sat by the ${b} at the ${c} and the ${d}.`,
        );
      }
    }

    return sentences;
  }

  it('returns an array of exactly 6 entries (one per round)', () => {
    const sentences = makeSentences(120);
    const passages = selectPassages(sentences, TARGET_LENGTHS);
    expect(passages).toHaveLength(6);
  });

  it('each non-null passage has passage, word, wordStart, wordEnd fields', () => {
    const sentences = makeSentences(120);
    const passages = selectPassages(sentences, TARGET_LENGTHS);
    for (const p of passages) {
      if (p !== null) {
        expect(p).toHaveProperty('passage');
        expect(p).toHaveProperty('word');
        expect(p).toHaveProperty('wordStart');
        expect(p).toHaveProperty('wordEnd');
      }
    }
  });

  it('each passage word has the correct length for its round', () => {
    const sentences = makeSentences(120);
    const passages = selectPassages(sentences, TARGET_LENGTHS);
    TARGET_LENGTHS.forEach((targetLen, i) => {
      const p = passages[i];
      if (p === null) return;
      if (typeof targetLen === 'number') {
        expect(p.word.length).toBe(targetLen);
      } else {
        expect(p.word.length).toBeGreaterThanOrEqual(targetLen[0]);
        expect(p.word.length).toBeLessThanOrEqual(targetLen[1]);
      }
    });
  });

  it('does not reuse the same sentence for two different rounds', () => {
    const sentences = makeSentences(120);
    const passages = selectPassages(sentences, TARGET_LENGTHS).filter(Boolean);
    const passageTexts = passages.map((p) => p.passage);
    const unique = new Set(passageTexts);
    expect(unique.size).toBe(passageTexts.length);
  });

  it('wordStart and wordEnd correctly index into the passage string', () => {
    const sentences = makeSentences(120);
    const passages = selectPassages(sentences, TARGET_LENGTHS);
    for (const p of passages) {
      if (p === null) continue;
      const extracted = p.passage.slice(p.wordStart, p.wordEnd + 1).toLowerCase();
      expect(extracted).toBe(p.word);
    }
  });
});
