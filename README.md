# Froggy Fun Factory

An event management app for tracking contacts, venues, and vendor details.

- **Contacts** — people you work with for events (name, role, email, phone, notes), optionally linked to a venue or vendor.
- **Venues** — locations (address, capacity, cost notes), each with a list of linked contacts.
- **Vendors** — caterers, photographers, decorators, etc. (service type, pricing notes), each with a list of linked contacts.

## Stack

- Plain HTML, CSS, and JavaScript — no build tools, no framework
- [Firebase](https://firebase.google.com) Authentication (email/password) for login
- [Firestore](https://firebase.google.com/docs/firestore) for data storage
- Hosted for free on [GitHub Pages](https://pages.github.com)

## Setup

Full step-by-step instructions (creating the Firebase project, security rules,
publishing to GitHub Pages) are in the implementation guide provided alongside
this project. In short:

1. Create a Firebase project with Firestore + Email/Password Authentication enabled.
2. Paste your `firebaseConfig` into the top of `app.js`.
3. Lock down Firestore with security rules scoped to your user UID.
4. Open `index.html` locally (e.g. via VS Code's "Live Server" extension) to test.
5. Push to GitHub and enable GitHub Pages (Settings → Pages → Deploy from branch → `main` → `/ (root)`).

## Files

- `index.html` — page shell (login screen, nav bar, view container)
- `app.js` — Firebase init, auth, hash-based router, Firestore CRUD, and all view rendering
- `styles.css` — all styling

## Backing up your data

Use the **Export data** button in the nav bar to download all contacts, venues,
and vendors as a JSON file. The free Firebase plan has no automatic backups, so
it's worth doing this periodically.
