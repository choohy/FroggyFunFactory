import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cardClass } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import ContactForm from "@/components/contacts/ContactForm";
import { getContact } from "@/lib/contacts";
import { listVenues } from "@/lib/venues";
import { listVendors } from "@/lib/vendors";
import type { Contact } from "@/lib/types";

export default function ContactEdit() {
  return (
    <RequireAuth>
      <ContactEditContent />
    </RequireAuth>
  );
}

function ContactEditContent() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null | undefined>(undefined);
  const [options, setOptions] = useState<{
    venues: { id: string; name: string }[];
    vendors: { id: string; name: string }[];
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      const [c, venues, vendors] = await Promise.all([getContact(id!), listVenues(), listVendors()]);
      if (cancelled) return;
      setContact(c);
      setOptions({
        venues: venues.map((v) => ({ id: v.id, name: v.name })),
        vendors: vendors.map((v) => ({ id: v.id, name: v.name })),
      });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (contact === undefined || !options) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (contact === null) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Contact not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit {contact.name}</h1>
      <ContactForm contact={contact} venues={options.venues} vendors={options.vendors} />
    </div>
  );
}
