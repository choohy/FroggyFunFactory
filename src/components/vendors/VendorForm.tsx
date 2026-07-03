"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  inputClass,
  labelClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/components/ui";

type Vendor = {
  id: string;
  name: string;
  serviceType: string | null;
  pricingNotes: string | null;
  notes: string | null;
};

export default function VendorForm({ vendor }: { vendor?: Vendor }) {
  const router = useRouter();
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
    setSubmitting(true);

    const payload = { name, serviceType, pricingNotes, notes };
    const url = isEdit ? `/api/vendors/${vendor!.id}` : "/api/vendors";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong.");
        return;
      }

      const saved = await res.json();
      router.push(`/vendors/${saved.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
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
        <button
          type="button"
          className={buttonSecondaryClass}
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
