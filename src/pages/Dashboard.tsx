import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/firebase";
import { cardClass } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import { listRecentContacts } from "@/lib/contacts";
import type { Contact } from "@/lib/types";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Track event management contacts, venues, and vendor details.
        </p>
      </div>
      <RequireAuth>
        <DashboardContent />
      </RequireAuth>
    </div>
  );
}

function DashboardContent() {
  const [counts, setCounts] = useState<{ contacts: number; venues: number; vendors: number } | null>(
    null
  );
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [contactCount, venueCount, vendorCount, recent] = await Promise.all([
        getCountFromServer(collection(db, "contacts")),
        getCountFromServer(collection(db, "venues")),
        getCountFromServer(collection(db, "vendors")),
        listRecentContacts(5),
      ]);
      if (cancelled) return;
      setCounts({
        contacts: contactCount.data().count,
        venues: venueCount.data().count,
        vendors: vendorCount.data().count,
      });
      setRecentContacts(recent);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !counts) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  const stats = [
    { label: "Contacts", count: counts.contacts, href: "/contacts", emoji: "👤" },
    { label: "Venues", count: counts.venues, href: "/venues", emoji: "🏛️" },
    { label: "Vendors", count: counts.vendors, href: "/vendors", emoji: "🧾" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.href}
            to={s.href}
            className={`${cardClass} block hover:border-emerald-400 transition-colors`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-3xl font-semibold">{s.count}</span>
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className={cardClass}>
        <h2 className="font-medium mb-3">Recently added contacts</h2>
        {recentContacts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No contacts yet.{" "}
            <Link to="/contacts" className="text-emerald-600 hover:underline">
              Add your first contact
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentContacts.map((c) => (
              <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                <Link to={`/contacts/${c.id}`} className="font-medium hover:text-emerald-600">
                  {c.name}
                </Link>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {c.venueName || c.vendorName || c.role || "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
