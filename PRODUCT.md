# Eye O Ewe website product contract

## Public boundary

The product name is **Eye O Ewe**. The homepage is short, one or two phone
screens, centred, in this order:

- `Split bills with friends, privately.`
- `End-to-end encrypted.`, with `Only your group can see your expenses.`
- `Free to start. Ad-free forever.`, with
  `Unlimited expenses in one group. Go Pro for more.`
- Google's official `Get it on Google Play` badge, used as Google's badge
  guidelines require, linking to the Google Play internal testing opt-in so
  invited testers can install the app.
- Two screens of the real app side by side, with no captions and made-up
  names and amounts: a group's main page, with its balance and recent expenses,
  and adding an expense. The page shows the light or the dark screens for the
  theme in force.
- `Get in touch at hello@eyeoewe.app`, with quiet `Privacy` and `Support`
  links under it.

The whole site, the invitation page too, follows the phone's light or dark
setting. A small toggle in the header overrides it and remembers the choice on
that device.

Apart from those two links, the homepage has no navigation,
signup, feature lists, icon rows, stock photos, testimonials, analytics or
tracking.

Document metadata may restate approved product positioning, but it does not
authorise additional visible marketing copy. Adding public claims, pages,
collection mechanisms, or product surfaces requires a separate product-owner
decision.

## Public pages

Three reading pages share the homepage's header and closing lines:

- `/privacy/`: the privacy policy.
- `/support/`: how to get help, and common questions.
- `/delete-account/`: how to delete an account, in the app or by email, and
  what is deleted and kept, as Google Play requires.

They state what Eye O Ewe does once it is open to people the owner doesn't
know. Their wording changes only with the product owner's decision, and they
carry no forms, scripts other than the theme script, or third-party content.

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

The secret, the part after `#`, never reaches the server. The invitation
script (`public/open-invitation.js`) reads it from the address and puts it only
into that button's link; it stores nothing and sends nothing. The theme script
stores only the light or dark choice. The page has no
redirect, analytics, or third-party content, and `Referrer-Policy: no-referrer`
applies.
