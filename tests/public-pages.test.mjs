import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';

const read = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');
const exists = (relativePath) => existsSync(resolve(process.cwd(), relativePath));
const root = read('public/index.html');
const body = root.slice(root.indexOf('<body>'), root.indexOf('</body>'));
const bodyText = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const styles = read('public/styles.css');
const home = read('public/home.css');
const theme = read('public/theme.js');
const installUrl = 'https://play.google.com/apps/internaltest/4701549140080017667';
const redirects = read('public/_redirects');
const headers = read('public/_headers');
const assetLinksText = read('public/.well-known/assetlinks.json');
const assetLinks = JSON.parse(assetLinksText);
const workflow = read('.github/workflows/ci.yml');
const readme = read('README.md');
const agents = read('AGENTS.md');
const product = read('PRODUCT.md');
const architecture = read('ARCHITECTURE.md');
const contributing = read('CONTRIBUTING.md');
const release = read('RELEASE.md');
const pullRequestTemplate = read('.github/pull_request_template.md');
const gitignore = read('.gitignore');
const playAppSigningSha256 =
  '56:57:AA:0C:8D:0C:2E:48:07:4B:AF:AB:99:14:9D:2B:87:59:4D:53:19:09:A2:C4:BB:3E:4A:1E:70:37:7A:BA';

