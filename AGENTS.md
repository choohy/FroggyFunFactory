# Froggy Fun Factory

A static single-page app (Vite + React + React Router, `HashRouter`) deployed to GitHub Pages, backed
by Firebase (Firestore for data, Firebase Authentication for sign-in). There is no backend server —
all reads/writes go directly from the browser to Firestore, and access control is enforced entirely
by `firestore.rules`, not by any server-side code.

Key things to know before making changes:

- **Data layer**: `src/lib/{venues,vendors,contacts}.ts` wrap all Firestore reads/writes. Don't call
  the Firestore SDK directly from components — go through these modules.
- **Auth**: `src/contexts/AuthContext.tsx` + `src/contexts/useAuth.ts` provide the signed-in user.
  `src/components/RequireAuth.tsx` gates page *content* (not the nav/shell) behind sign-in and the
  email allowlist.
- **Permissions live in two places that must stay in sync**: `src/lib/allowlist.ts` (UI-only) and
  `firestore.rules` (actual enforcement). See README.md's Security section before changing either.
- **Routing**: `HashRouter` is intentional — GitHub Pages serves static files with no server-side
  rewrites, so hash-based routes (`/#/venues/abc`) are the simplest way to support client-side routes
  without a 404.html redirect hack.
- **Testing**: `tests/e2e/` runs Playwright against a Vite build connected to the Firebase Local
  Emulator Suite, not a real Firebase project. See README.md's Testing section.
