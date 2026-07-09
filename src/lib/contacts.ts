import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { Contact, ContactInput } from "@/lib/types";

const contactsCollection = collection(db, "contacts");

function toContact(id: string, data: Record<string, unknown>): Contact {
  return {
    id,
    name: (data.name as string) ?? "",
    role: (data.role as string | null) ?? null,
    email: (data.email as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    venueId: (data.venueId as string | null) ?? null,
    venueName: (data.venueName as string | null) ?? null,
    vendorId: (data.vendorId as string | null) ?? null,
    vendorName: (data.vendorName as string | null) ?? null,
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
    updatedAt: (data.updatedAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

async function resolveLinkNames(
  input: ContactInput
): Promise<{ venueName: string | null; vendorName: string | null }> {
  const venueName = input.venueId
    ? ((await getDoc(doc(db, "venues", input.venueId))).data()?.name as string | undefined) ?? null
    : null;
  const vendorName = input.vendorId
    ? ((await getDoc(doc(db, "vendors", input.vendorId))).data()?.name as string | undefined) ?? null
    : null;
  return { venueName, vendorName };
}

export async function listContacts(): Promise<Contact[]> {
  const snapshot = await getDocs(query(contactsCollection, orderBy("name", "asc")));
  return snapshot.docs.map((d) => toContact(d.id, d.data()));
}

export async function listRecentContacts(count: number): Promise<Contact[]> {
  const snapshot = await getDocs(
    query(contactsCollection, orderBy("createdAt", "desc"), limit(count))
  );
  return snapshot.docs.map((d) => toContact(d.id, d.data()));
}

export async function listContactsByVenue(venueId: string): Promise<Contact[]> {
  const snapshot = await getDocs(query(contactsCollection, where("venueId", "==", venueId)));
  return snapshot.docs.map((d) => toContact(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listContactsByVendor(vendorId: string): Promise<Contact[]> {
  const snapshot = await getDocs(query(contactsCollection, where("vendorId", "==", vendorId)));
  return snapshot.docs.map((d) => toContact(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getContact(id: string): Promise<Contact | null> {
  const snap = await getDoc(doc(db, "contacts", id));
  if (!snap.exists()) return null;
  return toContact(snap.id, snap.data());
}

export async function createContact(input: ContactInput): Promise<string> {
  const { venueName, vendorName } = await resolveLinkNames(input);
  const docRef = await addDoc(contactsCollection, {
    ...input,
    venueName,
    vendorName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateContact(id: string, input: ContactInput): Promise<void> {
  const { venueName, vendorName } = await resolveLinkNames(input);
  await updateDoc(doc(db, "contacts", id), {
    ...input,
    venueName,
    vendorName,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteContact(id: string): Promise<void> {
  await deleteDoc(doc(db, "contacts", id));
}
