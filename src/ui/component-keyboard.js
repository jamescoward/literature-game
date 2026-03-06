const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

/**
 * renderKeyboard(letterStates, { onKey, onEnter, onBackspace })
 *
 * letterStates - object mapping uppercase letter -> 'correct' | 'wrong' | undefined
 * onKey        - called with uppercase letter string
 * onEnter      - called when ENTER pressed
 * onBackspace  - called when ⌫ pressed
 */
export function renderKeyboard(letterStates, { onKey, onEnter, onBackspace }) {
  const keyboard = document.createElement('div');
  keyboard.className = 'keyboard';

  ROWS.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'keyboard-row';

    row.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'key';

      if (key === 'ENTER') {
        btn.textContent = 'ENTER';
        btn.classList.add('key-wide');
        btn.setAttribute('aria-label', 'Submit guess');
        btn.addEventListener('click', onEnter);
      } else if (key === '⌫') {
        btn.textContent = '⌫';
        btn.classList.add('key-wide');
        btn.setAttribute('aria-label', 'Backspace');
        btn.addEventListener('click', onBackspace);
      } else {
        btn.textContent = key;
        btn.setAttribute('aria-label', `Letter ${key}`);
        const state = letterStates[key];
        if (state === 'wrong') btn.classList.add('key-wrong');
        if (state === 'correct') btn.classList.add('key-correct');
        btn.addEventListener('click', () => onKey(key));
      }

      rowEl.appendChild(btn);
    });

    keyboard.appendChild(rowEl);
  });

  return keyboard;
}
