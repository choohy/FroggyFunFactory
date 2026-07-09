/**
 * Emails allowed to view and edit data in this app.
 *
 * This list is for UI purposes only (showing a clear "not authorized"
 * message instead of a raw permission error). The actual security
 * enforcement happens in Firestore's security rules, which must list the
 * exact same emails — see the ALLOWED_EMAILS list in firestore.rules.
 * Changing this file alone does NOT change who can read/write data.
 */
export const ALLOWED_EMAILS: string[] = [
  // "you@example.com",
];

// Test-only: when running against the Firebase emulator (see
// tests/e2e), VITE_TEST_ALLOWED_EMAIL lets the e2e suite exercise the
// "authorized" UI path without needing a real allowlisted email baked
// into the app. It has no effect in a normal/production build. Must match
// the test email in firestore.test.rules.
const testAllowedEmail =
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true"
    ? import.meta.env.VITE_TEST_ALLOWED_EMAIL
    : undefined;

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emails = testAllowedEmail ? [...ALLOWED_EMAILS, testAllowedEmail] : ALLOWED_EMAILS;
  return emails.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}
