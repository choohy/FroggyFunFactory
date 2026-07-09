const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "demo-froggyfunfactory";

async function clearFirestore() {
  const res = await fetch(
    `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(`Failed to clear Firestore emulator: ${res.status}`);
}

async function clearAuth() {
  const res = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to clear Auth emulator: ${res.status}`);
}

// Give the emulators a moment in case this runs right as they finish
// reporting ready.
async function withRetry(fn: () => Promise<void>, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    try {
      await fn();
      return;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

export default async function globalSetup() {
  await withRetry(clearFirestore);
  await withRetry(clearAuth);
}
