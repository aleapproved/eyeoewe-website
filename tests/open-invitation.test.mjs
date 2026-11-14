import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import vm from 'node:vm';

const script = readFileSync(resolve(process.cwd(), 'public/open-invitation.js'), 'utf8');
const installUrl = 'https://play.google.com/apps/internaltest/4701549140080017667';
const inviteId = '0123456789abcdef0123456789abcdef';
const secret = '0123456789abcdef'.repeat(4);
const androidChrome =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const iPhoneSafari =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const androidWebView =
  'Mozilla/5.0 (Linux; Android 16; sdk_gphone64_x86_64 Build/BP22.250325.006; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.63 Mobile Safari/537.36';
const desktopChrome =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

/** Runs the page script against the join page's elements at the given address, as a browser would. */
function openPage({ pathname = `/join/${inviteId}`, hash = `#${secret}`, userAgent = androidChrome } = {}) {
  const elements = {
    install: { href: installUrl, hidden: false },
    'open-invitation': { hidden: true },
    'reopen-link-note': { hidden: false },
    'open-invitation-note': { hidden: true },
  };
  vm.runInNewContext(script, {
    location: { pathname, hash, search: '' },
    navigator: { userAgent },
    document: { getElementById: (id) => elements[id] ?? null },
  });
  return elements;
}

function assertUnchanged(elements) {
  assert.equal(elements['open-invitation'].hidden, true);
  assert.equal(elements['open-invitation'].href, undefined);
  assert.equal(elements['reopen-link-note'].hidden, false);
  assert.equal(elements['open-invitation-note'].hidden, true);
}

test('on Android, Open invitation hands exactly the invitation link to the app', () => {
  const page = openPage();
  assert.equal(page['open-invitation'].hidden, false);
  assert.equal(
    page['open-invitation'].href,
    `intent://eyeoewe.app/join/${inviteId}#${secret}#Intent;scheme=https;package=app.eyeoewe;` +
      `S.browser_fallback_url=${encodeURIComponent(installUrl)};end`,
  );
  assert.equal(page['reopen-link-note'].hidden, true);
  assert.equal(page['open-invitation-note'].hidden, false);
});

test('the intent carries the link Android reads as the app expects', () => {
  // Android's Intent.parseUri takes the data from everything before the last #, then replaces
  // "intent:" with the scheme; the app accepts only https://eyeoewe.app/join/<id>#<secret>.
  const href = openPage()['open-invitation'].href;
  const marker = href.lastIndexOf('#');
  assert.ok(href.startsWith('#Intent;', marker));
  const data = `https:${href.slice(0, marker).slice('intent:'.length)}`;
  assert.equal(data, `https://eyeoewe.app/join/${inviteId}#${secret}`);
  const url = new URL(data);
  assert.equal(url.pathname, `/join/${inviteId}`);
  assert.equal(url.hash, `#${secret}`);
  assert.equal(url.search, '');
});

test('without a well-formed invitation, the page keeps its plain instructions', () => {
  for (const address of [
    { hash: '' },
    { hash: '#' },
    { hash: `#${secret.slice(1)}` },
    { hash: `#${secret}0` },
    { hash: `#${secret.toUpperCase()}` },
    { hash: `#${secret.slice(1)}g` },
    { hash: `#${secret}#Intent;package=other.app;end` },
    { hash: `#${secret}%0A` },
    { pathname: '/join/' },
    { pathname: `/join/${inviteId}/` },
    { pathname: `/join/${inviteId.slice(1)}` },
    { pathname: `/join/${inviteId.toUpperCase()}` },
    { pathname: `/join/${inviteId}/extra` },
    { pathname: `/other/${inviteId}` },
  ]) {
    assertUnchanged(openPage(address));
  }
});

test('off Android there is no app to open, so the page keeps its plain instructions', () => {
  for (const userAgent of [iPhoneSafari, desktopChrome, '']) {
    assertUnchanged(openPage({ userAgent }));
  }
});

test('in an in-app browser built on Android WebView, which cannot follow intent: links, it does too', () => {
  assertUnchanged(openPage({ userAgent: androidWebView }));
});

test('the script reads the address but sends and stores nothing', () => {
  // The page's CSP would not stop a script loading /anything?<secret> as an image or navigating to
  // it, so the script's own code is what keeps the secret on the phone.
  assert.doesNotMatch(
    script,
    /fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|import\(|Image|Storage|cookie|postMessage|open\(|assign\(|replace\(|createElement|innerHTML|outerHTML|insertAdjacent|appendChild|append\(|setAttribute|write\(|\.src\b|location\.href|location\s*=/,
  );
  // It changes only the button's link and which elements are hidden.
  const code = script.replace(/`[^`]*`/g, '``').replace(/\/\/.*$/gm, '');
  const assignments = [...code.matchAll(/([\w.]+)\s*=(?![=>])/g)].map((match) => match[1]);
  assert.deepEqual(
    assignments.filter((target) => target.includes('.')),
    ['open.href', 'open.hidden', 'reopenNote.hidden', 'openNote.hidden'],
  );
});
