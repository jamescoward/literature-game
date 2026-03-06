# Literature Word Game — Build Plan

## Overview

A daily browser-based word-guessing game set in classic literature. Each day
features a new public-domain book. The player is shown 6 passages from that
book and must guess the hidden word in each one. Words grow longer across the
6 rounds. No server is required — everything runs from static files.

---

## Visual Reference

From the screenshot the UI shows:
- Book title at top in bold serif caps with an underline
- Progress dots (5 rounds shown; active dot is red with attempt count inside)
- A passage of text with the mystery word replaced by a styled blank pattern,
  e.g. **b** `__` **t** `__` **r** (revealed letters are bold, blanks are
  underscored boxes)
- A HINT button below the passage
- A full QWERTY on-screen keyboard at the bottom; used letters are visually
  marked

---

## Game Mechanics

### Daily Puzzle
- The puzzle is determined by the current UTC date (YYYY-MM-DD string hashed
  to an index into the puzzle list)
- One book per day; same puzzle for every player on that day (no auth needed)
- Results can be shared as an emoji grid (like Wordle)

### 6 Rounds
| Round | Word length range |
|-------|-------------------|
| 1     | 4 letters         |
| 2     | 5 letters         |
| 3     | 6 letters         |
| 4     | 7 letters         |
| 5     | 8 letters         |
| 6     | 9–12 letters      |

Each round shows a sentence/passage from the book with one word hidden.

### Hidden Word Display
- First letter always shown (bold)
- Last letter always shown (bold)
- For words ≥ 7 letters a middle anchor letter is also shown (bold)
- All other positions are underscored blank boxes
- After each wrong guess, one additional blank is revealed left-to-right

### Attempts / Lives
- Each round allows up to **6 wrong guesses** before auto-failing
- The red dot on the progress indicator shows the current attempt count
- On fail the correct word is revealed before moving to the next round

### HINT
- One hint per round; costs one "life" (counts as a wrong guess)
- Reveals the definition or a short contextual clue for the hidden word

### Scoring
- 6 points per round maximum, minus 1 per wrong guess
- Total score out of 36 displayed at end

### End State
- After round 6 (or all rounds failed), show a summary screen with:
  - Book title + author
  - Score
  - Each word revealed
  - Shareable emoji grid
  - Link to read the full book on Project Gutenberg

---

## Data Pipeline (pre-build, run once)

All puzzle content is pre-computed and shipped as static JSON. No runtime
book-fetching is needed.

### Source: Project Gutenberg
Use books whose plain-text files are freely available at
`https://www.gutenberg.org/cache/epub/<ID>/pg<ID>.txt`

### Suggested Starting Corpus (≥ 100 books)

Group by era/genre for variety:

**Chaucer / Medieval**
- Troilus and Criseyde (PG 257)
- The Canterbury Tales (PG 2383)

**Shakespeare (PG has plain-text editions)**
- Hamlet (PG 1524)
- Othello (PG 1531)
- A Midsummer Night's Dream (PG 1514)
- Macbeth (PG 1533)
- King Lear (PG 1532)

**19th-Century Novels**
- Pride and Prejudice — Austen (PG 1342)
- Sense and Sensibility — Austen (PG 161)
- Jane Eyre — Brontë (PG 1260)
- Wuthering Heights — Brontë (PG 768)
- Middlemarch — Eliot (PG 145)
- The Mill on the Floss — Eliot (PG 6688)
- Frankenstein — Shelley (PG 84)
- Dracula — Stoker (PG 345)
- The Picture of Dorian Gray — Wilde (PG 174)
- Tess of the d'Urbervilles — Hardy (PG 110)
- Far from the Madding Crowd — Hardy (PG 107)
- Great Expectations — Dickens (PG 1400)
- A Tale of Two Cities — Dickens (PG 98)
- David Copperfield — Dickens (PG 766)
- Bleak House — Dickens (PG 1023)
- The Adventures of Tom Sawyer — Twain (PG 74)
- Adventures of Huckleberry Finn — Twain (PG 76)
- Moby Dick — Melville (PG 2701)
- The Scarlet Letter — Hawthorne (PG 25344)
- Walden — Thoreau (PG 205)
- Little Women — Alcott (PG 514)
- The Red Badge of Courage — Crane (PG 73)
- The Turn of the Screw — James (PG 209)
- The Portrait of a Lady — James (PG 2833)

**Early 20th Century**
- The Jungle — Sinclair (PG 140)
- The Call of the Wild — London (PG 215)
- White Fang — London (PG 910)
- Ethan Frome — Wharton (PG 4517)
- The Age of Innocence — Wharton (PG 541)
- Main Street — Lewis (PG 543)
- Sister Carrie — Dreiser (PG 44423)
- O Pioneers! — Cather (PG 24)
- My Ántonia — Cather (PG 242)

