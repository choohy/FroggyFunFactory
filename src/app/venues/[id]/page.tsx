import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buttonSecondaryClass, cardClass } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await prisma.venue.findUnique({
    where: { id },
    include: { contacts: true },
  });

  if (!venue) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/venues" className="text-sm text-emerald-600 hover:underline">
          ← All venues
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{venue.name}</h1>
          {venue.address && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{venue.address}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/venues/${venue.id}/edit`} className={buttonSecondaryClass}>
            Edit
          </Link>
          <DeleteButton url={`/api/venues/${venue.id}`} redirectTo="/venues" confirmMessage={`Delete ${venue.name}? This will unlink any associated contacts.`} />
        </div>
      </div>

      <div className={cardClass}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Capacity</dt>
            <dd className="mt-1 text-sm">{venue.capacity ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cost notes</dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap">{venue.costNotes || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap">{venue.notes || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Linked contacts</h2>
          <Link href={`/contacts/new?venueId=${venue.id}`} className="text-sm text-emerald-600 hover:underline">
            + Add contact
          </Link>
        </div>
        {venue.contacts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No contacts linked yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {venue.contacts.map((c) => (
              <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                <Link href={`/contacts/${c.id}`} className="font-medium hover:text-emerald-600">
                  {c.name}
                </Link>
                <span className="text-zinc-500 dark:text-zinc-400">{c.role || c.email || c.phone || ""}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
