# Froggy Fun Factory

Plain HTML/CSS/JS app (no build step, no framework) backed by Firebase
(Firestore + Authentication). Deployed as a static site via GitHub Pages.

- `index.html` — page shell (login screen, nav, view container)
- `app.js` — all logic: Firebase init, auth, hash-based router, Firestore
  CRUD, view rendering
- `styles.css` — all styling

There is no `npm install` / build step — open `index.html` directly (ideally
via a local static server, e.g. VS Code's Live Server) to run it.
