import type { Page } from "@playwright/test";

/**
 * Signs the given Playwright page in as a fake user (identified only by
 * email) using the Firebase Auth emulator, bypassing the real Google OAuth
 * popup entirely (which can't run in a headless browser). The app must
 * have been built with VITE_USE_FIREBASE_EMULATOR=true so it exposes
 * window.__testAuth (see src/firebase.ts).
 */
export async function signInAsTestUser(page: Page, email: string): Promise<void> {
  await page.waitForFunction(() => Boolean((window as unknown as Record<string, unknown>).__testAuth));
  await page.evaluate(async (userEmail) => {
    const testAuth = (
      window as unknown as { __testAuth: { signInAsTestUser: (email: string) => Promise<unknown> } }
    ).__testAuth;
    await testAuth.signInAsTestUser(userEmail);
  }, email);
}

const FIRESTORE_EMULATOR_URL = "http://127.0.0.1:8080";

/** Wipes all Firestore emulator data so each test run starts clean. */
export async function clearFirestoreEmulator(projectId: string): Promise<void> {
  const res = await fetch(
    `${FIRESTORE_EMULATOR_URL}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    throw new Error(`Failed to clear Firestore emulator data: ${res.status} ${await res.text()}`);
  }
}
