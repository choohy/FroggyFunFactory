import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  inputClass,
  labelClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/components/ui";
import { createContact, updateContact } from "@/lib/contacts";
import type { Contact } from "@/lib/types";

type Option = { id: string; name: string };

export default function ContactForm({
  contact,
  venues,
  vendors,
  defaultVenueId,
  defaultVendorId,
}: {
  contact?: Contact;
  venues: Option[];
  vendors: Option[];
  defaultVenueId?: string | null;
  defaultVendorId?: string | null;
}) {
  const navigate = useNavigate();
  const isEdit = Boolean(contact);

  const initialLinkType = contact?.venueId
    ? "venue"
    : contact?.vendorId
    ? "vendor"
    : defaultVenueId
    ? "venue"
    : defaultVendorId
    ? "vendor"
    : "none";

  const [name, setName] = useState(contact?.name ?? "");
  const [role, setRole] = useState(contact?.role ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [linkType, setLinkType] = useState<"none" | "venue" | "vendor">(initialLinkType);
  const [venueId, setVenueId] = useState(contact?.venueId ?? defaultVenueId ?? "");
  const [vendorId, setVendorId] = useState(contact?.vendorId ?? defaultVendorId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      role: role.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
      venueId: linkType === "venue" ? venueId || null : null,
      vendorId: linkType === "vendor" ? vendorId || null : null,
    };

    try {
      const id = isEdit ? contact!.id : await createContact(payload);
      if (isEdit) await updateContact(contact!.id, payload);
      navigate(`/contacts/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4 max-w-lg">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <label className={labelClass}>Name *</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jamie Rivera"
          required
        />
      </div>
      <div>
        <label className={labelClass}>Role</label>
        <input
          className={inputClass}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Event coordinator, Sales manager..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Email</label>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jamie@example.com"
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            className={inputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Linked to</label>
        <div className="flex flex-col gap-2">
          <select
            className={inputClass}
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as "none" | "venue" | "vendor")}
          >
            <option value="none">Not linked</option>
            <option value="venue">A venue</option>
            <option value="vendor">A vendor</option>
          </select>

          {linkType === "venue" && (
            <select
              className={inputClass}
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              required
            >
              <option value="">Select a venue…</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}

          {linkType === "vendor" && (
            <select
              className={inputClass}
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              required
            >
              <option value="">Select a vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          className={inputClass}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Best reached by text, prefers afternoon calls..."
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button type="submit" disabled={submitting} className={buttonPrimaryClass}>
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Create contact"}
        </button>
        <button type="button" className={buttonSecondaryClass} onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
