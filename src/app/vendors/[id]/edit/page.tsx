import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VendorForm from "@/components/vendors/VendorForm";

export const dynamic = "force-dynamic";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });

  if (!vendor) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit {vendor.name}</h1>
      <VendorForm vendor={vendor} />
    </div>
  );
}
