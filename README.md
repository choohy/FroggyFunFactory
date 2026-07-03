# Froggy Fun Factory

An event management app for tracking contacts, venues, and vendor details.

- **Contacts** — people you work with for events (name, role, email, phone, notes), optionally linked to a venue or vendor.
- **Venues** — locations (address, capacity, cost notes), each with a list of linked contacts.
- **Vendors** — caterers, photographers, decorators, etc. (service type, pricing notes), each with a list of linked contacts.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Prisma](https://www.prisma.io) + SQLite for persistence
- [Tailwind CSS](https://tailwindcss.com) for styling

## Getting started

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database file lives at `prisma/dev.db` and is not committed to version control.

## Testing

End-to-end tests use [Playwright](https://playwright.dev) and live in `tests/e2e/`. They run against
a real build of the app backed by a disposable SQLite database (`prisma/test.db`, separate from your
dev database), so they never touch data from `npm run dev`.

```bash
npx playwright install --with-deps chromium   # first time only
npm run test:e2e                              # headless run
npm run test:e2e:ui                           # interactive UI mode, for debugging
```

`npm run test:e2e` automatically resets the test database, builds the app, and starts it on port
3100 before running the tests (see `playwright.config.ts` and the `test:e2e:*` scripts in
`package.json`).

These tests also run automatically in CI on every pull request (`.github/workflows/e2e.yml`), so a
PR that breaks an existing feature will fail its checks before it can be merged.

### Adding tests for new features

- Each entity (contacts, venues, vendors) has its own spec file in `tests/e2e/`. Add new cases to the
  matching file, or create a new one for a new entity/section.
- Reuse the helpers in `tests/e2e/helpers.ts` (`createVenueViaUI`, `createVendorViaUI`,
  `createContactViaUI`, `uniqueName`, ...) to set up data through the actual UI rather than the
  database directly — this keeps tests honest about what a user can actually do, and extend them when
  a form gains new fields.
- Use `uniqueName(...)` for anything you create so tests can run repeatedly and in any order without
  colliding with leftover or parallel data.
- Prefer one full CRUD lifecycle test per entity plus focused tests for each distinct feature (a
  filter, a toggle, a validation rule) rather than one giant end-to-end test — it's easier to see what
  broke when something fails.
