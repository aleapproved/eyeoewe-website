// Shows the right instruction on the invitation page, and on Android the Join the group button.
//
// The button hands the link to the app with an intent: URL naming its package, because Chrome keeps a
// tap on a link to this same site in the browser. The secret (the part after #) goes only into that
// URL, which Android delivers to the named app alone. This script sends and stores nothing.
//
// Android reads the intent's data as everything before the last #, so the invitation's own # part
// survives: intent://eyeoewe.app/join/<id>#<secret>#Intent;scheme=https;...;end becomes
// https://eyeoewe.app/join/<id>#<secret>, the only form the app accepts.
'use strict';

(() => {
  // Where to install the app, per platform. Give iPhones their store link here when the app is there.
  const stores = {
    android: 'https://play.google.com/apps/internaltest/4701549140080017667',
    ios: null,
  };

  const byId = (id) => document.getElementById(id);
  const joinAction = byId('join-action');
  const joinButton = byId('join-button');
  const installLinks = [byId('install'), byId('install-join'), byId('install-webview')];
  const notes = {
    join: byId('note-join'),
    install: byId('note-install'),
    webview: byId('note-webview'),
    noApp: byId('note-no-app'),
    computer: byId('note-computer'),
  };
  if (!joinAction || !joinButton || installLinks.includes(null) || Object.values(notes).includes(null)) return;

  // Shows the named note, and the button too when it is "join".
  const show = (name) => {
    for (const key of Object.keys(notes)) notes[key].hidden = key !== name;
    joinAction.hidden = name !== 'join';
  };

  const userAgent = navigator.userAgent;
  const platform = /\bAndroid\b/.test(userAgent)
    ? 'android'
    : /\b(iPhone|iPad|iPod)\b/.test(userAgent)
      ? 'ios'
      : 'computer';
  if (platform === 'computer') return show('computer');

  const store = stores[platform];
  if (!store) return show('noApp');
  for (const link of installLinks) link.href = store;

  // The same patterns the app applies to an incoming invitation.
  const invitePath = /^\/join\/([0-9a-f]{32})$/.exec(location.pathname);
  const secret = /^#([0-9a-f]{64})$/.exec(location.hash);
  // intent: links work only in Android's browsers. An in-app browser built on Android's WebView (its
  // user agent says "; wv)") loads the intent: link itself and shows ERR_UNKNOWN_URL_SCHEME, so there
  // the page says to open it in the browser instead.
  if (platform === 'android' && /; wv\)/.test(userAgent)) return show('webview');
  if (platform !== 'android' || invitePath === null || secret === null) return show('install');

  // Without the app, Chrome follows the fallback, which is the store link.
  joinButton.href =
    `intent://eyeoewe.app/join/${invitePath[1]}#${secret[1]}` +
    `#Intent;scheme=https;package=app.eyeoewe;` +
    `S.browser_fallback_url=${encodeURIComponent(store)};end`;
  show('join');
})();
