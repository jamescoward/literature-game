#!/usr/bin/env node
/**
 * build-puzzles.js
 *
 * Downloads books from Project Gutenberg, extracts suitable passages for each
 * round, fetches word hints from a free dictionary API, and writes the result
 * to public/data/puzzles.json.
 *
 * Usage:
 *   node scripts/build-puzzles.js            # Process full corpus
 *   node scripts/build-puzzles.js --limit 5  # Process first 5 books (testing)
 *
 * Round word-length requirements (per plan.md):
 *   Round 1 → 4 letters (exact)
 *   Round 2 → 5 letters (exact)
 *   Round 3 → 6 letters (exact)
 *   Round 4 → 7 letters (exact)
 *   Round 5 → 8 letters (exact)
 *   Round 6 → 9–12 letters (range)
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'puzzles.json');

// ─────────────────────────────────────────────────────────────────────────────
// Constants (exported for testing)
// ─────────────────────────────────────────────────────────────────────────────

/** Target word lengths per round. Round 6 uses a [min, max] range. */
export const TARGET_LENGTHS = [4, 5, 6, 7, 8, [9, 12]];

/**
 * Common English words excluded as puzzle answers — too frequent or trivial.
 * Focused on function words and very common verbs/adjectives.
 */
export const STOPWORDS = new Set([
  // Determiners / pronouns
  'that', 'this', 'these', 'those', 'your', 'mine', 'ours', 'hers',
  // Prepositions / conjunctions
  'with', 'from', 'into', 'upon', 'over', 'also', 'than', 'then',
  'about', 'after', 'until', 'along', 'among', 'under', 'above',
  'below', 'beyond', 'beside',
  // Auxiliary / modal verbs
  'have', 'been', 'will', 'would', 'could', 'should', 'shall', 'might',
  'being', 'doing',
  // High-frequency pronouns / adverbs
  'they', 'them', 'their', 'there', 'where', 'when', 'what', 'which',
  'while', 'never', 'still', 'again', 'every', 'quite', 'rather',
  'always', 'before', 'though', 'through',
  // Very common verbs (surface forms)
  'know', 'come', 'went', 'said', 'make', 'going', 'looked', 'seemed',
  'asked', 'think', 'found',
  // Common adjectives/quantifiers
  'some', 'more', 'most', 'many', 'much', 'very', 'such', 'good',
  'just', 'only', 'other', 'great', 'little', 'small',
  // Reflexive pronouns
  'myself', 'itself', 'himself', 'herself', 'yourself',
  // Misc frequent words
  'nothing', 'another', 'however', 'without', 'because',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Pure helper functions (exported for unit testing)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip Project Gutenberg boilerplate from a plain-text download.
 * Returns only the body text between the START and END markers.
 *
 * @param {string} text - Raw Gutenberg plain text
 * @returns {string}
 */
export function stripBoilerplate(text) {
  const startRe =
    /\*{3}\s*START OF (?:THE |THIS )?PROJECT GUTENBERG[^\n]*\n/i;
  const endRe =
    /\*{3}\s*END OF (?:THE |THIS )?PROJECT GUTENBERG[^\n]*/i;

  const startMatch = text.match(startRe);
  const endMatch = text.match(endRe);

  const start = startMatch ? startMatch.index + startMatch[0].length : 0;
  const end = endMatch ? endMatch.index : text.length;

  return text.slice(start, end).trim();
}

/**
 * Check whether a word is suitable as a hidden puzzle answer.
 * Rejects proper nouns (uppercase), stopwords, non-alpha strings, and
 * sentence-initial words (wordIndex === 0) which may be capitalised proper nouns.
 *
 * @param {string} word       - The candidate word (should be lowercase)
 * @param {number} wordIndex  - Zero-based position in the sentence
 * @returns {boolean}
 */
export function isSuitableWord(word, wordIndex) {
  if (!/^[a-z]+$/.test(word)) return false;
  if (STOPWORDS.has(word)) return false;
  if (wordIndex === 0) return false;
  return true;
}

/**
 * Find candidate hidden words of the given target length within a sentence.
 * Skips proper nouns (uppercase initial, not at sentence start), stopwords,
 * and sentence-initial words.
 *
 * @param {string} sentence
 * @param {number|[number,number]} targetLength - Exact length or [min, max]
 * @returns {Array<{word: string, wordStart: number, wordEnd: number}>}
 */
export function findCandidateWords(sentence, targetLength) {
  const candidates = [];
  const regex = /\b([a-zA-Z]+)\b/g;
  let match;
  let wordIndex = 0;

  while ((match = regex.exec(sentence)) !== null) {
    const raw = match[1];
    const lower = raw.toLowerCase();

    const lengthOk =
      typeof targetLength === 'number'
        ? lower.length === targetLength
        : lower.length >= targetLength[0] && lower.length <= targetLength[1];

    if (lengthOk) {
      // Reject mid-sentence proper nouns (uppercase initial, not first word)
      const isProperNoun =
        raw[0] !== raw[0].toLowerCase() && wordIndex > 0;

      if (!isProperNoun && isSuitableWord(lower, wordIndex)) {
        candidates.push({
          word: lower,
          wordStart: match.index,
          wordEnd: match.index + raw.length - 1,
        });
      }
    }

    wordIndex++;
  }

  return candidates;
}

/**
 * Tokenize a book body into sentences, keeping only those that are
 * 8–25 words long and composed predominantly of ASCII/Latin characters.
 *
 * @param {string} text - Boilerplate-stripped book text
 * @returns {string[]}
 */
export function tokenizeSentences(text) {
  // Collapse line breaks to spaces so paragraphs become single strings
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]*\n[ \t]*/g, ' ')
    .replace(/\n{2,}/g, ' ');

  // Split on sentence-ending punctuation followed by whitespace + uppercase letter
  const raw = normalized.split(/(?<=[.!?])\s+(?=[A-Z"])/);

  return raw
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => {
      if (!s) return false;
      const words = s.split(/\s+/);
      if (words.length < 8 || words.length > 25) return false;
      // At least 90 % of characters must be basic ASCII printable
      const asciiCount = [...s].filter(
        (c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126,
      ).length;
      return asciiCount / s.length >= 0.9;
    });
}

/**
 * Select one passage per round from a sentence list, spread evenly across the
 * book so puzzles don't cluster at the beginning.  No sentence is reused.
 *
 * @param {string[]} sentences     - Tokenized, filtered sentence list
 * @param {Array}    targetLengths - TARGET_LENGTHS constant
 * @returns {Array<{passage: string, word: string, wordStart: number, wordEnd: number}|null>}
 */
export function selectPassages(sentences, targetLengths) {
  const total = sentences.length;
  const used = new Set();

  return targetLengths.map((targetLength, roundIndex) => {
    // Compute the slice of the book assigned to this round
    const sectionStart = Math.floor((roundIndex / targetLengths.length) * total);
    const sectionEnd = Math.floor(
      ((roundIndex + 1) / targetLengths.length) * total,
    );

    // Try within the designated section first
    for (let i = sectionStart; i < sectionEnd; i++) {
      if (used.has(i)) continue;
      const candidates = findCandidateWords(sentences[i], targetLength);
      if (candidates.length > 0) {
        used.add(i);
        return { passage: sentences[i], ...candidates[0] };
      }
    }

    // Fallback: scan the entire book for any sentence not yet used
    for (let i = 0; i < sentences.length; i++) {
      if (used.has(i)) continue;
      const candidates = findCandidateWords(sentences[i], targetLength);
      if (candidates.length > 0) {
        used.add(i);
        return { passage: sentences[i], ...candidates[0] };
      }
    }

    return null; // Could not find a passage for this round
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Network helpers (not exported — not unit-tested directly)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Download a book's plain text from Project Gutenberg.
 * @param {number} gutenbergId
 * @returns {Promise<string>}
 */
async function downloadBook(gutenbergId) {
  const url = `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching PG book ${gutenbergId}`);
  }
  return res.text();
}

/**
 * Fetch a short definition for a word from the free Dictionary API.
 * Falls back to a generic hint string if the API is unreachable or returns nothing.
 * @param {string} word
 * @returns {Promise<string>}
 */
async function fetchHint(word) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    );
    if (!res.ok) return `A ${word.length}-letter word`;
    const data = await res.json();
    const definition = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
    if (!definition) return `A ${word.length}-letter word`;
    return definition.length > 100
      ? definition.slice(0, 97) + '...'
      : definition;
  } catch {
    return `A ${word.length}-letter word`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Book corpus — public-domain works from Project Gutenberg
// ─────────────────────────────────────────────────────────────────────────────

const BOOK_CORPUS = [
  // 19th-Century Novels
  { id: 'pride-and-prejudice',       title: 'Pride and Prejudice',                          author: 'Jane Austen',               gutenberg_id: 1342  },
  { id: 'sense-and-sensibility',     title: 'Sense and Sensibility',                        author: 'Jane Austen',               gutenberg_id: 161   },
  { id: 'jane-eyre',                 title: 'Jane Eyre',                                    author: 'Charlotte Brontë',          gutenberg_id: 1260  },
  { id: 'wuthering-heights',         title: 'Wuthering Heights',                            author: 'Emily Brontë',              gutenberg_id: 768   },
  { id: 'frankenstein',              title: 'Frankenstein',                                 author: 'Mary Shelley',              gutenberg_id: 84    },
  { id: 'dracula',                   title: 'Dracula',                                      author: 'Bram Stoker',               gutenberg_id: 345   },
  { id: 'picture-of-dorian-gray',    title: 'The Picture of Dorian Gray',                   author: 'Oscar Wilde',               gutenberg_id: 174   },
  { id: 'great-expectations',        title: 'Great Expectations',                           author: 'Charles Dickens',           gutenberg_id: 1400  },
  { id: 'tale-of-two-cities',        title: 'A Tale of Two Cities',                         author: 'Charles Dickens',           gutenberg_id: 98    },
  { id: 'david-copperfield',         title: 'David Copperfield',                            author: 'Charles Dickens',           gutenberg_id: 766   },
  { id: 'bleak-house',               title: 'Bleak House',                                  author: 'Charles Dickens',           gutenberg_id: 1023  },
  { id: 'huckleberry-finn',          title: 'Adventures of Huckleberry Finn',               author: 'Mark Twain',                gutenberg_id: 76    },
  { id: 'tom-sawyer',                title: 'The Adventures of Tom Sawyer',                 author: 'Mark Twain',                gutenberg_id: 74    },
  { id: 'moby-dick',                 title: 'Moby Dick',                                    author: 'Herman Melville',           gutenberg_id: 2701  },
  { id: 'scarlet-letter',            title: 'The Scarlet Letter',                           author: 'Nathaniel Hawthorne',       gutenberg_id: 25344 },
  { id: 'little-women',              title: 'Little Women',                                 author: 'Louisa May Alcott',         gutenberg_id: 514   },
  { id: 'middlemarch',               title: 'Middlemarch',                                  author: 'George Eliot',              gutenberg_id: 145   },
  { id: 'mill-on-the-floss',         title: 'The Mill on the Floss',                        author: 'George Eliot',              gutenberg_id: 6688  },
  { id: 'tess-of-the-durbervilles',  title: "Tess of the d'Urbervilles",                    author: 'Thomas Hardy',              gutenberg_id: 110   },
  { id: 'far-from-madding-crowd',    title: 'Far from the Madding Crowd',                   author: 'Thomas Hardy',              gutenberg_id: 107   },
  { id: 'turn-of-the-screw',         title: 'The Turn of the Screw',                        author: 'Henry James',               gutenberg_id: 209   },
  { id: 'portrait-of-a-lady',        title: 'The Portrait of a Lady',                       author: 'Henry James',               gutenberg_id: 2833  },
  { id: 'red-badge-of-courage',      title: 'The Red Badge of Courage',                     author: 'Stephen Crane',             gutenberg_id: 73    },
  // Adventure / Genre
  { id: 'treasure-island',           title: 'Treasure Island',                              author: 'Robert Louis Stevenson',    gutenberg_id: 120   },
  { id: 'jekyll-and-hyde',           title: 'The Strange Case of Dr Jekyll and Mr Hyde',    author: 'Robert Louis Stevenson',    gutenberg_id: 43    },
  { id: 'time-machine',              title: 'The Time Machine',                             author: 'H. G. Wells',               gutenberg_id: 35    },
  { id: 'war-of-the-worlds',         title: 'The War of the Worlds',                        author: 'H. G. Wells',               gutenberg_id: 36    },
  { id: 'invisible-man',             title: 'The Invisible Man',                            author: 'H. G. Wells',               gutenberg_id: 5230  },
  { id: 'hound-of-baskervilles',     title: 'The Hound of the Baskervilles',                author: 'Arthur Conan Doyle',        gutenberg_id: 2852  },
  { id: 'study-in-scarlet',          title: 'A Study in Scarlet',                           author: 'Arthur Conan Doyle',        gutenberg_id: 244   },
  { id: 'around-the-world-80-days',  title: 'Around the World in 80 Days',                  author: 'Jules Verne',               gutenberg_id: 103   },
  { id: 'twenty-thousand-leagues',   title: 'Twenty Thousand Leagues Under the Sea',        author: 'Jules Verne',               gutenberg_id: 164   },
  { id: 'count-of-monte-cristo',     title: 'The Count of Monte Cristo',                    author: 'Alexandre Dumas',           gutenberg_id: 1184  },
  { id: 'three-musketeers',          title: 'The Three Musketeers',                         author: 'Alexandre Dumas',           gutenberg_id: 1257  },
  // Early 20th Century
  { id: 'call-of-the-wild',          title: 'The Call of the Wild',                         author: 'Jack London',               gutenberg_id: 215   },
  { id: 'white-fang',                title: 'White Fang',                                   author: 'Jack London',               gutenberg_id: 910   },
  { id: 'age-of-innocence',          title: 'The Age of Innocence',                         author: 'Edith Wharton',             gutenberg_id: 541   },
  { id: 'ethan-frome',               title: 'Ethan Frome',                                  author: 'Edith Wharton',             gutenberg_id: 4517  },
  { id: 'o-pioneers',                title: 'O Pioneers!',                                  author: 'Willa Cather',              gutenberg_id: 24    },
  { id: 'my-antonia',                title: 'My Ántonia',                                   author: 'Willa Cather',              gutenberg_id: 242   },
  { id: 'jungle',                    title: 'The Jungle',                                   author: 'Upton Sinclair',            gutenberg_id: 140   },
  { id: 'sister-carrie',             title: 'Sister Carrie',                                author: 'Theodore Dreiser',          gutenberg_id: 44423 },
  // Shakespeare
  { id: 'hamlet',                    title: 'Hamlet',                                       author: 'William Shakespeare',       gutenberg_id: 1524  },
  { id: 'othello',                   title: 'Othello',                                      author: 'William Shakespeare',       gutenberg_id: 1531  },
  { id: 'macbeth',                   title: 'Macbeth',                                      author: 'William Shakespeare',       gutenberg_id: 1533  },
  { id: 'king-lear',                 title: 'King Lear',                                    author: 'William Shakespeare',       gutenberg_id: 1532  },
  { id: 'midsummer-nights-dream',    title: "A Midsummer Night's Dream",                    author: 'William Shakespeare',       gutenberg_id: 1514  },
  // Philosophy / Non-fiction
  { id: 'meditations',               title: 'Meditations',                                  author: 'Marcus Aurelius',           gutenberg_id: 2680  },
  { id: 'the-prince',                title: 'The Prince',                                   author: 'Niccolò Machiavelli',       gutenberg_id: 1232  },
  { id: 'common-sense',              title: 'Common Sense',                                 author: 'Thomas Paine',              gutenberg_id: 3176  },
  { id: 'walden',                    title: 'Walden',                                       author: 'Henry David Thoreau',       gutenberg_id: 205   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Build a single puzzle entry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Download, parse, and build a puzzle for one book.
 * Returns null if the book cannot be processed (download failure, too few
 * sentences, or unable to fill all 6 rounds).
 *
 * @param {{ id, title, author, gutenberg_id }} book
 * @returns {Promise<object|null>}
 */
async function buildPuzzle(book) {
  console.log(`  Downloading "${book.title}" (PG ${book.gutenberg_id})...`);

  let rawText;
  try {
    rawText = await downloadBook(book.gutenberg_id);
  } catch (err) {
    console.warn(`  ✗ Download failed: ${err.message}`);
    return null;
  }

  const body = stripBoilerplate(rawText);
  const sentences = tokenizeSentences(body);
  console.log(`  ${sentences.length} candidate sentences.`);

  if (sentences.length < 30) {
    console.warn(`  ✗ Too few sentences (${sentences.length}) — skipping.`);
    return null;
  }

  const passages = selectPassages(sentences, TARGET_LENGTHS);
  const nullCount = passages.filter((p) => p === null).length;
  if (nullCount > 0) {
    console.warn(`  ✗ Could not fill ${nullCount} round(s) — skipping.`);
    return null;
  }

  console.log(`  Fetching hints for: ${passages.map((p) => p.word).join(', ')}...`);
  const rounds = await Promise.all(
    passages.map(async (p) => ({
      passage: p.passage,
      word: p.word,
      word_start: p.wordStart,
      word_end: p.wordEnd,
      hint: await fetchHint(p.word),
    })),
  );

  console.log(`  ✓ Done: ${rounds.map((r) => r.word).join(', ')}`);

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    gutenberg_id: book.gutenberg_id,
    rounds,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const limit =
    limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

  const corpus = isFinite(limit) ? BOOK_CORPUS.slice(0, limit) : BOOK_CORPUS;
  console.log(`\nBuilding puzzle data for ${corpus.length} book(s)...\n`);

  const puzzles = [];
  for (const book of corpus) {
    const puzzle = await buildPuzzle(book);
    if (puzzle) puzzles.push(puzzle);
    console.log();
  }

  if (puzzles.length === 0) {
    console.error('ERROR: No puzzles were built. Exiting.');
    process.exit(1);
  }

  mkdirSync(join(__dirname, '..', 'public', 'data'), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify({ puzzles }, null, 2), 'utf-8');
  console.log(`✓ Wrote ${puzzles.length} puzzle(s) to ${OUT_PATH}`);
}

// Only run when executed directly (not when imported by tests)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
