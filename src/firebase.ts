import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

// These values are safe to expose publicly: Firebase web config is not a
// secret, and access is enforced entirely by Firestore Security Rules
// (see firestore.rules), not by hiding this config. See README.md.
//
// The Auth SDK validates the shape of apiKey even when talking to the
// emulator, so emulator builds use a fake-but-valid-looking config instead
// of real (usually blank) env vars.
const firebaseConfig = useEmulator
  ? {
      apiKey: "demo-api-key-for-emulator-only",
      authDomain: "localhost",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-froggyfunfactory",
    }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

if (!useEmulator && !firebaseConfig.apiKey) {
  throw new Error(
    "Missing Firebase config. Set the VITE_FIREBASE_* environment variables (see .env.example)."
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

if (useEmulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

// Playwright drives sign-in through email/password against the Auth
// emulator instead of the real Google OAuth popup, which can't run in a
// headless browser. A real email/password sign-in still populates the
// standard `email` claim that firestore.rules checks, exercising the same
// rules path as production Google sign-in. Only wired up against the
// emulator, never in a production build.
if (useEmulator) {
  const TEST_PASSWORD = "test-password-not-used-in-production";
  (
    window as unknown as {
      __testAuth: {
        signInAsTestUser: (email: string) => Promise<unknown>;
        getIdToken: () => Promise<string | undefined>;
      };
    }
  ).__testAuth = {
    signInAsTestUser: async (email: string) => {
      try {
        return await createUserWithEmailAndPassword(auth, email, TEST_PASSWORD);
      } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "auth/email-already-in-use") {
          return await signInWithEmailAndPassword(auth, email, TEST_PASSWORD);
        }
        throw err;
      }
    },
    // Used by tests to make raw, authenticated Firestore REST calls that
    // bypass the app's own client-side validation, so firestore.rules'
    // enforcement can be tested directly rather than through the UI.
    getIdToken: async () => auth.currentUser?.getIdToken(),
  };
}
