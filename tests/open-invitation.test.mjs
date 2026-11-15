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

const notes = {
  join: 'note-join',
  install: 'note-install',
  noApp: 'note-no-app',
  computer: 'note-computer',
};

/** Runs the page script against the join page's elements at the given address, as a browser would. */
function openPage({ source = script, pathname = `/join/${inviteId}`, hash = `#${secret}`, userAgent = androidChrome } = {}) {
  const elements = {
    'join-action': { hidden: true },
    'join-button': {},
    install: { href: installUrl },
    'install-join': { href: installUrl },
    'note-join': { hidden: true },
    'note-install': { hidden: false },
    'note-no-app': { hidden: true },
    'note-computer': { hidden: true },
  };
  vm.runInNewContext(source, {
    location: { pathname, hash, search: '' },
    navigator: { userAgent },
    document: { getElementById: (id) => elements[id] ?? null },
  });
  return elements;
}

/** What the visitor sees: the button if shown, and the one note that is not hidden. */
function seen(page) {
  return {
    button: !page['join-action'].hidden,
    notes: Object.entries(notes)
      .filter(([, id]) => !page[id].hidden)
      .map(([name]) => name),
  };
}

const plainInstall = { button: false, notes: ['install'] };

test('in Android Chrome, Join the group hands exactly the invitation link to the app', () => {
  const page = openPage();
  assert.deepEqual(seen(page), { button: true, notes: ['join'] });
  assert.equal(
    page['join-button'].href,
    `intent://eyeoewe.app/join/${inviteId}#${secret}#Intent;scheme=https;package=app.eyeoewe;` +
      `S.browser_fallback_url=${encodeURIComponent(installUrl)};end`,
  );
  assert.equal(page.install.href, installUrl);
  assert.equal(page['install-join'].href, installUrl);
});

test('the intent carries the link Android reads as the app expects', () => {
  // Android's Intent.parseUri takes the data from everything before the last #, then replaces
  // "intent:" with the scheme; the app accepts only https://eyeoewe.app/join/<id>#<secret>.
  const href = openPage()['join-button'].href;
  const marker = href.lastIndexOf('#');
  assert.ok(href.startsWith('#Intent;', marker));
  const data = `https:${href.slice(0, marker).slice('intent:'.length)}`;
  assert.equal(data, `https://eyeoewe.app/join/${inviteId}#${secret}`);
  const url = new URL(data);
  assert.equal(url.pathname, `/join/${inviteId}`);
  assert.equal(url.hash, `#${secret}`);
  assert.equal(url.search, '');
});

test('on Android without a well-formed invitation, there is no button, only the install line', () => {
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
    const page = openPage(address);
    assert.deepEqual(seen(page), plainInstall);
    assert.equal(page['join-button'].href, undefined);
  }
});

test('in an in-app browser built on Android WebView, which cannot follow intent: links, there is no button', () => {
  const page = openPage({ userAgent: androidWebView });
  assert.deepEqual(seen(page), plainInstall);
  assert.equal(page['join-button'].href, undefined);
  assert.equal(page.install.href, installUrl);
});

test('on an iPhone, which has no store link yet, the page says the app is not on the phone', () => {
  const page = openPage({ userAgent: iPhoneSafari });
  assert.deepEqual(seen(page), { button: false, notes: ['noApp'] });
  assert.equal(page['join-button'].href, undefined);
});

test('a platform with a store link but no intent gets the install line with that link, and no button', () => {
  const appStore = 'https://apps.apple.com/app/eyeoewe/id1';
  const page = openPage({ source: script.replace('ios: null', `ios: '${appStore}'`), userAgent: iPhoneSafari });
  assert.deepEqual(seen(page), plainInstall);
  assert.equal(page.install.href, appStore);
  assert.equal(page['install-join'].href, appStore);
  assert.equal(page['join-button'].href, undefined);
});

test('on a computer the page says to open the invitation on a phone', () => {
  for (const userAgent of [desktopChrome, '']) {
    const page = openPage({ userAgent });
    assert.deepEqual(seen(page), { button: false, notes: ['computer'] });
    assert.equal(page['join-button'].href, undefined);
  }
});

test('the page script keeps the same store link as the page itself', () => {
  assert.equal(/android: '([^']+)'/.exec(script)[1], installUrl);
  assert.match(script, /ios: null/);
});

test('the script reads the address but sends and stores nothing', () => {
  // The page's CSP would not stop a script loading /anything?<secret> as an image or navigating to
  // it, so the script's own code is what keeps the secret on the phone.
  assert.doesNotMatch(
    script,
    /console|fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|import\(|Image|Storage|cookie|postMessage|open\(|assign\(|replace\(|createElement|innerHTML|outerHTML|insertAdjacent|appendChild|append\(|setAttribute|write\(|\.src\b|location\.href|location\s*=/,
  );
  // It changes only links and which elements are hidden.
  const code = script.replace(/`[^`]*`/g, '``').replace(/\/\/.*$/gm, '');
  const assignments = [...code.matchAll(/([\w.\[\]]+)\s*=(?![=>])/g)].map((match) => match[1]);
  assert.deepEqual(
    assignments.filter((target) => target.includes('.')),
    ['notes[key].hidden', 'joinAction.hidden', 'link.href', 'joinButton.href'],
  );
});
