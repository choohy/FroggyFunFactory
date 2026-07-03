import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buttonSecondaryClass, cardClass } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: { contacts: true },
  });

  if (!vendor) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/vendors" className="text-sm text-emerald-600 hover:underline">
          ← All vendors
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{vendor.name}</h1>
          {vendor.serviceType && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{vendor.serviceType}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/vendors/${vendor.id}/edit`} className={buttonSecondaryClass}>
            Edit
          </Link>
          <DeleteButton url={`/api/vendors/${vendor.id}`} redirectTo="/vendors" confirmMessage={`Delete ${vendor.name}? This will unlink any associated contacts.`} />
        </div>
      </div>

      <div className={cardClass}>
        <dl className="grid grid-cols-1 gap-4">
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pricing notes</dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap">{vendor.pricingNotes || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes</dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap">{vendor.notes || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Linked contacts</h2>
          <Link href={`/contacts/new?vendorId=${vendor.id}`} className="text-sm text-emerald-600 hover:underline">
            + Add contact
          </Link>
        </div>
        {vendor.contacts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No contacts linked yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {vendor.contacts.map((c) => (
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
