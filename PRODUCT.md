# Eye O Ewe website product contract

## Public boundary

The product name is **Eye O Ewe**. The website is intentionally a sparse
coming-soon landing page for the product.

The current visible copy is:

- `Eye O Ewe`
- `Shared expenses, made simple.`
- `Simple. Free. Encrypted.`
- `Invite-only for now.`
- `Install from Google Play`, a plain text link to the Google Play internal testing
  opt-in, so invited testers can install the app.

The homepage has no navigation. It currently has no policy, legal, support, or
account-deletion content, and no links to those pages.

The homepage also has no:

- signup;
- store badge artwork;
- screenshots;
- feature grid;
- analytics or tracking;
- dark mode or theme toggle; or
- additional marketing sections.

The strings above are the complete current visible/on-page messaging
boundary for the homepage. Document metadata may restate approved product positioning, but it
does not authorise additional visible marketing copy. Adding public claims,
pages, collection mechanisms, or product surfaces requires a separate
product-owner decision.

## Invitation page

`/join/*` (an invitation link, `https://eyeoewe.app/join/<secret>`) serves one
page for every secret. It shows the brand header, `You’ve been invited to a
group on Eye O Ewe`, the same `Install from Google Play` link, and `Once it’s
installed, tap your invitation link again to join.` It has no script,
redirect, analytics, or third-party content, and the secret is never read,
stored, or sent anywhere (`Referrer-Policy: no-referrer` applies).
