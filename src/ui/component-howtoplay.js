const STORAGE_KEY = 'literature-game-howtoplay-seen';

/**
 * renderHowToPlay(onClose) → DOM element
 *
 * Returns the "How to Play" modal element.
 * onClose is called when the player dismisses the modal.
 */
export function renderHowToPlay(onClose) {
  const modal = document.createElement('div');
  modal.className = 'modal-howtoplay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'How to play');

  const box = document.createElement('div');
  box.className = 'modal-box';

  const title = document.createElement('h2');
  title.className = 'modal-title';
  title.textContent = 'How to Play';
  box.appendChild(title);

  const body = document.createElement('div');
  body.className = 'modal-body';
  body.innerHTML = `
    <p>Each day features a new book from classic literature.</p>
    <ul>
      <li>You have <strong>6 rounds</strong>. Each round hides a word from a passage.</li>
      <li>Type your <strong>guess letter by letter</strong> using the keyboard below.</li>
      <li>The first and last letters of each word are always shown.</li>
      <li>After each wrong guess, one more letter is revealed.</li>
      <li>You have up to <strong>6 attempts</strong> per round.</li>
      <li>Use the <strong>HINT</strong> button for a clue — it costs one attempt.</li>
      <li>Words get longer each round (4 → 9–12 letters).</li>
    </ul>
    <p>Score up to <strong>36 points</strong> across all six rounds. Good luck!</p>
  `;
  box.appendChild(body);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = 'Got it!';
  closeBtn.setAttribute('aria-label', 'Close how to play');
  closeBtn.addEventListener('click', () => {
    markHowToPlaySeen();
    modal.remove();
    onClose();
  });
  box.appendChild(closeBtn);

  modal.appendChild(box);
  return modal;
}

export function hasSeenHowToPlay() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function markHowToPlaySeen() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

/**
 * showHowToPlayIfFirstVisit(container)
 *
 * Appends the modal to container if the player has never seen it.
 */
export function showHowToPlayIfFirstVisit(container) {
  if (hasSeenHowToPlay()) return;
  const modal = renderHowToPlay(() => {});
  container.appendChild(modal);
}
