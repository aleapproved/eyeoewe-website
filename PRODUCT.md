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
one page for every invitation. It shows the brand header and `You’ve been
invited to a group on Eye O Ewe`. What follows depends on the visitor:

- Android browsers that can open another app from a link: one full-width
  `Join the group` button, and under it `Don’t have the app yet? Install Eye O
  Ewe, then come back to this page and tap Join the group.` The button hands the
  invitation to the app with an `intent:` URL naming the app's package; without
  the app, it goes to the store link.
- Android in-app browsers built on WebView, which can't do that: no button, and
  `To join, open this page in your browser. Don’t have the app yet? Install Eye
  O Ewe first.`, with `Install Eye O Ewe` as the store link.
- Android pages without a well-formed invitation, and visitors without the
  script: no button, and `Install Eye O Ewe, then tap your invitation link
  again.`
- Phones with no store link for the app: no button, and
  `Eye O Ewe isn’t on iPhone yet.` Once the app is there, giving that
  platform a store link in the script makes it show the line above instead.
- Computers: no button, and `Open this invitation on your phone.`

`Install Eye O Ewe` links to the store for the visitor's platform; on Android
that is the same Play link as the homepage's.

The secret, the part after `#`, never reaches the server. The page's one
script (`public/open-invitation.js`) reads it from the address and puts it only
into that button's link; it stores nothing and sends nothing. The page has no
redirect, analytics, or third-party content, and `Referrer-Policy: no-referrer`
applies.
