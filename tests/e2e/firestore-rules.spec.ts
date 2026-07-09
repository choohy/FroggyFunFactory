import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./helpers/emulatorAuth";

const PROJECT_ID = "demo-froggyfunfactory";
const FIRESTORE_REST_URL = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * These tests bypass the app's own UI/client-side validation entirely and
 * write straight to the Firestore REST API, to prove the *database*
 * enforces access control — not just the client. This is what actually
 * secures the data once it's live on GitHub Pages, where anyone can open
 * devtools and call Firestore directly.
 */
test.describe("Firestore security rules", () => {
  test("an unauthenticated request is rejected", async ({ request }) => {
    const res = await request.post(`${FIRESTORE_REST_URL}/venues`, {
      data: { fields: { name: { stringValue: "Should be rejected" } } },
    });
    expect(res.status()).toBe(403);
  });

  test("a non-allowlisted authenticated user is rejected", async ({ page, request }) => {
    await page.goto("/");
    await signInAsTestUser(page, "not-allowed@example.com");
    const idToken = await page.evaluate(async () => {
      return (
        window as unknown as { __testAuth: { getIdToken: () => Promise<string | undefined> } }
      ).__testAuth.getIdToken();
    });

    const res = await request.post(`${FIRESTORE_REST_URL}/venues`, {
      headers: { Authorization: `Bearer ${idToken}` },
      data: { fields: { name: { stringValue: "Should still be rejected" } } },
    });
    expect(res.status()).toBe(403);
  });

  test("an allowlisted user is rejected when writing a document with no name", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await signInAsTestUser(page, "allowed-test-user@example.com");
    const idToken = await page.evaluate(async () => {
      return (
        window as unknown as { __testAuth: { getIdToken: () => Promise<string | undefined> } }
      ).__testAuth.getIdToken();
    });

    const res = await request.post(`${FIRESTORE_REST_URL}/venues`, {
      headers: { Authorization: `Bearer ${idToken}` },
      data: { fields: { address: { stringValue: "No name field on this doc" } } },
    });
    expect(res.status()).toBe(403);
  });

  test("an allowlisted user can write a valid document directly", async ({ page, request }) => {
    await page.goto("/");
    await signInAsTestUser(page, "allowed-test-user@example.com");
    const idToken = await page.evaluate(async () => {
      return (
        window as unknown as { __testAuth: { getIdToken: () => Promise<string | undefined> } }
      ).__testAuth.getIdToken();
    });

    const res = await request.post(`${FIRESTORE_REST_URL}/venues`, {
      headers: { Authorization: `Bearer ${idToken}` },
      data: { fields: { name: { stringValue: "Direct REST Write Venue" } } },
    });
    expect(res.ok()).toBeTruthy();
  });
});
