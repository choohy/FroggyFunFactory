import type { ReactNode } from "react";
import { useAuth } from "@/contexts/useAuth";
import { buttonPrimaryClass, buttonSecondaryClass, cardClass } from "@/components/ui";

/**
 * Gates the data content of a page behind sign-in + the email allowlist.
 * Page shells (nav, headings) render regardless so the app doesn't look
 * broken to a signed-out visitor — only the actual data is hidden. The
 * real enforcement is server-side, in Firestore's security rules; this
 * component only controls what the UI shows.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, isAllowed, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${cardClass} flex flex-col items-start gap-3`}>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Sign in with Google to view and manage this data.
        </p>
        <button type="button" onClick={() => void signInWithGoogle()} className={buttonPrimaryClass}>
          Sign in with Google
        </button>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className={`${cardClass} flex flex-col items-start gap-3`}>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Signed in as <span className="font-medium">{user.email}</span>, but this account isn&rsquo;t
          authorized to view this data.
        </p>
        <SignOutButton />
      </div>
    );
  }

  return <>{children}</>;
}

function SignOutButton() {
  const { signOutUser } = useAuth();
  return (
    <button type="button" onClick={() => void signOutUser()} className={buttonSecondaryClass}>
      Sign out
    </button>
  );
}
