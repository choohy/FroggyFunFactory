import VendorForm from "@/components/vendors/VendorForm";

export default function NewVendorPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add Vendor</h1>
      <VendorForm />
    </div>
  );
}
