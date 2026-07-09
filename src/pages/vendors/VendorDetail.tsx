import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buttonSecondaryClass, cardClass } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import DeleteButton from "@/components/DeleteButton";
import { deleteVendor, getVendor } from "@/lib/vendors";
import { listContactsByVendor } from "@/lib/contacts";
import type { Contact, Vendor } from "@/lib/types";

export default function VendorDetail() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/vendors" className="text-sm text-emerald-600 hover:underline">
          ← All vendors
        </Link>
      </div>
      <RequireAuth>
        <VendorDetailContent />
      </RequireAuth>
    </div>
  );
}

function VendorDetailContent() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null | undefined>(undefined);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      const [v, c] = await Promise.all([getVendor(id!), listContactsByVendor(id!)]);
      if (cancelled) return;
      setVendor(v);
      setContacts(c);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (vendor === undefined) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (vendor === null) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Vendor not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{vendor.name}</h1>
          {vendor.serviceType && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{vendor.serviceType}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to={`/vendors/${vendor.id}/edit`} className={buttonSecondaryClass}>
            Edit
          </Link>
          <DeleteButton
            onDelete={() => deleteVendor(vendor.id)}
            redirectTo="/vendors"
            confirmMessage={`Delete ${vendor.name}? This will unlink any associated contacts.`}
          />
        </div>
      </div>

      <div className={cardClass}>
        <dl className="grid grid-cols-1 gap-4">
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pricing notes</dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap">{vendor.pricingNotes || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap">{vendor.notes || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Linked contacts</h2>
          <Link
            to={`/contacts/new?vendorId=${vendor.id}`}
            className="text-sm text-emerald-600 hover:underline"
          >
            + Add contact
          </Link>
        </div>
        {contacts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No contacts linked yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {contacts.map((c) => (
              <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                <Link to={`/contacts/${c.id}`} className="font-medium hover:text-emerald-600">
                  {c.name}
                </Link>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {c.role || c.email || c.phone || ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
