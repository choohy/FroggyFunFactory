import VenueForm from "@/components/venues/VenueForm";

export default function NewVenuePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add Venue</h1>
      <VenueForm />
    </div>
  );
}
