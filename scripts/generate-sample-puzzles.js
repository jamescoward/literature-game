#!/usr/bin/env node
/**
 * generate-sample-puzzles.js
 *
 * Writes public/data/puzzles.json from hardcoded public-domain passages.
 * Runs without internet access — used as a fallback in CI and the
 * Claude Code session-start hook.
 *
 * Round word-length requirements (per plan.md):
 *   Round 1 → 4 letters
 *   Round 2 → 5 letters
 *   Round 3 → 6 letters
 *   Round 4 → 7 letters
 *   Round 5 → 8 letters
 *   Round 6 → 9–12 letters
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'data', 'puzzles.json');

/**
 * Build a single round, computing word_start / word_end automatically.
 * Throws if the word cannot be found in the passage.
 */
function mkRound(passage, word, hint) {
  const lower = passage.toLowerCase();
  const wordLower = word.toLowerCase();
  const idx = lower.indexOf(wordLower);
  if (idx === -1) {
    throw new Error(`"${word}" not found in: "${passage}"`);
  }
  return {
    passage,
    word: wordLower,
    word_start: idx,
    word_end: idx + wordLower.length - 1,
    hint,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Corpus — 7 public-domain books, 6 rounds each
// ─────────────────────────────────────────────────────────────────────────────

const CORPUS = [
  {
    id: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    gutenberg_id: 1342,
    rounds: [
      // R1 — 4 letters: "fine"
      mkRound(
        'It must be so fine for you and your dear little ones to be going home for the holidays.',
        'fine',
        'Of high quality; giving satisfaction',
      ),
      // R2 — 5 letters: "tempt"
      mkRound(
        'She is tolerable, but not handsome enough to tempt me.',
        'tempt',
        'To entice someone toward something they might resist',
      ),
      // R3 — 6 letters: "admire"
      mkRound(
        'You must allow me to tell you how ardently I admire and love you.',
        'admire',
        'To regard with respect and warm approval',
      ),
      // R4 — 7 letters: "selfish"
      mkRound(
        'I have been a selfish being all my life, in practice, though not in principle.',
        'selfish',
        'Chiefly concerned with one\'s own profit or pleasure',
      ),
      // R5 — 8 letters: "entirely"
      mkRound(
        'Happiness in marriage is entirely a matter of chance.',
        'entirely',
        'Wholly; to the full or absolute extent',
      ),
      // R6 — 11 letters: "disposition"
      mkRound(
        'She had a lively, playful disposition which delighted in anything ridiculous.',
        'disposition',
        'A person\'s inherent qualities of mind and character',
      ),
    ],
  },

  {
    id: 'frankenstein',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    gutenberg_id: 84,
    rounds: [
      // R1 — 4 letters: "mind"
      mkRound(
        'Nothing is so painful to the human mind as a great and sudden change.',
        'mind',
        'The element of a person that enables thought and feeling',
      ),
      // R2 — 5 letters: "quite"
      mkRound(
        'Beware; for I am fearless, and therefore quite powerful.',
        'quite',
        'To a certain or fairly significant extent',
      ),
      // R3 — 6 letters: "origin"
      mkRound(
        'I felt the greatest eagerness to learn the origin of this creature.',
        'origin',
        'The point or place where something begins or is derived from',
      ),
      // R4 — 7 letters: "intense"
      mkRound(
        'My imagination was vivid, yet my powers of analysis were intense.',
        'intense',
        'Of extreme force, degree, or strength',
      ),
      // R5 — 8 letters: "scarcely"
      mkRound(
        'I have love in me the likes of which you can scarcely imagine.',
        'scarcely',
        'Only just; almost not at all',
      ),
      // R6 — 11 letters: "imagination"
      mkRound(
        'My imagination was too much exalted by my first success to permit me to doubt of my ability.',
        'imagination',
        'The faculty of forming new ideas not present to the senses',
      ),
    ],
  },

  {
    id: 'treasure-island',
    title: 'Treasure Island',
    author: 'Robert Louis Stevenson',
    gutenberg_id: 120,
    rounds: [
      // R1 — 4 letters: "bold"
      mkRound(
        'A bold young lad stood in the doorway, knife in hand.',
        'bold',
        'Showing willingness to take risks; confident and courageous',
      ),
      // R2 — 5 letters: "eight"
      mkRound(
        'Pieces of eight! Pieces of eight! cried the parrot.',
        'eight',
        'The cardinal number between seven and nine',
      ),
      // R3 — 6 letters: "forest"
      mkRound(
        'The pirates came out of the forest on the left with a sudden charge.',
        'forest',
        'A large area covered chiefly with trees and undergrowth',
      ),
      // R4 — 7 letters: "slipped"
      mkRound(
        'Silver himself was nowhere to be seen; he had slipped away somewhere in the night.',
        'slipped',
        'Moved quietly and quickly so as not to be noticed',
      ),
      // R5 — 8 letters: "treasure"
      mkRound(
        'They found the treasure at last, buried deep beneath the old pine tree.',
        'treasure',
        'A quantity of precious metals, gems, or other valuable objects',
      ),
      // R6 — 9 letters: "scattered"
      mkRound(
        'Doubloons and pieces of eight were scattered everywhere on the floor.',
        'scattered',
        'Spread or distributed over a wide area',
      ),
    ],
  },

  {
    id: 'the-time-machine',
    title: 'The Time Machine',
    author: 'H. G. Wells',
    gutenberg_id: 35,
    rounds: [
      // R1 — 4 letters: "hard"
      mkRound(
        'The Time Traveller came back and looked hard at me over the table.',
        'hard',
        'Done with great effort or force; not easily done',
      ),
      // R2 — 5 letters: "whole"
      mkRound(
        'The whole world will be intelligent, educated, and cooperating.',
        'whole',
        'Complete in every part; not lacking or leaving out any part',
      ),
      // R3 — 6 letters: "nature"
      mkRound(
        'I have thought more than is good for me about the nature of time.',
        'nature',
        'The basic or inherent features of something',
      ),
      // R4 — 7 letters: "machine"
      mkRound(
        'The machine was steady, and the whole ride was wonderfully smooth.',
        'machine',
        'An apparatus using mechanical power to perform a task',
      ),
      // R5 — 8 letters: "darkness"
      mkRound(
        'The darkness grew apace with a cold sensation against my face.',
        'darkness',
        'The partial or total absence of light',
      ),
      // R6 — 10 letters: "travelling"
      mkRound(
        'I am afraid I cannot convey the peculiar sensations of time travelling.',
        'travelling',
        'Making a journey; moving from one place to another over time',
      ),
    ],
  },

  {
    id: 'great-expectations',
    title: 'Great Expectations',
    author: 'Charles Dickens',
    gutenberg_id: 1400,
    rounds: [
      // R1 — 4 letters: "take"
      mkRound(
        'Take nothing on its looks; take everything on evidence.',
        'take',
        'To lay hold of something; to get into one\'s possession',
      ),
      // R2 — 5 letters: "peace"
      mkRound(
        'I loved her against reason, against promise, against peace, against hope.',
        'peace',
        'Freedom from disturbance; tranquility of mind or surroundings',
      ),
      // R3 — 6 letters: "taught"
      mkRound(
        'Suffering has been stronger than all other teaching, and has taught me to understand.',
        'taught',
        'Past tense of teach; having imparted knowledge to someone',
      ),
      // R4 — 7 letters: "express"
      mkRound(
        'No varnish can hide the grain of the wood; the more varnish you put on, the more the grain will express itself.',
        'express',
        'To convey a thought or feeling in words or by gestures',
      ),
      // R5 — 8 letters: "promised"
      mkRound(
        'I resolved to tell Joe all that I had witnessed; something that I had promised.',
        'promised',
        'Made a declaration assuring one will or will not do something',
      ),
      // R6 — 9 letters: "existence"
      mkRound(
        'In the little world in which children have their existence, nothing is so finely felt as injustice.',
        'existence',
        'The fact or state of living or having objective reality',
      ),
    ],
  },

  {
    id: 'dracula',
    title: 'Dracula',
    author: 'Bram Stoker',
    gutenberg_id: 345,
    rounds: [
      // R1 — 4 letters: "want"
      mkRound(
        'I want you to believe in things that you cannot see.',
        'want',
        'To have a desire or wish for something',
      ),
      // R2 — 5 letters: "night"
      mkRound(
        'Listen to the children of the night. What music they make!',
        'night',
        'The period of darkness between sunset and sunrise',
      ),
      // R3 — 6 letters: "castle"
      mkRound(
        'The castle is a veritable prison and I am a prisoner.',
        'castle',
        'A large medieval building, typically fortified',
      ),
      // R4 — 7 letters: "failure"
      mkRound(
        'We learn from failure, not from success. That is the whole secret.',
        'failure',
        'Lack of success; the omission of expected or required action',
      ),
      // R5 — 8 letters: "suffered"
      mkRound(
        'My brain was dizzy; I cannot tell how long it lasted, but I suffered greatly.',
        'suffered',
        'Experienced pain, distress, or hardship',
      ),
      // R6 — 11 letters: "expectation"
      mkRound(
        'I have a sort of expectation that something will happen.',
        'expectation',
        'A strong belief that something will happen or be the case',
      ),
    ],
  },

  {
    id: 'moby-dick',
    title: 'Moby Dick',
    author: 'Herman Melville',
    gutenberg_id: 2701,
    rounds: [
      // R1 — 4 letters: "call"
      mkRound(
        'Call me Ishmael. Some years ago, I had little money in my purse.',
        'call',
        'To address someone by a name; to summon or invite',
      ),
      // R2 — 5 letters: "whale"
      mkRound(
        'A whale ship was my Yale College and my Harvard.',
        'whale',
        'A very large marine mammal with a torpedo-shaped body',
      ),
      // R3 — 6 letters: "better" (appears as "Better" at start of passage)
      mkRound(
        'Better to sleep with a sober cannibal than a drunken Christian.',
        'better',
        'Of a more excellent or effective type or quality',
      ),
      // R4 — 7 letters: "produce"
      mkRound(
        'To produce a mighty book, you must choose a mighty theme.',
        'produce',
        'To bring something into existence; to make or manufacture',
      ),
      // R5 — 8 letters: "laughing"
      mkRound(
        'I know not all that may be coming, but I will go to it laughing.',
        'laughing',
        'Making the sounds and movements that express amusement',
      ),
      // R6 — 9 letters: "tormented"
      mkRound(
        'I am tormented with an everlasting itch for things remote.',
        'tormented',
        'Experiencing or causing severe physical or mental suffering',
      ),
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Validate before writing
// ─────────────────────────────────────────────────────────────────────────────

const EXPECTED_LENGTHS = [4, 5, 6, 7, 8]; // rounds 0-4; round 5 is 9-12

function validate(corpus) {
  const errors = [];
  const ids = new Set();

  for (const puzzle of corpus) {
    if (ids.has(puzzle.id)) errors.push(`Duplicate id: "${puzzle.id}"`);
    ids.add(puzzle.id);

    if (puzzle.rounds.length !== 6) {
      errors.push(`"${puzzle.id}" has ${puzzle.rounds.length} rounds, expected 6`);
    }

    puzzle.rounds.forEach((r, i) => {
      const label = `"${puzzle.id}" round ${i + 1}`;

      // Index correctness
      const slice = r.passage.slice(r.word_start, r.word_end + 1);
      if (slice.toLowerCase() !== r.word) {
        errors.push(`${label}: passage slice "${slice}" !== word "${r.word}"`);
      }

      // Word length
      if (i < 5) {
        if (r.word.length !== EXPECTED_LENGTHS[i]) {
          errors.push(
            `${label}: "${r.word}" is ${r.word.length} letters, expected ${EXPECTED_LENGTHS[i]}`,
          );
        }
      } else {
        if (r.word.length < 9 || r.word.length > 12) {
          errors.push(`${label}: "${r.word}" is ${r.word.length} letters, expected 9-12`);
        }
      }

      // Lowercase letters only
      if (!/^[a-z]+$/.test(r.word)) {
        errors.push(`${label}: word "${r.word}" must be lowercase letters only`);
      }
    });
  }

  return errors;
}

const errors = validate(CORPUS);
if (errors.length > 0) {
  console.error('Corpus validation failed:');
  errors.forEach((e) => console.error('  •', e));
  process.exit(1);
}

mkdirSync(join(__dirname, '..', 'public', 'data'), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify({ puzzles: CORPUS }, null, 2), 'utf-8');
console.log(`✓ Wrote ${CORPUS.length} puzzles to ${OUT_PATH}`);
