import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  inputClass,
  labelClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/components/ui";
import { createVendor, updateVendor } from "@/lib/vendors";
import type { Vendor } from "@/lib/types";

export default function VendorForm({ vendor }: { vendor?: Vendor }) {
  const navigate = useNavigate();
  const isEdit = Boolean(vendor);
  const [name, setName] = useState(vendor?.name ?? "");
  const [serviceType, setServiceType] = useState(vendor?.serviceType ?? "");
  const [pricingNotes, setPricingNotes] = useState(vendor?.pricingNotes ?? "");
  const [notes, setNotes] = useState(vendor?.notes ?? "");
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
      serviceType: serviceType.trim() || null,
      pricingNotes: pricingNotes.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      const id = isEdit ? vendor!.id : await createVendor(payload);
      if (isEdit) await updateVendor(vendor!.id, payload);
      navigate(`/vendors/${id}`);
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
          placeholder="e.g. Sunny Side Catering"
          required
        />
      </div>
      <div>
        <label className={labelClass}>Service type</label>
        <input
          className={inputClass}
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          placeholder="Catering, Photography, Decor..."
        />
      </div>
      <div>
        <label className={labelClass}>Pricing notes</label>
        <textarea
          className={inputClass}
          rows={3}
          value={pricingNotes}
          onChange={(e) => setPricingNotes(e.target.value)}
          placeholder="$25/person, minimum 50 guests..."
        />
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          className={inputClass}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Requires 2 week lead time, vegan options available..."
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button type="submit" disabled={submitting} className={buttonPrimaryClass}>
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Create vendor"}
        </button>
        <button type="button" className={buttonSecondaryClass} onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
