// Shows Open invitation on Android when the page was opened from a well-formed invitation link.
//
// The button hands the link to the app with an intent: URL naming its package, because Chrome keeps a
// tap on a link to this same site in the browser. The secret (the part after #) goes only into that
// URL, which Android delivers to the named app alone; this script sends nothing anywhere, and the
// page's Content-Security-Policy (connect-src 'none') blocks any request from it.
//
// Android reads the intent's data as everything before the last #, so the invitation's own # part
// survives: intent://eyeoewe.app/join/<id>#<secret>#Intent;scheme=https;...;end becomes
// https://eyeoewe.app/join/<id>#<secret>, the only form the app accepts.
'use strict';

(() => {
  // The same patterns the app applies to an incoming invitation.
  const invitePath = /^\/join\/([0-9a-f]{32})$/.exec(location.pathname);
  const secret = /^#([0-9a-f]{64})$/.exec(location.hash);
  // There is no app to open elsewhere, and intent: links work only on Android.
  if (invitePath === null || secret === null || !/\bAndroid\b/.test(navigator.userAgent)) return;

  const install = document.getElementById('install');
  const open = document.getElementById('open-invitation');
  const reopenNote = document.getElementById('reopen-link-note');
  const openNote = document.getElementById('open-invitation-note');
  if (!install || !open || !reopenNote || !openNote) return;

  // Without the app, Chrome follows the fallback, which is where Install from Google Play goes.
  open.href =
    `intent://eyeoewe.app/join/${invitePath[1]}#${secret[1]}` +
    `#Intent;scheme=https;package=app.eyeoewe;` +
    `S.browser_fallback_url=${encodeURIComponent(install.href)};end`;
  open.hidden = false;
  reopenNote.hidden = true;
  openNote.hidden = false;
})();
