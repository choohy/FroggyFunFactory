import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buttonSecondaryClass, cardClass } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { venue: true, vendor: true },
  });

  if (!contact) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/contacts" className="text-sm text-emerald-600 hover:underline">
          ← All contacts
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contact.name}</h1>
          {contact.role && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{contact.role}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/contacts/${contact.id}/edit`} className={buttonSecondaryClass}>
            Edit
          </Link>
          <DeleteButton url={`/api/contacts/${contact.id}`} redirectTo="/contacts" confirmMessage={`Delete ${contact.name}?`} />
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
              {contact.venue ? (
                <Link href={`/venues/${contact.venue.id}`} className="text-emerald-600 hover:underline">
                  🏛️ {contact.venue.name}
                </Link>
              ) : contact.vendor ? (
                <Link href={`/vendors/${contact.vendor.id}`} className="text-emerald-600 hover:underline">
                  🧾 {contact.vendor.name}
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
