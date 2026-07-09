import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  inputClass,
  labelClass,
} from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import FavoriteButton from "@/components/venues/FavoriteButton";
import { VENUE_FEATURES } from "@/lib/venueFeatures";
import { listVenues } from "@/lib/venues";
import { listContacts } from "@/lib/contacts";
import type { Venue } from "@/lib/types";

export default function VenuesList() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Venues</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Locations you&rsquo;re considering or have booked for events.
          </p>
        </div>
        <Link to="/venues/new" className={buttonPrimaryClass}>
          + Add Venue
        </Link>
      </div>
      <RequireAuth>
        <VenuesListContent />
      </RequireAuth>
    </div>
  );
}

function VenuesListContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [contactCounts, setContactCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [fetchedVenues, contacts] = await Promise.all([listVenues(), listContacts()]);
      if (cancelled) return;
      setVenues(fetchedVenues);
      const counts: Record<string, number> = {};
      for (const contact of contacts) {
        if (contact.venueId) counts[contact.venueId] = (counts[contact.venueId] ?? 0) + 1;
      }
      setContactCounts(counts);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const location = searchParams.get("location")?.trim() ?? "";
  const maxCost = searchParams.get("maxCost")?.trim() ?? "";
  const minCapacity = searchParams.get("minCapacity")?.trim() ?? "";
  const selectedFeatures = searchParams.getAll("features");
  const hasFilters = Boolean(location || maxCost || minCapacity || selectedFeatures.length);

  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      if (location && !(v.address ?? "").toLowerCase().includes(location.toLowerCase())) {
        return false;
      }
      if (maxCost && !Number.isNaN(Number(maxCost))) {
        if (v.cost == null || v.cost > Number(maxCost)) return false;
      }
      if (minCapacity && !Number.isNaN(Number(minCapacity))) {
        if (v.capacity == null || v.capacity < Number(minCapacity)) return false;
      }
      if (selectedFeatures.length > 0 && !selectedFeatures.every((f) => v.features.includes(f))) {
        return false;
      }
      return true;
    });
  }, [venues, location, maxCost, minCapacity, selectedFeatures]);

  function handleFilterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value.trim()) params.append(key, value);
    }
    setSearchParams(params);
  }

  function handleFavoriteChange(id: string, next: boolean) {
    setVenues((prev) => prev.map((v) => (v.id === id ? { ...v, isFavorite: next } : v)));
  }

  if (loading) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleFilterSubmit} className={`${cardClass} flex flex-col gap-4`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Location contains</label>
            <input
              className={inputClass}
              type="text"
              name="location"
              defaultValue={location}
              placeholder="Springfield"
            />
          </div>
          <div>
            <label className={labelClass}>Max cost ($)</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              name="maxCost"
              defaultValue={maxCost}
              placeholder="5000"
            />
          </div>
          <div>
            <label className={labelClass}>Min capacity</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              name="minCapacity"
              defaultValue={minCapacity}
              placeholder="100"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Features</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VENUE_FEATURES.map((feature) => (
              <label key={feature} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="features"
                  value={feature}
                  defaultChecked={selectedFeatures.includes(feature)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700"
                />
                {feature}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className={buttonPrimaryClass}>
            Apply filters
          </button>
          {hasFilters && (
            <Link to="/venues" className={buttonSecondaryClass}>
              Clear
            </Link>
          )}
        </div>
      </form>

      {filteredVenues.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {hasFilters ? "No venues match these filters." : "No venues yet. Add your first one to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredVenues.map((v) => (
            <Link
              key={v.id}
              to={`/venues/${v.id}`}
              className={`${cardClass} block hover:border-emerald-400 transition-colors`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-medium">{v.name}</h2>
                <div className="flex items-center gap-2 shrink-0">
                  {v.capacity ? (
                    <span className="text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                      Capacity {v.capacity}
                    </span>
                  ) : null}
                  <FavoriteButton
                    venueId={v.id}
                    initialFavorite={v.isFavorite}
                    size="sm"
                    onChange={(next) => handleFavoriteChange(v.id, next)}
                  />
                </div>
              </div>
              {v.address && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{v.address}</p>}
              {v.cost != null && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">${v.cost.toLocaleString()}</p>
              )}
              {v.pitch && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 line-clamp-2">{v.pitch}</p>
              )}
              {v.features.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {v.features.map((f) => (
                    <span
                      key={f}
                      className="text-xs rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
                {(contactCounts[v.id] ?? 0)} linked contact{(contactCounts[v.id] ?? 0) === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
