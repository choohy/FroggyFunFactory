import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonPrimaryClass, cardClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function VenuesPage() {
  const venues = await prisma.venue.findMany({
    include: { contacts: true },
    orderBy: { name: "asc" },
  });

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

      {venues.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No venues yet. Add your first one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {venues.map((v) => (
            <Link key={v.id} href={`/venues/${v.id}`} className={`${cardClass} block hover:border-emerald-400 transition-colors`}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-medium">{v.name}</h2>
                {v.capacity ? (
                  <span className="text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                    Capacity {v.capacity}
                  </span>
                ) : null}
              </div>
              {v.address && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{v.address}</p>
              )}
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
                {v.contacts.length} linked contact{v.contacts.length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