**Adventure / Genre**
- Treasure Island — Stevenson (PG 120)
- The Strange Case of Dr Jekyll and Mr Hyde — Stevenson (PG 43)
- The Time Machine — Wells (PG 35)
- The War of the Worlds — Wells (PG 36)
- The Invisible Man — Wells (PG 5230)
- Around the World in 80 Days — Verne (PG 103)
- Twenty Thousand Leagues — Verne (PG 164)
- The Hound of the Baskervilles — Doyle (PG 2852)
- A Study in Scarlet — Doyle (PG 244)
- The Count of Monte Cristo — Dumas (PG 1184)
- The Three Musketeers — Dumas (PG 1257)
- Don Quixote — Cervantes (PG 996)

**Philosophy / Non-fiction**
- Meditations — Marcus Aurelius (PG 2680)
- The Republic — Plato (PG 1497)
- Leviathan — Hobbes (PG 3207)
- The Prince — Machiavelli (PG 1232)
- Common Sense — Paine (PG 3176)

Add more until corpus covers ~150 books = ~4 months of daily puzzles.

### Passage Selection Script (`scripts/build-puzzles.js`)

Run with Node.js (one-time or nightly CI):

1. Download each book's plain-text file from Gutenberg
2. Strip Gutenberg header/footer boilerplate
3. Tokenise into sentences; filter sentences that are:
   - 8–25 words long
   - In English (basic ASCII/Latin check)
   - Contain at least one word of the required length at each round
4. For each book, greedily select 6 sentences, one per target length bucket,
   that are spread across the text (not all from the same chapter)
5. Verify no proper nouns or ambiguous abbreviations are selected as the
   target word
6. Output one entry per book to `public/data/puzzles.json`

Schema:

```json
{
  "puzzles": [
    {
      "id": "troilus-and-criseyde",
      "title": "Troilus and Criseyde",
      "author": "Geoffrey Chaucer",
      "gutenberg_id": 257,
      "rounds": [
        {
          "passage": "And for to have of hem compassioun as though I were hir owene brother dere.",
          "word": "brother",
          "word_start": 60,
          "word_end": 66,
          "hint": "A male sibling"
        }
      ]
    }
  ]
}
```

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Vanilla JS + HTML + CSS (no framework needed) |
| Build tool | Vite (fast dev server, static output) |
| Styling | CSS custom properties, mobile-first |
| Storage | `localStorage` for daily state persistence |
| Fonts | Google Fonts — a serif for display, sans for UI |
| Bundler output | `dist/` — 100% static, deployable to any CDN |

No React, no backend, no auth, no database.

---

## File Structure

```
literature-game/
├── public/
│   └── data/
│       └── puzzles.json          # Pre-built puzzle data
├── scripts/
│   └── build-puzzles.js          # One-time data pipeline (Node)
├── src/
│   ├── index.html
│   ├── main.js                   # App entry point
│   ├── style.css                 # Global styles (mobile-first)
│   ├── game/
│   │   ├── state.js              # Game state machine
│   │   ├── puzzle.js             # Daily puzzle selection logic
│   │   ├── scoring.js            # Score calculation
│   │   └── share.js              # Emoji grid generation
│   └── ui/
│       ├── screen-game.js        # Main game screen
│       ├── screen-summary.js     # End-of-game summary
│       ├── component-passage.js  # Passage + blank rendering
│       ├── component-keyboard.js # On-screen keyboard
│       ├── component-progress.js # Progress dots
│       └── component-toast.js    # Feedback toasts
├── .claude/
│   └── hooks/
│       └── session-start.sh      # Claude Code dev-env hook
├── package.json
├── vite.config.js
└── plan.md
```

---

## UI / UX Specification

### Typography & Colour
- Background: `#b0b0b0` (warm mid-grey, as in screenshot)
- Title: bold serif, all-caps, black, underlined
- Passage text: large (≥ 28px on mobile), serif, dark grey
- Hidden word: inline — revealed letters in **bold**, blanks as `__` underlined
  boxes with light background
- Keyboard keys: rounded rectangles, white fill, shadow; used/wrong keys greyed
- Correct letter keys: green tint
- HINT button: pill shape, white, uppercase label

### Progress Indicator
- 6 dots in a row, connected by a thin line
- Current round dot: red, contains attempt count (1–6) in white text
- Completed round dot: dark (success) or outlined (failed)
- Future round dot: light grey

### Keyboard Behaviour
- Tapping a key submits that letter as the next character of the guess
- Player types the full word letter-by-letter then submits (Enter/tick button)
- Backspace key removes last typed letter
- Keys used in wrong guesses are visually disabled but still tappable

### Animations
- Letter tiles flip on submission (CSS transform)
- Wrong guess: passage area shakes briefly
- Round complete (correct): brief green flash + advance to next round
- Round failed: word revealed with red highlight, then advance

### Accessibility
- All keyboard keys are `<button>` elements with `aria-label`
- Colour is never the sole indicator of state (also use icons/text)
- Respects `prefers-reduced-motion`

---

## State Management

Stored in `localStorage` key `literature-game-YYYY-MM-DD`:

