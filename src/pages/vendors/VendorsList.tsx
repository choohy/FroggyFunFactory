import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buttonPrimaryClass, cardClass } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import { listVendors } from "@/lib/vendors";
import { listContacts } from "@/lib/contacts";
import type { Vendor } from "@/lib/types";

export default function VendorsList() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Caterers, photographers, decorators, and other suppliers.
          </p>
        </div>
        <Link to="/vendors/new" className={buttonPrimaryClass}>
          + Add Vendor
        </Link>
      </div>
      <RequireAuth>
        <VendorsListContent />
      </RequireAuth>
    </div>
  );
}

function VendorsListContent() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contactCounts, setContactCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [fetchedVendors, contacts] = await Promise.all([listVendors(), listContacts()]);
      if (cancelled) return;
      setVendors(fetchedVendors);
      const counts: Record<string, number> = {};
      for (const contact of contacts) {
        if (contact.vendorId) counts[contact.vendorId] = (counts[contact.vendorId] ?? 0) + 1;
      }
      setContactCounts(counts);
      setLoading(false);
    }
    void load();
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

  if (vendors.length === 0) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No vendors yet. Add your first one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {vendors.map((v) => (
        <Link
          key={v.id}
          to={`/vendors/${v.id}`}
          className={`${cardClass} block hover:border-emerald-400 transition-colors`}
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-medium">{v.name}</h2>
            {v.serviceType && (
              <span className="text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                {v.serviceType}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
            {(contactCounts[v.id] ?? 0)} linked contact{(contactCounts[v.id] ?? 0) === 1 ? "" : "s"}
          </p>
        </Link>
      ))}
    </div>
  );
}
