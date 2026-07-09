export type Venue = {
  id: string;
  name: string;
  address: string | null;
  capacity: number | null;
  cost: number | null;
  costNotes: string | null;
  pitch: string | null;
  features: string[];
  isFavorite: boolean;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

export type VenueInput = {
  name: string;
  address: string | null;
  capacity: number | null;
  cost: number | null;
  costNotes: string | null;
  pitch: string | null;
  features: string[];
  notes: string | null;
};

export type Vendor = {
  id: string;
  name: string;
  serviceType: string | null;
  pricingNotes: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

export type VendorInput = {
  name: string;
  serviceType: string | null;
  pricingNotes: string | null;
  notes: string | null;
};

export type Contact = {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  venueId: string | null;
  venueName: string | null;
  vendorId: string | null;
  vendorName: string | null;
  createdAt: number;
  updatedAt: number;
};

export type ContactInput = {
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  venueId: string | null;
  vendorId: string | null;
};