```json
{
  "date": "2026-03-06",
  "puzzleId": "troilus-and-criseyde",
  "currentRound": 1,
  "rounds": [
    {
      "guesses": ["BATTER", "BETTER"],
      "solved": false,
      "hintUsed": false
    }
  ],
  "score": 0,
  "complete": false
}
```

On load, if stored date matches today, restore state. Otherwise reset.

---

## Daily Puzzle Selection

```js
// puzzle.js
function getDailyPuzzle(puzzles) {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const seed = [...today].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return puzzles[seed % puzzles.length];
}
```

Simple, deterministic, no server needed.

---

## Claude Code Hooks

### `.claude/hooks/session-start.sh`

This hook runs automatically when Claude Code starts a session in this repo.
It ensures the dev environment is ready before any coding begins.

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Literature Game: Setting up dev environment ==="

# 1. Check Node version (requires >=18)
NODE_VERSION=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>/dev/null && echo "ok" || echo "fail")
if [ "$NODE_VERSION" = "fail" ]; then
  echo "ERROR: Node.js 18+ is required. Current: $(node --version 2>/dev/null || echo 'not found')"
  exit 1
fi
echo "Node.js: $(node --version) ✓"

# 2. Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
else
  echo "node_modules present ✓"
fi

# 3. Build puzzle data if missing
if [ ! -f "public/data/puzzles.json" ]; then
  echo "Puzzle data not found. Running build-puzzles script..."
  node scripts/build-puzzles.js || {
    echo "WARNING: Could not build puzzles (may need internet). Using sample data."
    mkdir -p public/data
    node scripts/generate-sample-puzzles.js
  }
else
  echo "Puzzle data present ✓"
fi

# 4. Verify Vite can build
echo "Running Vite type-check build..."
npm run build -- --mode development 2>&1 | tail -5

echo "=== Dev environment ready. Run: npm run dev ==="
```

Register this in `.claude/settings.json`:

```json
{
  "hooks": {
    "sessionStart": [
      {
        "type": "command",
        "command": "bash .claude/hooks/session-start.sh"
      }
    ]
  }
}
```

---

## package.json (key parts)

```json
{
  "name": "literature-game",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "build:puzzles": "node scripts/build-puzzles.js",
    "build:sample": "node scripts/generate-sample-puzzles.js"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

---

## vite.config.js

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
```

---

## Build Steps for the Agent

### Phase 1 — Project Scaffold
1. Initialise `package.json` and install Vite
2. Create the file structure above (empty files)
3. Set up `vite.config.js`
4. Create `.claude/hooks/session-start.sh` and `.claude/settings.json`

### Phase 2 — Sample Puzzle Data
1. Write `scripts/generate-sample-puzzles.js` — produces a hardcoded
   `public/data/puzzles.json` with 5–10 sample books and 6 rounds each so
   the game can run immediately without internet
2. Run the script to generate the file

### Phase 3 — Core Game Logic
1. `src/game/puzzle.js` — date-based puzzle selection
2. `src/game/state.js` — state machine: init, guess, hint, advance, complete
3. `src/game/scoring.js` — score per round
4. `src/game/share.js` — build shareable emoji string

### Phase 4 — UI Components
1. `src/index.html` — shell with viewport meta, font links, root div
2. `src/style.css` — CSS custom properties, reset, mobile-first layout,
   keyboard grid, passage styles, animation keyframes
3. `src/ui/component-progress.js` — 6-dot progress bar
4. `src/ui/component-passage.js` — renders passage with blanked word inline
5. `src/ui/component-keyboard.js` — QWERTY grid, letter state tracking
6. `src/ui/component-toast.js` — transient feedback messages
7. `src/ui/screen-game.js` — composes components, wires events
8. `src/ui/screen-summary.js` — end screen with score + share button
9. `src/main.js` — entry point, loads puzzle, boots game or summary screen

### Phase 5 — Full Puzzle Data Pipeline (optional / async)
1. Write `scripts/build-puzzles.js` — downloads from Gutenberg, selects
   passages, validates words, writes `public/data/puzzles.json`
2. Add a GitHub Actions workflow (`.github/workflows/build-puzzles.yml`) to
   regenerate puzzle data monthly

### Phase 6 — Polish
1. Test on mobile viewport (375px wide)
2. Verify `localStorage` state persists and restores correctly
3. Verify daily rotation works by mocking dates
4. Add a "How to play" modal triggered on first visit

---

## Definition of Done

- [ ] `npm run dev` starts a working game in the browser
- [ ] `npm run build` produces a deployable `dist/` folder with no server needed
- [ ] All 6 rounds playable, words get longer each round
- [ ] On-screen keyboard marks used/correct/wrong letters
- [ ] HINT button reveals a clue (costs one attempt)
- [ ] Progress dots update correctly across rounds
- [ ] Daily puzzle changes at UTC midnight
- [ ] State survives page refresh (localStorage)
- [ ] Share button produces a copyable emoji summary
- [ ] Layout works on 375px–428px mobile screens
- [ ] Claude Code session-start hook runs without errors
