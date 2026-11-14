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

`/join/*` (an invitation link, `https://eyeoewe.app/join/<id>#<secret>`) serves
one page for every invitation. It shows the brand header, `You’ve been invited
to a group on Eye O Ewe`, the same `Install from Google Play` link, and `Once
it’s installed, tap your invitation link again to join.`

On Android, when the address holds a well-formed invitation, the page also
shows an `Open invitation` button beside the install link, and the line under
them reads `Once it’s installed, come back here and tap Open invitation.` The
button hands the same link to the app with an `intent:` URL naming the app's
package; without the app, it goes where the install link goes.

The secret, the part after `#`, never reaches the server. The page's one
script (`public/open-invitation.js`) reads it from the address and puts it only
into that button's link; it stores nothing and sends nothing, and the page's
`connect-src 'none'` blocks any request. The page has no redirect, analytics,
or third-party content, and `Referrer-Policy: no-referrer` applies.
