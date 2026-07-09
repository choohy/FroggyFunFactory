import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cardClass } from "@/components/ui";
import RequireAuth from "@/components/RequireAuth";
import VendorForm from "@/components/vendors/VendorForm";
import { getVendor } from "@/lib/vendors";
import type { Vendor } from "@/lib/types";

export default function VendorEdit() {
  return (
    <RequireAuth>
      <VendorEditContent />
    </RequireAuth>
  );
}

function VendorEditContent() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getVendor(id).then((v) => {
      if (!cancelled) setVendor(v);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (vendor === undefined) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (vendor === null) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Vendor not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Edit {vendor.name}</h1>
      <VendorForm vendor={vendor} />
    </div>
  );
}
