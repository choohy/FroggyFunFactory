import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cardClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [contactCount, venueCount, vendorCount, recentContacts] =
    await Promise.all([
      prisma.contact.count(),
      prisma.venue.count(),
      prisma.vendor.count(),
      prisma.contact.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { venue: true, vendor: true },
      }),
    ]);

  const stats = [
    { label: "Contacts", count: contactCount, href: "/contacts", emoji: "👤" },
    { label: "Venues", count: venueCount, href: "/venues", emoji: "🏛️" },
    { label: "Vendors", count: vendorCount, href: "/vendors", emoji: "🧾" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Track event management contacts, venues, and vendor details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.href} href={s.href} className={`${cardClass} block hover:border-emerald-400 transition-colors`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-3xl font-semibold">{s.count}</span>
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {s.label}
            </div>
          </Link>
        ))}
      </div>

      <div className={cardClass}>
        <h2 className="font-medium mb-3">Recently added contacts</h2>
        {recentContacts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No contacts yet.{" "}
            <Link href="/contacts" className="text-emerald-600 hover:underline">
              Add your first contact
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentContacts.map((c) => (
              <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                <Link href={`/contacts/${c.id}`} className="font-medium hover:text-emerald-600">
                  {c.name}
                </Link>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {c.venue ? c.venue.name : c.vendor ? c.vendor.name : c.role || "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
