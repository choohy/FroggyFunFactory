import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/contacts", label: "Contacts" },
  { href: "/venues", label: "Venues" },
  { href: "/vendors", label: "Vendors" },
];

export default function Nav() {
  const { pathname } = useLocation();
  const { user, loading, isAllowed, signInWithGoogle, signOutUser } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
        <Link to="/" className="font-semibold text-lg tracking-tight shrink-0">
          🐸 Froggy Fun Factory
        </Link>
        <nav className="flex gap-1 flex-1">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        {!loading && (
          <div className="text-sm shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                  {user.email}
                  {!isAllowed && " (not authorized)"}
                </span>
                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="text-emerald-600 hover:underline"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="text-emerald-600 hover:underline"
              >
                Sign in
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
