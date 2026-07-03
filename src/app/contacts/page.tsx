import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonPrimaryClass, cardClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    include: { venue: true, vendor: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            People you work with for events — optionally linked to a venue or vendor.
          </p>
        </div>
        <Link href="/contacts/new" className={buttonPrimaryClass}>
          + Add Contact
        </Link>
      </div>

      {contacts.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No contacts yet. Add your first one to get started.
          </p>
        </div>
      ) : (
        <div className={`${cardClass} p-0 overflow-hidden`}>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left text-xs text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Linked to</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${c.id}`} className="font-medium hover:text-emerald-600">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{c.role || "—"}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{c.phone || "—"}</td>
                  <td className="px-4 py-3">
                    {c.venue ? (
                      <Link href={`/venues/${c.venue.id}`} className="text-emerald-600 hover:underline">
                        🏛️ {c.venue.name}
                      </Link>
                    ) : c.vendor ? (
                      <Link href={`/vendors/${c.vendor.id}`} className="text-emerald-600 hover:underline">
                        🧾 {c.vendor.name}
                      </Link>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
