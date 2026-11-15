import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';

const script = readFileSync(resolve(process.cwd(), 'public/theme.js'), 'utf8');

/** Runs theme.js against a fake page, as a browser would; `fire('DOMContentLoaded')` then `click()` follow. */
function openPage({ saved = null, storageThrows = false, phoneDark = false } = {}) {
  const dataset = {};
  const stored = new Map(saved === null ? [] : [['theme', saved]]);
  const listeners = {};
  const toggle = {
    hidden: true,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    addEventListener(type, listener) {
      listeners[`toggle:${type}`] = listener;
    },
  };
  const metas = [{ content: '#FAF8F6' }, { content: '#0D1925' }];
  const context = {
    localStorage: {
      getItem(key) {
        if (storageThrows) throw new Error('blocked');
        return stored.get(key) ?? null;
      },
      setItem(key, value) {
        if (storageThrows) throw new Error('blocked');
        stored.set(key, value);
      },
    },
    matchMedia: () => ({ matches: phoneDark, addEventListener() {} }),
    document: {
      documentElement: { dataset },
      querySelectorAll: () => metas,
      getElementById: (id) => (id === 'theme-toggle' ? toggle : null),
      addEventListener: (type, listener) => {
        listeners[type] = listener;
      },
    },
  };
  vm.runInNewContext(script, context);
  return {
    dataset,
    stored,
    toggle,
    metas,
    ready: () => listeners.DOMContentLoaded(),
    click: () => listeners['toggle:click'](),
  };
}

test('storage that throws is tolerated: the phone setting applies, and a click still flips the theme', () => {
  const page = openPage({ storageThrows: true, phoneDark: true });
  assert.equal(page.dataset.theme, undefined);
  page.ready();
  assert.equal(page.toggle.hidden, false);
  assert.equal(page.toggle.attributes['aria-label'], 'Switch to light theme');
  page.click();
  assert.equal(page.dataset.theme, 'light');
  assert.equal(page.toggle.attributes['aria-label'], 'Switch to dark theme');
});

test('a saved dark theme is applied as the script runs, before the page paints', () => {
  const page = openPage({ saved: 'dark' });
  assert.equal(page.dataset.theme, 'dark');
  assert.deepEqual(page.metas.map((meta) => meta.content), ['#0D1925', '#0D1925']);
});

test('an invalid saved value is ignored', () => {
  for (const saved of ['', 'auto', 'DARK', 'dark ', 'null']) {
    const page = openPage({ saved });
    assert.equal(page.dataset.theme, undefined);
    assert.deepEqual(page.metas.map((meta) => meta.content), ['#FAF8F6', '#0D1925']);
  }
});

test('a click flips the theme, saves it, and updates the label and the browser bar colour', () => {
  const page = openPage({ phoneDark: false });
  page.ready();
  assert.equal(page.toggle.attributes['aria-label'], 'Switch to dark theme');
  page.click();
  assert.equal(page.dataset.theme, 'dark');
  assert.equal(page.stored.get('theme'), 'dark');
  assert.equal(page.toggle.attributes['aria-label'], 'Switch to light theme');
  assert.deepEqual(page.metas.map((meta) => meta.content), ['#0D1925', '#0D1925']);
  page.click();
  assert.equal(page.dataset.theme, 'light');
  assert.equal(page.stored.get('theme'), 'light');
  assert.equal(page.toggle.attributes['aria-label'], 'Switch to dark theme');
  assert.deepEqual(page.metas.map((meta) => meta.content), ['#FAF8F6', '#FAF8F6']);
});
