// src/services/addresses.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Address } from '../types';

export type AddressCreate = Omit<Address, 'id'>; // {type,name,phone,addressLine1,...,isDefault}

const col = (uid: string) => collection(db, 'users', uid, 'addresses');

export async function getAddresses(uid: string): Promise<Address[]> {
  const snap = await getDocs(col(uid));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Address[];
}

export async function createAddress(uid: string, data: AddressCreate): Promise<string> {
  const ref = await addDoc(col(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (data.isDefault) {
    await setDefaultAddress(uid, ref.id);
  }
  return ref.id;
}

export async function updateAddress(
  uid: string,
  id: string,
  data: Partial<AddressCreate>
) {
  const ref = doc(db, 'users', uid, 'addresses', id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  if (data.isDefault === true) {
    await setDefaultAddress(uid, id);
  }
}

export async function deleteAddress(uid: string, id: string) {
  const ref = doc(db, 'users', uid, 'addresses', id);
  await deleteDoc(ref);
}

/** Ensure only one default; unsets others in one batch. */
export async function setDefaultAddress(uid: string, id: string) {
  const batch = writeBatch(db);
  const q = query(col(uid), where('isDefault', '==', true));
  const snap = await getDocs(q);
  snap.forEach((d) => {
    if (d.id !== id) batch.update(d.ref, { isDefault: false, updatedAt: serverTimestamp() });
  });
  batch.update(doc(db, 'users', uid, 'addresses', id), {
    isDefault: true,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}
