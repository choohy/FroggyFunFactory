import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { buttonPrimaryClass, buttonSecondaryClass, cardClass, inputClass, labelClass } from "@/components/ui";
import { VENUE_FEATURES, parseFeatures } from "@/lib/venueFeatures";
import FavoriteButton from "@/components/venues/FavoriteButton";

export const dynamic = "force-dynamic";

type SearchParams = {
  location?: string;
  maxCost?: string;
  minCapacity?: string;
  features?: string | string[];
};

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const location = params.location?.trim() ?? "";
  const maxCost = params.maxCost?.trim() ?? "";
  const minCapacity = params.minCapacity?.trim() ?? "";
  const selectedFeatures = Array.isArray(params.features)
    ? params.features
    : params.features
    ? [params.features]
    : [];

  const where: Prisma.VenueWhereInput = {};

  if (location) {
    where.address = { contains: location };
  }
  if (maxCost && !Number.isNaN(Number(maxCost))) {
    where.cost = { lte: Number(maxCost) };
  }
  if (minCapacity && !Number.isNaN(Number(minCapacity))) {
    where.capacity = { gte: Number(minCapacity) };
  }
  if (selectedFeatures.length > 0) {
    where.AND = selectedFeatures.map((f) => ({
      features: { contains: f },
    }));
  }

  const venues = await prisma.venue.findMany({
    where,
    include: { contacts: true },
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
  });

  const hasFilters = Boolean(location || maxCost || minCapacity || selectedFeatures.length);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Venues</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Locations you&rsquo;re considering or have booked for events.
          </p>
        </div>
        <Link href="/venues/new" className={buttonPrimaryClass}>
          + Add Venue
        </Link>
      </div>

      <form method="GET" className={`${cardClass} flex flex-col gap-4`}>
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
            <Link href="/venues" className={buttonSecondaryClass}>
              Clear
            </Link>
          )}
        </div>
      </form>

      {venues.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {hasFilters
              ? "No venues match these filters."
              : "No venues yet. Add your first one to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {venues.map((v) => {
            const venueFeatures = parseFeatures(v.features);
            return (
              <Link
                key={v.id}
                href={`/venues/${v.id}`}
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
                    <FavoriteButton venueId={v.id} initialFavorite={v.isFavorite} size="sm" />
                  </div>
                </div>
                {v.address && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{v.address}</p>
                )}
                {v.cost != null && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    ${v.cost.toLocaleString()}
                  </p>
                )}
                {v.pitch && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 line-clamp-2">{v.pitch}</p>
                )}
                {venueFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {venueFeatures.map((f) => (
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
                  {v.contacts.length} linked contact{v.contacts.length === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
