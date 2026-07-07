// ---------------------------------------------------------------------------
// Firebase setup
// ---------------------------------------------------------------------------
// PASTE YOUR firebaseConfig HERE (Firebase console → Project settings → your
// web app). See Part 4.5 of the implementation guide.
const firebaseConfig = {
  apiKey: "PASTE-YOUR-API-KEY-HERE",
  authDomain: "PASTE-YOUR-PROJECT.firebaseapp.com",
  projectId: "PASTE-YOUR-PROJECT-ID",
  storageBucket: "PASTE-YOUR-PROJECT.appspot.com",
  messagingSenderId: "PASTE-YOUR-SENDER-ID",
  appId: "PASTE-YOUR-APP-ID",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const VENUES = collection(db, "venues");
const VENDORS = collection(db, "vendors");
const CONTACTS = collection(db, "contacts");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const VENUE_FEATURES = [
  "Parking",
  "Outdoor Space",
  "Catering Kitchen",
  "Wheelchair Accessible",
  "WiFi",
  "AV Equipment",
  "Dance Floor",
  "Bar",
  "Bridal Suite",
  "Overnight Accommodation",
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function dash(value) {
  return value === null || value === undefined || value === "" ? "—" : escapeHtml(value);
}

function formatCurrency(n) {
  return n === null || n === undefined
    ? null
    : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function qs(id) {
  return document.getElementById(id);
}

// ---------------------------------------------------------------------------
// Data layer (Firestore)
// ---------------------------------------------------------------------------
async function fetchAll(colRef) {
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchOne(colRef, id) {
  const snap = await getDoc(doc(colRef, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

const Venues = {
  list: () => fetchAll(VENUES),
  get: (id) => fetchOne(VENUES, id),
  create: (data) =>
    addDoc(VENUES, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
  update: (id, data) =>
    updateDoc(doc(VENUES, id), { ...data, updatedAt: serverTimestamp() }),
  remove: async (id) => {
    await deleteDoc(doc(VENUES, id));
    const linked = await fetchAll(CONTACTS);
    await Promise.all(
      linked
        .filter((c) => c.venueId === id)
        .map((c) => updateDoc(doc(CONTACTS, c.id), { venueId: null }))
    );
  },
};

const Vendors = {
  list: () => fetchAll(VENDORS),
  get: (id) => fetchOne(VENDORS, id),
  create: (data) =>
    addDoc(VENDORS, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
  update: (id, data) =>
    updateDoc(doc(VENDORS, id), { ...data, updatedAt: serverTimestamp() }),
  remove: async (id) => {
    await deleteDoc(doc(VENDORS, id));
    const linked = await fetchAll(CONTACTS);
    await Promise.all(
      linked
        .filter((c) => c.vendorId === id)
        .map((c) => updateDoc(doc(CONTACTS, c.id), { vendorId: null }))
    );
  },
};

const Contacts = {
  list: () => fetchAll(CONTACTS),
  get: (id) => fetchOne(CONTACTS, id),
  create: (data) =>
    addDoc(CONTACTS, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
  update: (id, data) =>
    updateDoc(doc(CONTACTS, id), { ...data, updatedAt: serverTimestamp() }),
  remove: (id) => deleteDoc(doc(CONTACTS, id)),
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
function parseHash() {
  const raw = window.location.hash.slice(1) || "/";
  const [path, queryString] = raw.split("?");
  return { path: path || "/", params: new URLSearchParams(queryString || "") };
}

function navigate(path) {
  window.location.hash = path;
}

async function router() {
  if (!auth.currentUser) return;
  const { path, params } = parseHash();
  const view = qs("app-view");
  highlightNav(path);

  const segments = path.split("/").filter(Boolean);

  try {
    if (segments.length === 0) {
      await renderDashboard(view);
    } else if (segments[0] === "venues") {
      if (segments.length === 1) await renderVenuesList(view, params);
      else if (segments[1] === "new") await renderVenueForm(view, null);
      else if (segments[2] === "edit") await renderVenueForm(view, segments[1]);
      else await renderVenueDetail(view, segments[1]);
    } else if (segments[0] === "vendors") {
      if (segments.length === 1) await renderVendorsList(view);
      else if (segments[1] === "new") await renderVendorForm(view, null);
      else if (segments[2] === "edit") await renderVendorForm(view, segments[1]);
      else await renderVendorDetail(view, segments[1]);
    } else if (segments[0] === "contacts") {
      if (segments.length === 1) await renderContactsList(view);
      else if (segments[1] === "new") await renderContactForm(view, null, params);
      else if (segments[2] === "edit") await renderContactForm(view, segments[1], params);
      else await renderContactDetail(view, segments[1]);
    } else {
      view.innerHTML = `<div class="card"><p class="empty-state">Page not found.</p></div>`;
    }
  } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="error-box">Something went wrong: ${escapeHtml(err.message)}</div>`;
  }
}

function highlightNav(path) {
  const top = "/" + (path.split("/").filter(Boolean)[0] || "");
  document.querySelectorAll("#main-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === top);
  });
}

window.addEventListener("hashchange", router);

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
async function renderDashboard(view) {
  view.innerHTML = `<div class="spinner-wrap" style="min-height:200px;">Loading…</div>`;
  const [venues, vendors, contacts] = await Promise.all([
    Venues.list(),
    Vendors.list(),
    Contacts.list(),
  ]);

  const recent = [...contacts]
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
    .slice(0, 5);

  const venueById = Object.fromEntries(venues.map((v) => [v.id, v]));
  const vendorById = Object.fromEntries(vendors.map((v) => [v.id, v]));

  view.innerHTML = `
    <div class="flex-col">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Track event management contacts, venues, and vendor details.</p>
      </div>
      <div class="grid-3">
        <a href="#/contacts" class="stat-card">
          <div class="stat-top"><span class="stat-emoji">👤</span><span class="stat-count">${contacts.length}</span></div>
          <div class="stat-label">Contacts</div>
        </a>
        <a href="#/venues" class="stat-card">
          <div class="stat-top"><span class="stat-emoji">🏛️</span><span class="stat-count">${venues.length}</span></div>
          <div class="stat-label">Venues</div>
        </a>
        <a href="#/vendors" class="stat-card">
          <div class="stat-top"><span class="stat-emoji">🧾</span><span class="stat-count">${vendors.length}</span></div>
          <div class="stat-label">Vendors</div>
        </a>
      </div>
      <div class="card">
        <h2 style="font-weight:500;margin:0 0 0.75rem;">Recently added contacts</h2>
        ${
          recent.length === 0
            ? `<p class="empty-state">No contacts yet. <a href="#/contacts" style="color:var(--emerald);">Add your first contact</a>.</p>`
            : recent
                .map((c) => {
                  const linked = c.venueId
                    ? venueById[c.venueId]?.name
                    : c.vendorId
                    ? vendorById[c.vendorId]?.name
                    : c.role || "—";
                  return `<div class="list-row">
                    <a href="#/contacts/${c.id}" style="font-weight:500;">${escapeHtml(c.name)}</a>
                    <span style="color:var(--text-muted);">${escapeHtml(linked || "—")}</span>
                  </div>`;
                })
                .join("")
        }
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------
async function renderVenuesList(view, params) {
  view.innerHTML = `<div class="spinner-wrap" style="min-height:200px;">Loading…</div>`;
  const location = (params.get("location") || "").trim();
  const maxCost = (params.get("maxCost") || "").trim();
  const minCapacity = (params.get("minCapacity") || "").trim();
  const selectedFeatures = params.getAll("features").flatMap((f) => f.split(","));

  let venues = await Venues.list();

  if (location) {
    venues = venues.filter((v) => (v.address || "").toLowerCase().includes(location.toLowerCase()));
  }
  if (maxCost && !Number.isNaN(Number(maxCost))) {
    venues = venues.filter((v) => v.cost != null && v.cost <= Number(maxCost));
  }
  if (minCapacity && !Number.isNaN(Number(minCapacity))) {
    venues = venues.filter((v) => v.capacity != null && v.capacity >= Number(minCapacity));
  }
  if (selectedFeatures.length > 0) {
    venues = venues.filter((v) =>
      selectedFeatures.every((f) => (v.features || []).includes(f))
    );
  }

  venues.sort((a, b) => {
    if (Boolean(a.isFavorite) !== Boolean(b.isFavorite)) return a.isFavorite ? -1 : 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  const contacts = await Contacts.list();
  const contactCountByVenue = {};
  contacts.forEach((c) => {
    if (c.venueId) contactCountByVenue[c.venueId] = (contactCountByVenue[c.venueId] || 0) + 1;
  });

  const hasFilters = Boolean(location || maxCost || minCapacity || selectedFeatures.length);

  view.innerHTML = `
    <div class="flex-col">
      <div class="page-header">
        <div>
          <h1 class="page-title">Venues</h1>
          <p class="page-subtitle">Locations you're considering or have booked for events.</p>
        </div>
        <a href="#/venues/new" class="btn btn-primary">+ Add Venue</a>
      </div>

      <form id="venue-filter-form" class="card flex-col" style="gap:1rem;">
        <div class="field-row" style="grid-template-columns:repeat(3,1fr);">
          <div class="field">
            <label class="field-label">Location contains</label>
            <input class="input" type="text" name="location" value="${escapeHtml(location)}" placeholder="Springfield" />
          </div>
          <div class="field">
            <label class="field-label">Max cost ($)</label>
            <input class="input" type="number" min="0" name="maxCost" value="${escapeHtml(maxCost)}" placeholder="5000" />
          </div>
          <div class="field">
            <label class="field-label">Min capacity</label>
            <input class="input" type="number" min="0" name="minCapacity" value="${escapeHtml(minCapacity)}" placeholder="100" />
          </div>
        </div>
        <div class="field">
          <label class="field-label">Features</label>
          <div class="checkbox-grid">
            ${VENUE_FEATURES.map(
              (f) => `<label class="checkbox-item">
                <input type="checkbox" name="features" value="${escapeHtml(f)}" ${
                selectedFeatures.includes(f) ? "checked" : ""
              } /> ${escapeHtml(f)}
              </label>`
            ).join("")}
          </div>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn btn-primary">Apply filters</button>
          ${hasFilters ? `<a href="#/venues" class="btn btn-secondary">Clear</a>` : ""}
        </div>
      </form>

      ${
        venues.length === 0
          ? `<div class="card"><p class="empty-state">${
              hasFilters ? "No venues match these filters." : "No venues yet. Add your first one to get started."
            }</p></div>`
          : `<div class="grid-2">
              ${venues
                .map((v) => {
                  const features = v.features || [];
                  const costStr = formatCurrency(v.cost);
                  return `<a href="#/venues/${v.id}" class="card card-link">
                    <div class="page-header" style="align-items:flex-start;">
                      <h2 style="font-weight:500;margin:0;">${escapeHtml(v.name)}</h2>
                      <div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0;">
                        ${v.capacity ? `<span class="chip">Capacity ${v.capacity}</span>` : ""}
                        <button type="button" class="fav-btn sm ${v.isFavorite ? "active" : "inactive"}" data-fav-toggle="${v.id}" data-fav-current="${v.isFavorite ? "1" : "0"}" title="${v.isFavorite ? "Remove from favorites" : "Add to favorites"}">${v.isFavorite ? "♥" : "♡"}</button>
                      </div>
                    </div>
                    ${v.address ? `<p style="font-size:0.875rem;color:var(--text-muted);margin:0.25rem 0 0;">${escapeHtml(v.address)}</p>` : ""}
                    ${costStr ? `<p style="font-size:0.875rem;color:var(--text-muted);margin:0.25rem 0 0;">$${costStr}</p>` : ""}
                    ${v.pitch ? `<p style="font-size:0.875rem;color:var(--text);margin:0.5rem 0 0;">${escapeHtml(v.pitch)}</p>` : ""}
                    ${
                      features.length
                        ? `<div class="chip-row" style="margin-top:0.75rem;">${features
                            .map((f) => `<span class="chip-emerald">${escapeHtml(f)}</span>`)
                            .join("")}</div>`
                        : ""
                    }
                    <p style="font-size:0.75rem;color:var(--text-faint);margin:0.75rem 0 0;">${
                      contactCountByVenue[v.id] || 0
                    } linked contact${(contactCountByVenue[v.id] || 0) === 1 ? "" : "s"}</p>
                  </a>`;
                })
                .join("")}
            </div>`
      }
    </div>
  `;

  qs("venue-filter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const p = new URLSearchParams();
    if (fd.get("location")) p.set("location", fd.get("location"));
    if (fd.get("maxCost")) p.set("maxCost", fd.get("maxCost"));
    if (fd.get("minCapacity")) p.set("minCapacity", fd.get("minCapacity"));
    fd.getAll("features").forEach((f) => p.append("features", f));
    navigate(`/venues?${p.toString()}`);
  });

  view.querySelectorAll("[data-fav-toggle]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.favToggle;
      const next = btn.dataset.favCurrent !== "1";
      btn.classList.toggle("active", next);
      btn.classList.toggle("inactive", !next);
      btn.textContent = next ? "♥" : "♡";
      btn.dataset.favCurrent = next ? "1" : "0";
      try {
        await Venues.update(id, { isFavorite: next });
      } catch (err) {
        console.error(err);
      }
    });
  });
}

async function renderVenueDetail(view, id) {
  view.innerHTML = `<div class="spinner-wrap" style="min-height:200px;">Loading…</div>`;
  const venue = await Venues.get(id);
  if (!venue) {
    view.innerHTML = `<div class="card"><p class="empty-state">Venue not found.</p></div>`;
    return;
  }
  const allContacts = await Contacts.list();
  const linkedContacts = allContacts.filter((c) => c.venueId === id);
  const features = venue.features || [];

  view.innerHTML = `
    <div class="flex-col">
      <div><a href="#/venues" class="back-link">← All venues</a></div>
      <div class="page-header" style="align-items:flex-start;">
        <div style="display:flex;align-items:flex-start;gap:0.75rem;">
          <button type="button" id="fav-toggle" class="fav-btn md ${venue.isFavorite ? "active" : "inactive"}" data-current="${venue.isFavorite ? "1" : "0"}">${venue.isFavorite ? "♥" : "♡"}</button>
          <div>
            <h1 class="page-title">${escapeHtml(venue.name)}</h1>
            ${venue.address ? `<p class="page-subtitle">${escapeHtml(venue.address)}</p>` : ""}
          </div>
        </div>
        <div class="btn-row" style="margin-top:0;">
          <a href="#/venues/${venue.id}/edit" class="btn btn-secondary">Edit</a>
          <button type="button" class="btn btn-danger" id="delete-btn">Delete</button>
        </div>
      </div>

      ${
        venue.pitch
          ? `<div class="card"><h2 style="font-weight:500;margin:0 0 0.5rem;">Why book this venue</h2><p style="font-size:0.875rem;color:var(--text);margin:0;">${escapeHtml(venue.pitch)}</p></div>`
          : ""
      }

      <div class="card">
        <dl class="detail-grid">
          <div><dt>Capacity</dt><dd>${dash(venue.capacity)}</dd></div>
          <div><dt>Estimated cost</dt><dd>${venue.cost != null ? "$" + formatCurrency(venue.cost) : "—"}</dd></div>
          <div class="span-2"><dt>Cost notes</dt><dd>${dash(venue.costNotes)}</dd></div>
          <div class="span-2">
            <dt>Features</dt>
            <dd>${features.length ? `<div class="chip-row">${features.map((f) => `<span class="chip-emerald">${escapeHtml(f)}</span>`).join("")}</div>` : "—"}</dd>
          </div>
          <div class="span-2"><dt>Notes</dt><dd>${dash(venue.notes)}</dd></div>
        </dl>
      </div>

      <div class="card">
        <div class="page-header">
          <h2 style="font-weight:500;margin:0;">Linked contacts</h2>
          <a href="#/contacts/new?venueId=${venue.id}" style="font-size:0.875rem;color:var(--emerald);">+ Add contact</a>
        </div>
        ${
          linkedContacts.length === 0
            ? `<p class="empty-state">No contacts linked yet.</p>`
            : linkedContacts
                .map(
                  (c) => `<div class="list-row">
                    <a href="#/contacts/${c.id}" style="font-weight:500;">${escapeHtml(c.name)}</a>
                    <span style="color:var(--text-muted);">${escapeHtml(c.role || c.email || c.phone || "")}</span>
                  </div>`
                )
                .join("")
        }
      </div>
    </div>
  `;

  qs("fav-toggle").addEventListener("click", async () => {
    const btn = qs("fav-toggle");
    const next = btn.dataset.current !== "1";
    btn.classList.toggle("active", next);
    btn.classList.toggle("inactive", !next);
    btn.textContent = next ? "♥" : "♡";
    btn.dataset.current = next ? "1" : "0";
    await Venues.update(id, { isFavorite: next });
  });

  qs("delete-btn").addEventListener("click", async () => {
    if (!confirm(`Delete ${venue.name}? This will unlink any associated contacts.`)) return;
    await Venues.remove(id);
    navigate("/venues");
  });
}

async function renderVenueForm(view, id) {
  view.innerHTML = `<div class="spinner-wrap" style="min-height:200px;">Loading…</div>`;
  const venue = id ? await Venues.get(id) : null;
  if (id && !venue) {
    view.innerHTML = `<div class="card"><p class="empty-state">Venue not found.</p></div>`;
    return;
  }
  const features = venue?.features || [];

  view.innerHTML = `
    <div class="flex-col">
      <h1 class="page-title">${venue ? "Edit venue" : "Add venue"}</h1>
      <form id="venue-form" class="form">
        <div id="form-error" class="error-box hidden"></div>
        <div class="field">
          <label class="field-label">Name *</label>
          <input class="input" name="name" value="${escapeHtml(venue?.name ?? "")}" placeholder="e.g. The Grand Hall" required />
        </div>
        <div class="field">
          <label class="field-label">Address</label>
          <input class="input" name="address" value="${escapeHtml(venue?.address ?? "")}" placeholder="123 Main St, Springfield" />
        </div>
        <div class="field">
          <label class="field-label">Why book this venue?</label>
          <textarea class="input" name="pitch" rows="3" placeholder="What makes this venue stand out for events...">${escapeHtml(venue?.pitch ?? "")}</textarea>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Capacity</label>
            <input class="input" type="number" min="0" name="capacity" value="${venue?.capacity ?? ""}" placeholder="150" />
          </div>
          <div class="field">
            <label class="field-label">Estimated cost ($)</label>
            <input class="input" type="number" min="0" step="0.01" name="cost" value="${venue?.cost ?? ""}" placeholder="3000" />
          </div>
        </div>
        <div class="field">
          <label class="field-label">Cost notes</label>
          <textarea class="input" name="costNotes" rows="3" placeholder="$2,500 flat rental fee, $500 deposit...">${escapeHtml(venue?.costNotes ?? "")}</textarea>
        </div>
        <div class="field">
          <label class="field-label">Features</label>
          <div class="checkbox-grid">
            ${VENUE_FEATURES.map(
              (f) => `<label class="checkbox-item">
                <input type="checkbox" name="features" value="${escapeHtml(f)}" ${features.includes(f) ? "checked" : ""} /> ${escapeHtml(f)}
              </label>`
            ).join("")}
          </div>
        </div>
        <div class="field">
          <label class="field-label">Notes</label>
          <textarea class="input" name="notes" rows="3" placeholder="Parking available, must book 60 days in advance...">${escapeHtml(venue?.notes ?? "")}</textarea>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn btn-primary" id="submit-btn">${venue ? "Save changes" : "Create venue"}</button>
          <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  `;

  qs("cancel-btn").addEventListener("click", () => history.back());
  qs("venue-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const submitBtn = qs("submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
    try {
      const capacity = fd.get("capacity") ? Number(fd.get("capacity")) : null;
      const cost = fd.get("cost") ? Number(fd.get("cost")) : null;
      const payload = {
        name: fd.get("name")?.trim() || "",
        address: fd.get("address")?.trim() || null,
        capacity,
        cost,
        costNotes: fd.get("costNotes")?.trim() || null,
        pitch: fd.get("pitch")?.trim() || null,
        features: fd.getAll("features"),
        notes: fd.get("notes")?.trim() || null,
      };
      if (!venue) payload.isFavorite = false;

      let savedId = id;
      if (venue) {
        await Venues.update(id, payload);
      } else {
        const ref = await Venues.create(payload);
        savedId = ref.id;
      }
      navigate(`/venues/${savedId}`);
    } catch (err) {
      qs("form-error").textContent = err.message || "Something went wrong.";
      qs("form-error").classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = venue ? "Save changes" : "Create venue";
    }
  });
}

// ---------------------------------------------------------------------------
// Vendors
// ---------------------------------------------------------------------------
async function renderVendorsList(view) {
  view.innerHTML = `<div class="spinner-wrap" style="min-height:200px;">Loading…</div>`;
  const [vendors, contacts] = await Promise.all([Vendors.list(), Contacts.list()]);
  vendors.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const contactCountByVendor = {};
  contacts.forEach((c) => {
    if (c.vendorId) contactCountByVendor[c.vendorId] = (contactCountByVendor[c.vendorId] || 0) + 1;
  });

  view.innerHTML = `
    <div class="flex-col">
      <div class="page-header">
        <div>
          <h1 class="page-title">Vendors</h1>
          <p class="page-subtitle">Caterers, photographers, decorators, and other suppliers.</p>
        </div>
        <a href="#/vendors/new" class="btn btn-primary">+ Add Vendor</a>
      </div>
      ${
        vendors.length === 0
          ? `<div class="card"><p class="empty-state">No vendors yet. Add your first one to get started.</p></div>`
          : `<div class="grid-2">
              ${vendors
                .map(
                  (v) => `<a href="#/vendors/${v.id}" class="card card-link">
                    <div class="page-header" style="align-items:flex-start;">
                      <h2 style="font-weight:500;margin:0;">${escapeHtml(v.name)}</h2>
                      ${v.serviceType ? `<span class="chip">${escapeHtml(v.serviceType)}</span>` : ""}
                    </div>
                    <p style="font-size:0.75rem;color:var(--text-faint);margin:0.75rem 0 0;">${
                      contactCountByVendor[v.id] || 0
                    } linked contact${(contactCountByVendor[v.id] || 0) === 1 ? "" : "s"}</p>
                  </a>`
                )
                .join("")}
            </div>`
      }
    </div>
  `;
}

async function renderVendorDetail(view, id) {
  view.innerHTML = `<div class="spinner-wrap" style="min-height:200px;">Loading…</div>`;
  const vendor = await Vendors.get(id);
  if (!vendor) {
    view.innerHTML = `<div class="card"><p class="empty-state">Vendor not found.</p></div>`;
    return;
  }
  const allContacts = await Contacts.list();
  const linkedContacts = allContacts.filter((c) => c.vendorId === id);

  view.innerHTML = `
    <div class="flex-col">
      <div><a href="#/vendors" class="back-link">← All vendors</a></div>
      <div class="page-header" style="align-items:flex-start;">
        <div>
          <h1 class="page-title">${escapeHtml(vendor.name)}</h1>
          ${vendor.serviceType ? `<p class="page-subtitle">${escapeHtml(vendor.serviceType)}</p>` : ""}
        </div>
        <div class="btn-row" style="margin-top:0;">
          <a href="#/vendors/${vendor.id}/edit" class="btn btn-secondary">Edit</a>
          <button type="button" class="btn btn-danger" id="delete-btn">Delete</button>
        </div>
      </div>
      <div class="card">
        <dl class="detail-grid" style="grid-template-columns:1fr;">
          <div><dt>Pricing notes</dt><dd>${dash(vendor.pricingNotes)}</dd></div>
          <div><dt>Notes</dt><dd>${dash(vendor.notes)}</dd></div>
        </dl>
      </div>
      <div class="card">
        <div class="page-header">
          <h2 style="font-weight:500;margin:0;">Linked contacts</h2>
          <a href="#/contacts/new?vendorId=${vendor.id}" style="font-size:0.875rem;color:var(--emerald);">+ Add contact</a>
        </div>
        ${
          linkedContacts.length === 0
            ? `<p class="empty-state">No contacts linked yet.</p>`
            : linkedContacts
                .map(
                  (c) => `<div class="list-row">
                    <a href="#/contacts/${c.id}" style="font-weight:500;">${escapeHtml(c.name)}</a>
                    <span style="color:var(--text-muted);">${escapeHtml(c.role || c.email || c.phone || "")}</span>
                  </div>`
                )
                .join("")
        }
      </div>
    </div>
  `;

  qs("delete-btn").addEventListener("click", async () => {
    if (!confirm(`Delete ${vendor.name}? This will unlink any associated contacts.`)) return;
    await Vendors.remove(id);
    navigate("/vendors");
  });
}

async function renderVendorForm(view, id) {
  view.innerHTML = `<div class="spinner-wrap" style="min-height:200px;">Loading…</div>`;
  const vendor = id ? await Vendors.get(id) : null;
  if (id && !vendor) {
    view.innerHTML = `<div class="card"><p class="empty-state">Vendor not found.</p></div>`;
    return;
  }

  view.innerHTML = `
    <div class="flex-col">
      <h1 class="page-title">${vendor ? "Edit vendor" : "Add vendor"}</h1>
      <form id="vendor-form" class="form">
        <div id="form-error" class="error-box hidden"></div>
        <div class="field">
          <label class="field-label">Name *</label>
          <input class="input" name="name" value="${escapeHtml(vendor?.name ?? "")}" placeholder="e.g. Sunny Side Catering" required />
        </div>
        <div class="field">
          <label class="field-label">Service type</label>
          <input class="input" name="serviceType" value="${escapeHtml(vendor?.serviceType ?? "")}" placeholder="Catering, Photography, Decor..." />
        </div>
        <div class="field">
          <label class="field-label">Pricing notes</label>
          <textarea class="input" name="pricingNotes" rows="3" placeholder="$25/person, minimum 50 guests...">${escapeHtml(vendor?.pricingNotes ?? "")}</textarea>
        </div>
        <div class="field">
          <label class="field-label">Notes</label>
          <textarea class="input" name="notes" rows="3" placeholder="Requires 2 week lead time, vegan options available...">${escapeHtml(vendor?.notes ?? "")}</textarea>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn btn-primary" id="submit-btn">${vendor ? "Save changes" : "Create vendor"}</button>
          <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  `;

  qs("cancel-btn").addEventListener("click", () => history.back());
  qs("vendor-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const submitBtn = qs("submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
    try {
      const payload = {
        name: fd.get("name")?.trim() || "",
        serviceType: fd.get("serviceType")?.trim() || null,
        pricingNotes: fd.get("pricingNotes")?.trim() || null,
        notes: fd.get("notes")?.trim() || null,
      };
      let savedId = id;
      if (vendor) {
        await Vendors.update(id, payload);
      } else {
        const ref = await Vendors.create(payload);
        savedId = ref.id;
      }
      navigate(`/vendors/${savedId}`);
    } catch (err) {
      qs("form-error").textContent = err.message || "Something went wrong.";
      qs("form-error").classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = vendor ? "Save changes" : "Create vendor";
    }
  });
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------
async function renderContactsList(view) {
  view.innerHTML = `<div class="spinner-wrap" style="min-height:200px;">Loading…</div>`;
  const [contacts, venues, vendors] = await Promise.all([
    Contacts.list(),
    Venues.list(),
    Vendors.list(),
  ]);
  contacts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const venueById = Object.fromEntries(venues.map((v) => [v.id, v]));
  const vendorById = Object.fromEntries(vendors.map((v) => [v.id, v]));

  view.innerHTML = `
    <div class="flex-col">
      <div class="page-header">
        <div>
          <h1 class="page-title">Contacts</h1>
          <p class="page-subtitle">People you work with for events — optionally linked to a venue or vendor.</p>
        </div>
        <a href="#/contacts/new" class="btn btn-primary">+ Add Contact</a>
      </div>
      ${
        contacts.length === 0
          ? `<div class="card"><p class="empty-state">No contacts yet. Add your first one to get started.</p></div>`
          : `<div class="card p0">
              <table class="data-table">
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Linked to</th></tr>
                </thead>
                <tbody>
                  ${contacts
                    .map((c) => {
                      const venue = c.venueId ? venueById[c.venueId] : null;
                      const vendor = c.vendorId ? vendorById[c.vendorId] : null;
                      let linked = `<span style="color:var(--text-faint);">—</span>`;
                      if (venue) linked = `<a href="#/venues/${venue.id}" style="color:var(--emerald);">🏛️ ${escapeHtml(venue.name)}</a>`;
                      else if (vendor) linked = `<a href="#/vendors/${vendor.id}" style="color:var(--emerald);">🧾 ${escapeHtml(vendor.name)}</a>`;
                      return `<tr>
                        <td><a href="#/contacts/${c.id}" style="font-weight:500;">${escapeHtml(c.name)}</a></td>
                        <td style="color:var(--text-muted);">${dash(c.role)}</td>
                        <td style="color:var(--text-muted);">${dash(c.email)}</td>
                        <td style="color:var(--text-muted);">${dash(c.phone)}</td>
                        <td>${linked}</td>
                      </tr>`;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>`
      }
    </div>
  `;
}

async function renderContactDetail(view, id) {
  view.innerHTML = `<div class="spinner-wrap" style="min-height:200px;">Loading…</div>`;
  const contact = await Contacts.get(id);
  if (!contact) {
    view.innerHTML = `<div class="card"><p class="empty-state">Contact not found.</p></div>`;
    return;
  }
  const venue = contact.venueId ? await Venues.get(contact.venueId) : null;
  const vendor = contact.vendorId ? await Vendors.get(contact.vendorId) : null;

  let linked = "—";
  if (venue) linked = `<a href="#/venues/${venue.id}" style="color:var(--emerald);">🏛️ ${escapeHtml(venue.name)}</a>`;
  else if (vendor) linked = `<a href="#/vendors/${vendor.id}" style="color:var(--emerald);">🧾 ${escapeHtml(vendor.name)}</a>`;

  view.innerHTML = `
    <div class="flex-col">
      <div><a href="#/contacts" class="back-link">← All contacts</a></div>
      <div class="page-header" style="align-items:flex-start;">
        <div>
          <h1 class="page-title">${escapeHtml(contact.name)}</h1>
          ${contact.role ? `<p class="page-subtitle">${escapeHtml(contact.role)}</p>` : ""}
        </div>
        <div class="btn-row" style="margin-top:0;">
          <a href="#/contacts/${contact.id}/edit" class="btn btn-secondary">Edit</a>
          <button type="button" class="btn btn-danger" id="delete-btn">Delete</button>
        </div>
      </div>
      <div class="card">
        <dl class="detail-grid">
          <div><dt>Email</dt><dd>${dash(contact.email)}</dd></div>
          <div><dt>Phone</dt><dd>${dash(contact.phone)}</dd></div>
          <div><dt>Linked to</dt><dd>${linked}</dd></div>
          <div class="span-2"><dt>Notes</dt><dd>${dash(contact.notes)}</dd></div>
        </dl>
      </div>
    </div>
  `;

  qs("delete-btn").addEventListener("click", async () => {
    if (!confirm(`Delete ${contact.name}?`)) return;
    await Contacts.remove(id);
    navigate("/contacts");
  });
}

async function renderContactForm(view, id, params) {
  view.innerHTML = `<div class="spinner-wrap" style="min-height:200px;">Loading…</div>`;
  const [contact, venues, vendors] = await Promise.all([
    id ? Contacts.get(id) : Promise.resolve(null),
    Venues.list(),
    Vendors.list(),
  ]);
  if (id && !contact) {
    view.innerHTML = `<div class="card"><p class="empty-state">Contact not found.</p></div>`;
    return;
  }
  venues.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  vendors.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const defaultVenueId = params?.get("venueId") || "";
  const defaultVendorId = params?.get("vendorId") || "";
  const initialLinkType = contact?.venueId
    ? "venue"
    : contact?.vendorId
    ? "vendor"
    : defaultVenueId
    ? "venue"
    : defaultVendorId
    ? "vendor"
    : "none";
  const initialVenueId = contact?.venueId ?? defaultVenueId ?? "";
  const initialVendorId = contact?.vendorId ?? defaultVendorId ?? "";

  view.innerHTML = `
    <div class="flex-col">
      <h1 class="page-title">${contact ? "Edit contact" : "Add contact"}</h1>
      <form id="contact-form" class="form">
        <div id="form-error" class="error-box hidden"></div>
        <div class="field">
          <label class="field-label">Name *</label>
          <input class="input" name="name" value="${escapeHtml(contact?.name ?? "")}" placeholder="e.g. Jamie Rivera" required />
        </div>
        <div class="field">
          <label class="field-label">Role</label>
          <input class="input" name="role" value="${escapeHtml(contact?.role ?? "")}" placeholder="Event coordinator, Sales manager..." />
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">Email</label>
            <input class="input" type="email" name="email" value="${escapeHtml(contact?.email ?? "")}" placeholder="jamie@example.com" />
          </div>
          <div class="field">
            <label class="field-label">Phone</label>
            <input class="input" type="tel" name="phone" value="${escapeHtml(contact?.phone ?? "")}" placeholder="(555) 123-4567" />
          </div>
        </div>
        <div class="field">
          <label class="field-label">Linked to</label>
          <div class="flex-col" style="gap:0.5rem;">
            <select class="input" name="linkType" id="link-type">
              <option value="none" ${initialLinkType === "none" ? "selected" : ""}>Not linked</option>
              <option value="venue" ${initialLinkType === "venue" ? "selected" : ""}>A venue</option>
              <option value="vendor" ${initialLinkType === "vendor" ? "selected" : ""}>A vendor</option>
            </select>
            <select class="input ${initialLinkType === "venue" ? "" : "hidden"}" name="venueId" id="venue-select">
              <option value="">Select a venue…</option>
              ${venues.map((v) => `<option value="${v.id}" ${v.id === initialVenueId ? "selected" : ""}>${escapeHtml(v.name)}</option>`).join("")}
            </select>
            <select class="input ${initialLinkType === "vendor" ? "" : "hidden"}" name="vendorId" id="vendor-select">
              <option value="">Select a vendor…</option>
              ${vendors.map((v) => `<option value="${v.id}" ${v.id === initialVendorId ? "selected" : ""}>${escapeHtml(v.name)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Notes</label>
          <textarea class="input" name="notes" rows="3" placeholder="Best reached by text, prefers afternoon calls...">${escapeHtml(contact?.notes ?? "")}</textarea>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn btn-primary" id="submit-btn">${contact ? "Save changes" : "Create contact"}</button>
          <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  `;

  const linkTypeSelect = qs("link-type");
  const venueSelect = qs("venue-select");
  const vendorSelect = qs("vendor-select");
  linkTypeSelect.addEventListener("change", () => {
    venueSelect.classList.toggle("hidden", linkTypeSelect.value !== "venue");
    vendorSelect.classList.toggle("hidden", linkTypeSelect.value !== "vendor");
  });

  qs("cancel-btn").addEventListener("click", () => history.back());
  qs("contact-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const submitBtn = qs("submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
    try {
      const linkType = fd.get("linkType");
      const payload = {
        name: fd.get("name")?.trim() || "",
        role: fd.get("role")?.trim() || null,
        email: fd.get("email")?.trim() || null,
        phone: fd.get("phone")?.trim() || null,
        notes: fd.get("notes")?.trim() || null,
        venueId: linkType === "venue" ? fd.get("venueId") || null : null,
        vendorId: linkType === "vendor" ? fd.get("vendorId") || null : null,
      };
      let savedId = id;
      if (contact) {
        await Contacts.update(id, payload);
      } else {
        const ref = await Contacts.create(payload);
        savedId = ref.id;
      }
      navigate(`/contacts/${savedId}`);
    } catch (err) {
      qs("form-error").textContent = err.message || "Something went wrong.";
      qs("form-error").classList.remove("hidden");
      submitBtn.disabled = false;
      submitBtn.textContent = contact ? "Save changes" : "Create contact";
    }
  });
}

// ---------------------------------------------------------------------------
// Data export (weekly backup, per Part 7 of the guide)
// ---------------------------------------------------------------------------
async function exportAllData() {
  const [venues, vendors, contacts] = await Promise.all([
    Venues.list(),
    Vendors.list(),
    Contacts.list(),
  ]);
  const data = { exportedAt: new Date().toISOString(), venues, vendors, contacts };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `froggy-fun-factory-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Auth wiring
// ---------------------------------------------------------------------------
qs("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = qs("login-email").value;
  const password = qs("login-password").value;
  const errorBox = qs("login-error");
  const submitBtn = qs("login-submit");
  errorBox.classList.add("hidden");
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    errorBox.textContent = "Login failed. Check your email and password.";
    errorBox.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Log in";
  }
});

qs("logout-btn").addEventListener("click", () => signOut(auth));
qs("export-btn").addEventListener("click", exportAllData);

onAuthStateChanged(auth, (user) => {
  qs("loading-view").classList.add("hidden");
  if (user) {
    qs("login-view").classList.add("hidden");
    qs("app-shell").classList.remove("hidden");
    qs("user-email").textContent = user.email || "";
    if (!window.location.hash) window.location.hash = "#/";
    router();
  } else {
    qs("app-shell").classList.add("hidden");
    qs("login-view").classList.remove("hidden");
  }
});
