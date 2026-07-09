import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase";
import type { Vendor, VendorInput } from "@/lib/types";

const vendorsCollection = collection(db, "vendors");

function toVendor(id: string, data: Record<string, unknown>): Vendor {
  return {
    id,
    name: (data.name as string) ?? "",
    serviceType: (data.serviceType as string | null) ?? null,
    pricingNotes: (data.pricingNotes as string | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
    updatedAt: (data.updatedAt as { toMillis?: () => number })?.toMillis?.() ?? 0,
  };
}

export async function listVendors(): Promise<Vendor[]> {
  const snapshot = await getDocs(query(vendorsCollection, orderBy("name", "asc")));
  return snapshot.docs.map((d) => toVendor(d.id, d.data()));
}

export async function getVendor(id: string): Promise<Vendor | null> {
  const snap = await getDoc(doc(db, "vendors", id));
  if (!snap.exists()) return null;
  return toVendor(snap.id, snap.data());
}

export async function createVendor(input: VendorInput): Promise<string> {
  const docRef = await addDoc(vendorsCollection, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateVendor(id: string, input: VendorInput): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "vendors", id), {
    ...input,
    updatedAt: serverTimestamp(),
  });

  const linkedContacts = await getDocs(
    query(collection(db, "contacts"), where("vendorId", "==", id))
  );
  for (const contactDoc of linkedContacts.docs) {
    batch.update(contactDoc.ref, { vendorName: input.name });
  }

  await batch.commit();
}

export async function deleteVendor(id: string): Promise<void> {
  const batch = writeBatch(db);

  const linkedContacts = await getDocs(
    query(collection(db, "contacts"), where("vendorId", "==", id))
  );
  for (const contactDoc of linkedContacts.docs) {
    batch.update(contactDoc.ref, { vendorId: null, vendorName: null });
  }

  batch.delete(doc(db, "vendors", id));
  await batch.commit();
}
