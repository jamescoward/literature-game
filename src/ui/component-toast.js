/**
 * createToast() — creates a toast manager attached to document.body.
 *
 * Returns { show(message, duration?) }
 *   message  - text to display
 *   duration - ms before auto-hide (default 2000)
 */
export function createToast() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);

  function show(message, duration = 2000) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);

    // Trigger visible on next frame so CSS transition fires
    requestAnimationFrame(() => {
      el.classList.add('visible');
    });

    setTimeout(() => {
      el.classList.remove('visible');
      el.addEventListener('transitionend', () => el.remove(), { once: true });
      // Fallback removal if no transition fires (e.g. in tests)
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  return { show };
}
