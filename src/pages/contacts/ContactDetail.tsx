import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buttonSecondaryClass, cardClass } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import DeleteButton from "@/components/DeleteButton";
import { deleteContact, getContact } from "@/lib/contacts";
import type { Contact } from "@/lib/types";

export default function ContactDetail() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/contacts" className="text-sm text-emerald-600 hover:underline">
          ← All contacts
        </Link>
      </div>
      <RequireAuth>
        <ContactDetailContent />
      </RequireAuth>
    </div>
  );
}

function ContactDetailContent() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getContact(id).then((c) => {
      if (!cancelled) setContact(c);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (contact === undefined) {
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contact.name}</h1>
          {contact.role && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{contact.role}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to={`/contacts/${contact.id}/edit`} className={buttonSecondaryClass}>
            Edit
          </Link>
          <DeleteButton
            onDelete={() => deleteContact(contact.id)}
            redirectTo="/contacts"
            confirmMessage={`Delete ${contact.name}?`}
          />
        </div>
      </div>

      <div className={cardClass}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="mt-1 text-sm">{contact.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Phone</dt>
            <dd className="mt-1 text-sm">{contact.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Linked to</dt>
            <dd className="mt-1 text-sm">
              {contact.venueId ? (
                <Link to={`/venues/${contact.venueId}`} className="text-emerald-600 hover:underline">
                  🏛️ {contact.venueName}
                </Link>
              ) : contact.vendorId ? (
                <Link to={`/vendors/${contact.vendorId}`} className="text-emerald-600 hover:underline">
                  🧾 {contact.vendorName}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap">{contact.notes || "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
