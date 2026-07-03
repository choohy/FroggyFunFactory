import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ContactForm from "@/components/contacts/ContactForm";

export const dynamic = "force-dynamic";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contact, venues, vendors] = await Promise.all([
    prisma.contact.findUnique({ where: { id } }),
    prisma.venue.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!contact) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit {contact.name}</h1>
      <ContactForm contact={contact} venues={venues} vendors={vendors} />
    </div>
  );
}
