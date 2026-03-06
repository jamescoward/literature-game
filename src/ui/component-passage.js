/**
 * renderPassage(passage, word, wordStart, wordEnd, revealedLetters, hintText, hintUsed, onHint)
 *
 * passage        - full passage string
 * word           - the hidden word
 * wordStart      - character index where the word starts in the passage
 * wordEnd        - character index of the last character of the word
 * revealedLetters - array of { letter, revealed } from getRevealedLetters()
 * hintText       - string or null; shown when hintUsed is true
 * hintUsed       - boolean
 * onHint         - callback invoked when HINT button is clicked
 */
export function renderPassage(passage, word, wordStart, wordEnd, revealedLetters, hintText, hintUsed, onHint) {
  const wrapper = document.createElement('div');
  wrapper.className = 'passage-wrapper';

  // Build passage text with inline blank word
  const p = document.createElement('p');
  p.className = 'passage-text';

  const before = passage.slice(0, wordStart);
  const after = passage.slice(wordEnd + 1);

  if (before) {
    p.appendChild(document.createTextNode(before));
  }

  revealedLetters.forEach(({ letter, revealed }) => {
    if (revealed) {
      const span = document.createElement('span');
      span.className = 'word-char';
      span.textContent = letter;
      p.appendChild(span);
    } else {
      const blank = document.createElement('span');
      blank.className = 'word-blank';
      blank.setAttribute('aria-hidden', 'true');
      p.appendChild(blank);
    }
  });

  if (after) {
    p.appendChild(document.createTextNode(after));
  }

  wrapper.appendChild(p);

  // Hint area
  const hintArea = document.createElement('div');
  hintArea.className = 'hint-area';
  if (hintUsed && hintText) {
    hintArea.textContent = hintText;
  }
  wrapper.appendChild(hintArea);

  // Hint button
  const hintBtn = document.createElement('button');
  hintBtn.className = 'hint-btn';
  hintBtn.textContent = 'HINT';
  hintBtn.setAttribute('aria-label', 'Use hint (costs one attempt)');
  hintBtn.disabled = hintUsed;
  hintBtn.addEventListener('click', onHint);
  wrapper.appendChild(hintBtn);

  return wrapper;
}
