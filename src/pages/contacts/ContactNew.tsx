import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { cardClass } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import ContactForm from "@/components/contacts/ContactForm";
import { listVenues } from "@/lib/venues";
import { listVendors } from "@/lib/vendors";

export default function ContactNew() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add Contact</h1>
      <RequireAuth>
        <ContactNewContent />
      </RequireAuth>
    </div>
  );
}

function ContactNewContent() {
  const [searchParams] = useSearchParams();
  const [options, setOptions] = useState<{
    venues: { id: string; name: string }[];
    vendors: { id: string; name: string }[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [venues, vendors] = await Promise.all([listVenues(), listVendors()]);
      if (cancelled) return;
      setOptions({
        venues: venues.map((v) => ({ id: v.id, name: v.name })),
        vendors: vendors.map((v) => ({ id: v.id, name: v.name })),
      });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!options) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <ContactForm
      venues={options.venues}
      vendors={options.vendors}
      defaultVenueId={searchParams.get("venueId")}
      defaultVendorId={searchParams.get("vendorId")}
    />
  );
}
