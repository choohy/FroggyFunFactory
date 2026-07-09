import RequireAuth from "@/components/RequireAuth";
import VendorForm from "@/components/vendors/VendorForm";

export default function VendorNew() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add Vendor</h1>
      <RequireAuth>
        <VendorForm />
      </RequireAuth>
    </div>
  );
}
