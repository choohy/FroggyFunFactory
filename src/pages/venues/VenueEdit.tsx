import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cardClass } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import VenueForm from "@/components/venues/VenueForm";
import { getVenue } from "@/lib/venues";
import type { Venue } from "@/lib/types";

export default function VenueEdit() {
  return (
    <RequireAuth>
      <VenueEditContent />
    </RequireAuth>
  );
}

function VenueEditContent() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getVenue(id).then((v) => {
      if (!cancelled) setVenue(v);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (venue === undefined) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (venue === null) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Venue not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit {venue.name}</h1>
      <VenueForm venue={venue} />
    </div>
  );
}
