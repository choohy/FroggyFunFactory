import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buttonPrimaryClass, cardClass } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import { listContacts } from "@/lib/contacts";
import type { Contact } from "@/lib/types";

export default function ContactsList() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            People you work with for events — optionally linked to a venue or vendor.
          </p>
        </div>
        <Link to="/contacts/new" className={buttonPrimaryClass}>
          + Add Contact
        </Link>
      </div>
      <RequireAuth>
        <ContactsListContent />
      </RequireAuth>
    </div>
  );
}

function ContactsListContent() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listContacts().then((c) => {
      if (cancelled) return;
      setContacts(c);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No contacts yet. Add your first one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className={`${cardClass} p-0 overflow-hidden`}>
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-xs text-zinc-500 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Phone</th>
            <th className="px-4 py-3 font-medium">Linked to</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {contacts.map((c) => (
            <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
              <td className="px-4 py-3">
                <Link to={`/contacts/${c.id}`} className="font-medium hover:text-emerald-600">
                  {c.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{c.role || "—"}</td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{c.email || "—"}</td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{c.phone || "—"}</td>
              <td className="px-4 py-3">
                {c.venueId ? (
                  <Link to={`/venues/${c.venueId}`} className="text-emerald-600 hover:underline">
                    🏛️ {c.venueName}
                  </Link>
                ) : c.vendorId ? (
                  <Link to={`/vendors/${c.vendorId}`} className="text-emerald-600 hover:underline">
                    🧾 {c.vendorName}
                  </Link>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
