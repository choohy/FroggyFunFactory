# Froggy Fun Factory

A single-page app for tracking event management contacts, venues, and vendor details — a static
site hosted on GitHub Pages, backed by Firebase (Firestore + Authentication). There is no backend
server: the browser talks to Firestore directly, and access control is enforced entirely by
Firestore's own security rules.

- **Contacts** — people you work with for events, optionally linked to a venue or vendor.
- **Venues** — locations with capacity, cost, a "why book this venue" pitch, tagged features, and a
  favorite toggle. Searchable by location, max cost, min capacity, and features.
- **Vendors** — caterers, photographers, decorators, etc.

## Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript, built as a static single-page app
- [React Router](https://reactrouter.com) in `HashRouter` mode (GitHub Pages has no server-side
  rewrites, so hash routes like `/#/venues/abc123` avoid needing a 404.html redirect trick)
- [Firebase](https://firebase.google.com): Firestore for data, Authentication (Google sign-in) for
  access control
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Playwright](https://playwright.dev) against the [Firebase Local Emulator
  Suite](https://firebase.google.com/docs/emulator-suite) for end-to-end tests

## Security model — who can see and edit data

**This matters more than usual because the site is public.** GitHub Pages serves static files to
anyone with the URL, and the Firebase config embedded in the JS bundle is not a secret (that's normal
for Firebase web apps). So the *only* thing standing between a random visitor and your data is
Firestore's security rules (`firestore.rules`) — not GitHub Pages, not "security through obscurity."

The app uses a **two-layer allowlist**, and both layers must be kept in sync manually:

1. **`src/lib/allowlist.ts`** — a list of allowed emails, used only to control what the *UI* shows
   (a clean "sign in" or "not authorized" message instead of a wall of permission-denied errors).
   Editing this file alone does **not** change who can actually read or write data.
2. **`firestore.rules`** — the real enforcement. Every read and write to `venues`, `vendors`, and
   `contacts` requires `request.auth.token.email` to be in the hardcoded `ALLOWED_EMAILS`-equivalent
   list inside this file. This is checked by Firestore itself, server-side, regardless of what the
   client sends — a signed-in-but-unlisted user, or someone hitting the Firestore REST API directly
   with devtools open, gets a `403` either way.

**To add or remove someone's access**, edit the email list in *both* files and redeploy:

```bash
# 1. Edit the ALLOWED_EMAILS array in src/lib/allowlist.ts
# 2. Edit the matching list inside isAllowedUser() in firestore.rules
# 3. Deploy the updated rules (this is the step that actually changes access):
firebase deploy --only firestore:rules
```

Pushing a UI change to GitHub Pages does **not** deploy Firestore rules — that's a separate,
manual `firebase deploy` step. If you change the allowlist and forget this step, the old rules
(and old access list) stay in effect.

Beyond the allowlist, `firestore.rules` also requires every `venues`/`vendors`/`contacts` document
to have a non-empty `name` field on create/update, as basic defense-in-depth against a buggy client
write — not a substitute for the allowlist check.

If your usage grows past a handful of hardcoded emails, consider moving the allowlist into a
Firestore collection (e.g. `admins/{email}`) that rules check via `exists()`, so you can manage it
without redeploying rules — that's a natural next step, not implemented here to keep the security
model easy to audit at a glance.

## Local development

### 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com), create a project (the free
   Spark plan is enough for this app).
2. **Build > Firestore Database > Create database** — start in production mode (rules are deployed
   separately, see below).
3. **Build > Authentication > Sign-in method > Google** — enable it.
4. **Project settings > General > Your apps > Add app > Web** — register an app and copy the config
   values shown (`apiKey`, `authDomain`, etc.).

### 2. Configure the app

```bash
npm install
cp .env.example .env
# paste the config values from step 1.4 into .env
```

Add your own email to `ALLOWED_EMAILS` in `src/lib/allowlist.ts` **and** to the matching list in
`firestore.rules` (see Security model above).

### 3. Deploy security rules

```bash
npx firebase login
npx firebase use --add        # pick the project you created
npx firebase deploy --only firestore:rules
```

### 4. Run it

```bash
npm run dev
```

Open the printed localhost URL and sign in with Google using your allowlisted email.

## Testing

End-to-end tests run against a real Vite build connected to the **Firebase Local Emulator Suite**
(not your real Firebase project, and not the real Google OAuth flow — sign-in in tests uses
email/password against the Auth emulator, gated behind a `VITE_USE_FIREBASE_EMULATOR` flag that is
never set in production builds). This means tests never touch real data and don't need real Firebase
credentials.

```bash
npx playwright install --with-deps chromium   # first time only
npm run test:e2e                              # headless run — starts emulators + app automatically
npm run test:e2e:ui                           # interactive UI mode, for debugging
```

`tests/e2e/firestore-rules.spec.ts` is worth reading first — it tests `firestore.rules` directly via
raw REST calls (bypassing the app's UI entirely) to prove the *database* rejects unauthorized reads
and writes, not just that the UI hides a button.

These tests also run in CI on every pull request (`.github/workflows/ci.yml`), so a PR that breaks
CRUD, linking, filtering, or the permission checks will fail before it can be merged.

### Adding tests for new features

- Add cases to the matching spec file in `tests/e2e/`, or create a new one for a new entity/section.
- Use `tests/e2e/fixtures.ts`'s `test`/`expect` (not the ones from `@playwright/test` directly) for
  anything that needs to be signed in — it auto-signs-in as an allowlisted test user first.
- Reuse `tests/e2e/helpers/data.ts` (`createVenueViaUI`, `createVendorViaUI`, `createContactViaUI`,
  `uniqueName`) to set up data through the actual UI, and extend them when a form gains new fields.
- If a feature has security implications (a new collection, a new field only certain users should
  write), add a case to `firestore-rules.spec.ts` too.

## Deploying to GitHub Pages

1. **Settings > Pages > Source: GitHub Actions** (one-time repo setting).
2. **Settings > Secrets and variables > Actions**, add the same values from your `.env` as repository
   secrets: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
   (These aren't sensitive — see Security model above — but secrets are the simplest way to inject
   them at build time.)
3. **Firebase Console > Authentication > Settings > Authorized domains**, add
   `<your-github-username>.github.io` so Google sign-in works from the deployed site.
4. Push to `master`. `.github/workflows/deploy.yml` builds the app and publishes it to GitHub Pages.
5. Remember: pushing does **not** deploy Firestore rules changes — see Security model above.
