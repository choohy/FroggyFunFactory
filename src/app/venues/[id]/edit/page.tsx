import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VenueForm from "@/components/venues/VenueForm";

export const dynamic = "force-dynamic";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venue = await prisma.venue.findUnique({ where: { id } });

  if (!venue) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit {venue.name}</h1>
      <VenueForm venue={venue} />
    </div>
  );
}
