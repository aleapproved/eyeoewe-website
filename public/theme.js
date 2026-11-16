// The site follows the phone's light or dark setting. The toggle overrides it and remembers the
// choice on this device. The choice is applied here, in the head, before the page paints.
'use strict';

(() => {
  const root = document.documentElement;
  const key = 'theme';
  const themeColor = { light: '#FAF8F6', dark: '#0D1925' };
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  } catch {
    // Storage can be blocked; the phone's setting applies.
  }

  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;

  // Once a theme is chosen, the browser bar follows it rather than the phone.
  const syncThemeColor = () => {
    if (!root.dataset.theme) return;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.content = themeColor[root.dataset.theme];
    }
  };
  syncThemeColor();

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    const label = () => {
      toggle.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
    };
    toggle.hidden = false;
    label();
    toggle.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem(key, next);
      } catch {
        // The choice then lasts only until the page is closed.
      }
      syncThemeColor();
      label();
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', label);
  });
})();
