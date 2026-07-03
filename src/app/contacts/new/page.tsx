import { prisma } from "@/lib/prisma";
import ContactForm from "@/components/contacts/ContactForm";

export const dynamic = "force-dynamic";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ venueId?: string; vendorId?: string }>;
}) {
  const { venueId, vendorId } = await searchParams;
  const [venues, vendors] = await Promise.all([
    prisma.venue.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add Contact</h1>
      <ContactForm venues={venues} vendors={vendors} defaultVenueId={venueId} defaultVendorId={vendorId} />
    </div>
  );
}
