"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  inputClass,
  labelClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/components/ui";

type Venue = {
  id: string;
  name: string;
  address: string | null;
  capacity: number | null;
  costNotes: string | null;
  notes: string | null;
};

export default function VenueForm({ venue }: { venue?: Venue }) {
  const router = useRouter();
  const isEdit = Boolean(venue);
  const [name, setName] = useState(venue?.name ?? "");
  const [address, setAddress] = useState(venue?.address ?? "");
  const [capacity, setCapacity] = useState(venue?.capacity?.toString() ?? "");
  const [costNotes, setCostNotes] = useState(venue?.costNotes ?? "");
  const [notes, setNotes] = useState(venue?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = { name, address, capacity, costNotes, notes };
    const url = isEdit ? `/api/venues/${venue!.id}` : "/api/venues";
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
      router.push(`/venues/${saved.id}`);
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
          placeholder="e.g. The Grand Hall"
          required
        />
      </div>
      <div>
        <label className={labelClass}>Address</label>
        <input
          className={inputClass}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, Springfield"
        />
      </div>
      <div>
        <label className={labelClass}>Capacity</label>
        <input
          className={inputClass}
          type="number"
          min={0}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="150"
        />
      </div>
      <div>
        <label className={labelClass}>Cost notes</label>
        <textarea
          className={inputClass}
          rows={3}
          value={costNotes}
          onChange={(e) => setCostNotes(e.target.value)}
          placeholder="$2,500 flat rental fee, $500 deposit..."
        />
      </div>
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          className={inputClass}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Parking available, must book 60 days in advance..."
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button type="submit" disabled={submitting} className={buttonPrimaryClass}>
          {submitting ? "Saving..." : isEdit ? "Save changes" : "Create venue"}
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
