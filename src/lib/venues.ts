import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { Venue, VenueInput } from "@/lib/types";

const venuesCollection = collection(db, "venues");

function toVenue(id: string, data: Record<string, unknown>): Venue {
  return {
    id,
    name: (data.name as string) ?? "",
    address: (data.address as string | null) ?? null,
    capacity: (data.capacity as number | null) ?? null,
    cost: (data.cost as number | null) ?? null,
    costNotes: (data.costNotes as string | null) ?? null,
    pitch: (data.pitch as string | null) ?? null,
    features: (data.features as string[] | undefined) ?? [],
    isFavorite: Boolean(data.isFavorite),
    notes: (data.notes as string | null) ?? null,
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
    updatedAt: (data.updatedAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

export async function listVenues(): Promise<Venue[]> {
  const snapshot = await getDocs(query(venuesCollection, orderBy("name", "asc")));
  const venues = snapshot.docs.map((d) => toVenue(d.id, d.data()));
  // Favorited venues first, otherwise keep the name-ascending order from the query.
  return venues.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));
}

export async function getVenue(id: string): Promise<Venue | null> {
  const snap = await getDoc(doc(db, "venues", id));
  if (!snap.exists()) return null;
  return toVenue(snap.id, snap.data());
}

export async function createVenue(input: VenueInput): Promise<string> {
  const docRef = await addDoc(venuesCollection, {
    ...input,
    isFavorite: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateVenue(id: string, input: VenueInput): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "venues", id), {
    ...input,
    updatedAt: serverTimestamp(),
  });

  // Keep the denormalized venue name on any linked contacts in sync.
  const linkedContacts = await getDocs(
    query(collection(db, "contacts"), where("venueId", "==", id))
  );
  for (const contactDoc of linkedContacts.docs) {
    batch.update(contactDoc.ref, { venueName: input.name });
  }

  await batch.commit();
}

export async function setVenueFavorite(id: string, isFavorite: boolean): Promise<void> {
  await updateDoc(doc(db, "venues", id), { isFavorite });
}

export async function deleteVenue(id: string): Promise<void> {
  const batch = writeBatch(db);

  // Mirror the old onDelete: SetNull behavior by unlinking any contacts.
  const linkedContacts = await getDocs(
    query(collection(db, "contacts"), where("venueId", "==", id))
  );
  for (const contactDoc of linkedContacts.docs) {
    batch.update(contactDoc.ref, { venueId: null, venueName: null });
  }

  batch.delete(doc(db, "venues", id));
  await batch.commit();
}