function redirectSourceMatches(source, path) {
  const pattern = source
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${pattern}$`).test(path);
}

const redirectSources = redirects
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith('#'))
  .map((line) => line.split(/\s+/)[0]);

test('publishes the short branded homepage with the approved copy only', () => {
  assert.match(root, /<!doctype html>/);
  assert.match(root, /<title>Eye O Ewe — Split bills with friends, privately\.<\/title>/);
  assert.match(bodyText, /Split bills with friends, privately\./);
  assert.match(
    bodyText,
    /Your expenses are encrypted, so only your group can see them\. Most apps can see everything you add\./,
  );
  assert.match(bodyText, /Free and ad-free/);
  assert.match(bodyText, /There’s no limit on how many expenses you can add\./);
  assert.doesNotMatch(bodyText, /Invite-only|Install from Google Play|Simple\. Free\. Encrypted\.|Shared expenses/);
  assert.match(root, /<img class="brand-mark" src="\/app-icon\.webp"[^>]+width="44"[^>]+height="44"/);
  assert.match(root, /<link rel="icon" type="image\/png" sizes="64x64" href="\/favicon\.png"/);
  assert.match(root, /og:image.*social-preview\.jpg/);
  assert.match(root, /twitter:image.*social-preview\.jpg/);
  assert.doesNotMatch(root, /<nav\b|<form\b|<input\b|<ul\b|<ol\b/);
  assert.doesNotMatch(root, /Free forever|End-to-end encrypted|feature grid|testimonial/i);
  for (const file of ['app-icon.png', 'app-icon.webp', 'social-preview.jpg', 'favicon.png', 'styles.css', 'home.css', 'theme.js', 'google-play-badge.png']) {
    assert.ok(exists(`public/${file}`), `missing ${file}`);
  }
  assert.ok(!exists('public/eyeoewe-logo.png'));
  assert.match(redirects, /^\/eyeoewe\/v1\/\* \/ 302$/m);
  assert.ok(!exists('public/eyeoewe'));
});

test('links the Google Play badge to the install link, with the content in order', () => {
  assert.match(
    root,
    new RegExp(`<a href="${installUrl}"><img src="/google-play-badge\\.png" alt="Get it on Google Play" width="646" height="250" /></a>`),
  );
  // Google's artwork, unaltered: any change to the file must be deliberate.
  assert.equal(
    createHash('sha256').update(readFileSync(resolve(process.cwd(), 'public/google-play-badge.png'))).digest('hex'),
    'f72611e2df8e88204009fd896d05d5e8e83c77009c63943bbffa169559934849',
  );
  const order = ['hero-title', 'free-title', 'google-play-badge.png', 'class="screens"', 'touch-title'].map((marker) => root.indexOf(marker));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.ok(!order.includes(-1));
});

test('keeps the two screenshots side by side at every width', () => {
  assert.match(home, /\.screens \{\n  display: grid;\n  grid-template-columns: repeat\(2, minmax\(0, 17rem\)\);/);
  assert.doesNotMatch(home, /max-width: 600px/);
  assert.doesNotMatch(product, /stacked/);
});

test('shows the real app screens for the theme in force, with one alt text at a time', () => {
  const images = root.match(/<img class="shot-img[^>]*>/g) ?? [];
  assert.equal(images.length, 4);
  const group = 'alt="A group’s balances in Eye O Ewe"';
  const expense = 'alt="Adding an expense in Eye O Ewe"';
  const expected = [
    ['shot-light', 'group-light.webp', group],
    ['shot-dark', 'group-dark.webp', group],
    ['shot-light', 'expense-light.webp', expense],
    ['shot-dark', 'expense-dark.webp', expense],
  ];
  expected.forEach(([theme, file, alt], i) => {
    assert.match(images[i], new RegExp(`class="shot-img ${theme}" loading="lazy" src="/${file}" width="816" height="1813" ${alt}`));
    assert.ok(exists(`public/${file}`), file);
  });
  assert.doesNotMatch(root, /placeholder/i);
  assert.match(home, /\.shot-img \{[^}]*border-radius: 1rem;[^}]*box-shadow:/);
  // The image not in force is display: none, so a screen reader meets one alt text per pair.
  assert.match(home, /\.shot-dark \{\n  display: none;/);
  assert.match(home, /:root:not\(\[data-theme="light"\]\) \.shot-light \{\n    display: none;/);
  assert.match(home, /:root\[data-theme="dark"\] \.shot-light \{\n  display: none;/);
  assert.match(root, /<h2 id="touch-title">Get in touch<\/h2>/);
  assert.match(root, /Questions or ideas\? Email <a href="mailto:hello@eyeoewe\.app">/);
});

test('keeps the dark palette identical in both blocks, the browser-bar colours and the early theme script', () => {
  const block = (selector) => styles.slice(styles.indexOf(selector)).match(/\{([^}]*)\}/)[1].replace(/\s+/g, ' ').trim();
  assert.equal(block(':root:not([data-theme="light"]) {'), block(':root[data-theme="dark"] {'));
  assert.match(root, /<meta name="theme-color" content="#FAF8F6" media="\(prefers-color-scheme: light\)" \/>/);
  assert.match(root, /<meta name="theme-color" content="#0D1925" media="\(prefers-color-scheme: dark\)" \/>/);
  const head = root.slice(root.indexOf('<head>'), root.indexOf('</head>'));
  assert.match(head, /<script src="\/theme\.js\?v=1"><\/script>/);
});

test('follows the phone theme with a toggle that remembers the choice, from a same-origin script', () => {
  assert.match(root, /<meta name="color-scheme" content="light dark" \/>/);
  assert.deepEqual(root.match(/<script\b[^>]*>/g), ['<script src="/theme.js?v=1">']);
  assert.match(root, /<button class="theme-toggle" id="theme-toggle" type="button"[^>]* hidden>/);
  assert.match(styles, /@media \(prefers-color-scheme: dark\) \{\n  :root:not\(\[data-theme="light"\]\)/);
  for (const dark of ['#0D1925', '#14222F', '#E8EEF5', '#A2B2C2']) assert.ok(styles.includes(dark), dark);
  assert.match(root, /<meta name="color-scheme" content="light dark" \/>/);
  assert.match(join, /<meta name="color-scheme" content="light dark" \/>/);
  assert.match(join, /<script src="\/theme\.js\?v=1"><\/script>/);
  assert.match(join, /<button class="theme-toggle" id="theme-toggle" type="button"[^>]* hidden>/);
  // Without the script the toggle stays hidden: its display must not override the hidden attribute.
  assert.match(styles, /\[hidden\] \{\n  display: none !important;\n\}/);
  assert.doesNotMatch(root + join + styles + home, /color-scheme" content="light"/);
  assert.match(theme, /localStorage\.getItem/);
  assert.match(theme, /localStorage\.setItem/);
  assert.equal((theme.match(/\btry\b/g) ?? []).length, 2);
  assert.doesNotMatch(theme, /fetch|XMLHttpRequest|sendBeacon|WebSocket|document\.cookie/);
});

test('publishes the exact Play App Signing Digital Asset Links statement', () => {
  assert.ok(exists('public/.well-known/assetlinks.json'));
  assert.doesNotMatch(assetLinksText, /<html\b|Invite-only for now/i);
  assert.ok(Array.isArray(assetLinks));
  assert.equal(assetLinks.length, 1);
  assert.deepEqual(assetLinks[0], {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'app.eyeoewe',
      sha256_cert_fingerprints: [playAppSigningSha256],
    },
  });
  assert.match(playAppSigningSha256, /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/);
});

test('keeps the Asset Links route outside configured redirects', () => {
  assert.equal(
    redirectSources.some((source) =>
      redirectSourceMatches(source, '/.well-known/assetlinks.json'),
    ),
    false,
  );
  assert.equal(
    redirectSources.some((source) => redirectSourceMatches(source, '/eyeoewe/v1/x')),
    true,
  );
  assert.match(headers, /^\/\*$/m);
  assert.match(headers, /^\/\.well-known\/assetlinks\.json$/m);
  assert.match(headers, /Content-Type: application\/json/);
});

const join = read('public/join/index.html');
const joinBody = join.slice(join.indexOf('<body>'), join.indexOf('</body>'));
const joinText = joinBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

test('serves one install page for every invitation link, rewritten not redirected', () => {
  // Pages canonicalises /join/index.html to /join/ with a 308, so the rewrite must target /join/.
  assert.match(redirects, /^\/join\/\* \/join\/ 200$/m);
  assert.equal(
    redirectSources.some((source) => redirectSourceMatches(source, '/.well-known/assetlinks.json')),
    false,
  );
  assert.match(joinText, /You’ve been invited to a group on Eye&nbsp;O&nbsp;Ewe/);
  assert.match(joinBody, /class="brand-mark" src="\/app-icon\.webp"/);
});

test('says what to do on every platform, and shows the Join button only when the page script says so', () => {
  // Without the script, the page shows just the install line.
  assert.match(
    joinBody,
    /<p class="join-action" id="join-action" hidden>\s*<a class="button button-block" id="join-button">Join the group<\/a>\s*<\/p>/,
  );
  assert.doesNotMatch(joinBody, /id="join-button"[^>]*href=/);
  assert.match(
    joinBody,
    new RegExp(
      `<p class="note" id="note-join" hidden>Don’t have the app yet\\? <a id="install-join" href="${installUrl}">Install Eye&nbsp;O&nbsp;Ewe</a>, then come back to this page and tap Join the group\\.</p>`,
    ),
  );
  assert.match(
    joinBody,
    new RegExp(
      `<p class="note" id="note-install"><a id="install" href="${installUrl}">Install Eye&nbsp;O&nbsp;Ewe</a>, then tap your invitation link again\\.</p>`,
    ),
  );
  assert.match(
    joinBody,
    new RegExp(
      `<p class="note" id="note-webview" hidden>To join, open this page in your browser\\. Don’t have the app yet\\? <a id="install-webview" href="${installUrl}">Install Eye&nbsp;O&nbsp;Ewe</a> first\\.</p>`,
    ),
  );
  assert.match(joinBody, /<p class="note" id="note-no-app" hidden>Eye&nbsp;O&nbsp;Ewe isn’t on iPhone yet\.<\/p>/);
  assert.match(joinBody, /<p class="note" id="note-computer" hidden>Open this invitation on your phone\.<\/p>/);
  assert.match(styles, /\[hidden\] \{\n  display: none !important;\n\}/);
  assert.ok(exists('public/open-invitation.js'));
});

test('links the homepage and the join page only to the Play internal testing opt-in', () => {
  const external = (page) => (page.match(/href="https?:[^"]*"/g) ?? []).filter((link) => !link.includes('eyeoewe.app'));
  assert.deepEqual(external(root), [`href="${installUrl}"`]);
  assert.deepEqual(external(join), [installUrl, installUrl, installUrl].map((url) => `href="${url}"`));
});

test('keeps the invitation secret on the join page only', () => {
  // Both scripts are same-origin; tests/open-invitation.test.mjs pins that the invitation script sends nothing.
  assert.deepEqual(join.match(/<script\b[^>]*>/g), ['<script src="/theme.js?v=1">', '<script src="/open-invitation.js?v=1">']);
  assert.match(join, /<script src="\/open-invitation\.js\?v=1"><\/script>/);
  assert.doesNotMatch(join, /<form\b|<iframe\b|<img[^>]+src="https?:|<link[^>]+href="https?:/i);
  assert.doesNotMatch(join, /location|referrer|canonical|og:url|analytics/i);
  assert.match(headers, /^\/\*\n(?:  .+\n)*  Referrer-Policy: no-referrer$/m);
  assert.doesNotMatch(headers, /Referrer-Policy: (?!no-referrer$)/m);
});

test('uses the mobile app visual language with responsive, accessible styling', () => {
  for (const color of [
    '#FAF8F6',
    '#FDFCFB',
    '#072240',
    '#5A6674',
    '#87919B',
    '#EDEBEA',
    '#D3D0CD',
    '#E7B43A',
  ]) {
    assert.match(styles, new RegExp(color));
  }
  assert.doesNotMatch(styles + home, /Georgia|Times New Roman|--display/);
  assert.match(styles, /\.brand:focus-visible/);
  assert.match(styles, /@media \(max-width: 820px\)/);
  assert.match(styles, /@media \(max-width: 420px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(styles, /\.hero-visual/);
  assert.doesNotMatch(styles, /\.status-dot/);
});

test('self-hosts small Roboto and Noto Serif fonts with their licences', () => {
  const fonts = [
    ['Roboto-400Regular.woff2', 40000],
    ['Roboto-600SemiBold.woff2', 40000],
    ['Roboto-700Bold.woff2', 40000],
    ['NotoSerif-400Regular.woff2', 10000],
  ];
  let total = 0;
  for (const [name, ceiling] of fonts) {
    const file = resolve(process.cwd(), 'public/fonts', name);
    assert.ok(existsSync(file), name + ' is missing');
    const bytes = readFileSync(file);
    assert.equal(bytes.subarray(0, 4).toString('latin1'), 'wOF2');
    assert.ok(bytes.length < ceiling, name + ' is too big: ' + bytes.length);
    total += bytes.length;
    assert.ok(styles.includes('url("/fonts/' + name + '")'), name + ' is not in @font-face');
  }
  assert.ok(total < 120000);
  assert.equal(styles.match(/font-display: swap;/g).length, fonts.length);
  assert.match(styles, /font-family:\s*"Roboto", -apple-system/);
  assert.match(styles, /\.brand span \{[^}]*"Noto Serif"/);
  assert.ok(exists('public/fonts/OFL-Roboto.txt'));
  assert.ok(exists('public/fonts/OFL-NotoSerif.txt'));
  assert.match(read('public/fonts/OFL-Roboto.txt'), /SIL OPEN FONT LICENSE/);
  assert.match(read('public/fonts/OFL-NotoSerif.txt'), /SIL OPEN FONT LICENSE/);
});

test('the visible name Eye O Ewe never breaks across lines', () => {
  for (const html of [root, read('public/join/index.html')]) {
    const visible = html
      .slice(html.indexOf('<body>'), html.indexOf('</body>'))
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '')
      .replace(/<[^>]*>/g, ' ');
    assert.ok(visible.includes('Eye&nbsp;O&nbsp;Ewe'));
    assert.doesNotMatch(visible, /Eye\s+O\s+Ewe/);
    assert.doesNotMatch(visible, /Eye&nbsp;O (?:&nbsp;)?Ewe|Eye O&nbsp;Ewe/);
  }
});

test('turns off the browser tap highlight and gives pressed states of its own', () => {
  assert.match(styles, /\* \{[^}]*-webkit-tap-highlight-color: transparent;/);
  assert.match(styles, /\.theme-toggle:active \{[^}]*background: var\(--line\)/);
  assert.match(styles, /a:active \{[^}]*opacity/);
});

test('the toggle icon shows the current mode: sun in light, moon in dark', () => {
  assert.match(styles, /:root \{\s*--toggle-moon: none;\s*--toggle-sun: block;\s*\}/);
  assert.match(styles, /:root:not\(\[data-theme="light"\]\) \{[^}]*--toggle-moon: block;\s*--toggle-sun: none;/);
  assert.match(styles, /:root\[data-theme="dark"\] \{[^}]*--toggle-moon: block;\s*--toggle-sun: none;/);
  assert.doesNotMatch(styles, /:root\[data-theme="light"\] \{[^}]*--toggle/);
});

test('headings wrap into even lines', () => {
  assert.match(styles, /h1,\s*h2 \{[^}]*text-wrap: balance/);
});

test('serves restrictive headers compatible with this static page', () => {
  assert.match(headers, /Content-Security-Policy:/);
  for (const directive of [
    "default-src 'self'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "img-src 'self'",
    "style-src 'self'",
    "script-src 'self'",
    "connect-src 'none'",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'none'",
  ]) {
    assert.ok(headers.includes(directive), "missing header directive: " + directive);
  }
  assert.doesNotMatch(headers, /unsafe-inline|unsafe-eval|https?:\/\//);
  // One policy for the whole site: same-origin scripts only (the theme and invitation scripts).
  const csp = [...headers.matchAll(/^  Content-Security-Policy: (.+)$/gm)].map((match) => match[1]);
  assert.equal(csp.length, 1);
  assert.ok(csp[0].includes("script-src 'self'"));
  assert.doesNotMatch(headers, /\/join\/\*|^  ! /m);
  assert.match(headers, /Permissions-Policy:/);
  assert.match(headers, /Referrer-Policy: no-referrer/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /X-Frame-Options: DENY/);
});

test('defines the minimal PR and main CI workflow', () => {
  assert.match(workflow, /^name: CI$/m);
  assert.match(workflow, /pull_request:[\s\S]*branches:[\s\S]*- main/);
  assert.match(workflow, /push:[\s\S]*branches:[\s\S]*- main/);
  assert.match(workflow, /permissions:\s*\n\s+contents: read/);
  assert.match(workflow, /node-version: 20/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /run: npm test/);
  assert.match(workflow, /run: node --check scripts\/deploy-public-pages\.mjs/);
  assert.match(workflow, /name: Test website/);
});

test('defines the durable website documentation model and product boundary', () => {
  for (const document of [
    'README.md',
    'PRODUCT.md',
    'ARCHITECTURE.md',
    'CONTRIBUTING.md',
    'RELEASE.md',
    'AGENTS.md',
    '.github/pull_request_template.md',
  ]) {
    assert.ok(exists(document), `missing workflow document: ${document}`);
  }
  assert.match(readme, /\[PRODUCT\.md\]\(PRODUCT\.md\)/);
  assert.match(readme, /\[ARCHITECTURE\.md\]\(ARCHITECTURE\.md\)/);
  assert.match(readme, /\[CONTRIBUTING\.md\]\(CONTRIBUTING\.md\)/);
  assert.match(readme, /\[RELEASE\.md\]\(RELEASE\.md\)/);
  for (const copy of [
    'Eye O Ewe',
    'Split bills with friends, privately\\.',
    'Free and ad-free',
  ]) {
    assert.match(product, new RegExp(copy));
  }
  assert.match(product, /no navigation/);
  assert.match(product, /signup, feature lists, icon rows, stock photos,\s+testimonials/);
  assert.match(product, /analytics or\s+tracking/);
  assert.match(architecture, /static website/);
  assert.match(architecture, /All deployable source lives under\s+`public\/`/);
  assert.match(architecture, /no framework or application build system/);
  assert.match(architecture, /no backend, account data, or tracking, and no runtime\s+application code beyond page scripts/);
});

test('documents the fetched origin/main task-base and reconciliation rule', () => {
  assert.match(contributing, /git fetch origin/);
  assert.match(contributing, /git rev-parse --verify refs\/remotes\/origin\/main/);
  assert.match(contributing, /git worktree add -b codex\/\<short-slug\>/);
  assert.match(contributing, /Never start from local `main`/);
  assert.match(contributing, /If the fetch or\s+the `origin\/main` resolution fails, stop/);
  assert.match(contributing, /rebase an unpublished branch onto the new `origin\/main`/);
  assert.match(contributing, /Do not force-push without separate owner approval/);
  assert.match(contributing, /PR branch must be up to date with\s+protected `main`/);
  assert.match(agents, /Before creating a task branch or worktree, fetch `origin`/);
  assert.match(agents, /Never use local `main`\s+as a substitute/);
  assert.match(agents, /If `origin\/main` cannot be read, stop/);
});

test('documents automatic Pages publication, guarded manual recovery, and evidence boundaries', () => {
  assert.match(release, /automatically\s+deploys the production site when `main` changes/);
  assert.match(release, /Merge to `main`[\s\S]*triggers the Pages production deployment/);
  assert.match(release, /authorization for the public release/);
  assert.match(release, /no second post-merge production approval/);
  assert.match(release, /manual Wrangler production helper as a routine second release step/);
  assert.match(release, /git ls-remote/);
  assert.match(release, /dedicated clean release\s+checkout/);
  assert.match(release, /https:\/\/eyeoewe\.app\//);
  assert.match(release, /security headers defined in `public\/_headers`/);
  assert.match(release, /reserved `\/eyeoewe\/v1\/\.\.\.` route/);
  assert.match(architecture, /manual Wrangler helper is retained for recovery/);
  assert.match(architecture, /not an equivalent normal release\s+path/);
  assert.doesNotMatch(readme, /following actions require separate, explicit owner approval/);
});

test('keeps the PR template and local tooling boundary lightweight', () => {
  for (const heading of ['Summary', 'Scope and safety', 'Verification', 'Review']) {
    assert.match(pullRequestTemplate, new RegExp(`^## ${heading}$`, 'm'));
  }
  for (const field of ['Linked issue', 'Outcome', 'Task base SHA', 'Local tests', 'Browser or visual review', 'Hosted or deployment boundary', 'Unavailable checks', 'Exact reviewed commit', 'Findings or blockers']) {
    assert.match(pullRequestTemplate, new RegExp(`- ${field}:`));
  }
  assert.match(gitignore, /^\.wrangler\/$/m);
});
