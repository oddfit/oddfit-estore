// src/services/inventory.ts
// Firestore-based inventory service
// Collection: "inventory"
// Doc ID: `${productId}_${size}`
// Fields: { productId: string, size: string, stock: number, updatedAt: serverTimestamp() }

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

const db = getFirestore();
const COL = 'inventory';

export type InventoryRow = {
  productId: string;
  size: string;
  stock: number;
  updatedAt?: any;
};

// ---------- helpers (validation + ids) ----------
function norm(v: string | undefined | null) {
  return String(v ?? '').trim();
}
function requireIds(productId: string | undefined, size: string | undefined) {
  const p = norm(productId);
  const s = norm(size);
  if (!p) throw new Error('inventory: productId is required');
  if (!s) throw new Error('inventory: size is required');
  return { p, s };
}
const invDocId = (productId: string, size: string) => {
  const { p, s } = requireIds(productId, size);
  return `${p}_${s}`;
};

// ---------- reads ----------
/** Map of size -> stock for a product (ProductDetailPage). */
export async function getInventoryForProduct(
  productId: string
): Promise<Record<string, number>> {
  const pid = norm(productId);
  console.debug('[inventory.service] getInventoryForProduct', { productId: pid });
  if (!pid) return {};
  const q = query(collection(db, COL), where('productId', '==', pid));
  const snap = await getDocs(q);
  const map: Record<string, number> = {};
  snap.forEach((d) => {
    const data = d.data() as InventoryRow;
    if (data?.size) map[data.size] = Number(data.stock || 0);
  });
  console.debug('[inventory.service] getInventoryForProduct -> sizes', Object.keys(map));
  return map;
}

/** All rows across all products (Admin Dashboard inventory KPIs). */
export async function getAll(): Promise<(InventoryRow & { id: string })[]> {
  console.debug('[inventory.service] getAll');
  const snap = await getDocs(collection(db, COL));
  const rows: (InventoryRow & { id: string })[] = [];
  snap.forEach((d) => {
    const v = d.data() as InventoryRow;
    rows.push({
      id: d.id,
      productId: norm(v.productId),
      size: norm(v.size),
      stock: Number(v.stock || 0),
      updatedAt: (v as any).updatedAt ?? null,
    });
  });
  console.debug('[inventory.service] getAll -> count', rows.length);
  return rows;
}

/** Array of rows for one product (AdminInventory page). */
export async function getByProduct(productId: string): Promise<InventoryRow[]> {
  const pid = norm(productId);
  console.debug('[inventory.service] getByProduct', { productId: pid });
  if (!pid) return [];
  const q = query(collection(db, COL), where('productId', '==', pid));
  const snap = await getDocs(q);
  const rows: InventoryRow[] = [];
  snap.forEach((d) => {
    const data = d.data() as InventoryRow;
    rows.push({
      productId: norm(data.productId),
      size: norm(data.size),
      stock: Number(data.stock || 0),
      updatedAt: (data as any).updatedAt ?? null,
    });
  });
  rows.sort((a, b) => a.size.localeCompare(b.size));
  console.debug('[inventory.service] getByProduct -> count', rows.length);
  return rows;
}

/** Read current stock for (productId, size). */
export async function getStock(productId: string, size: string): Promise<number> {
  const { p, s } = requireIds(productId, size);
  console.debug('[inventory.service] getStock', { productId: p, size: s });
  const ref = doc(db, COL, invDocId(p, s));
  const snap = await getDoc(ref);
  if (!snap.exists()) return 0;
  const data = snap.data() as InventoryRow;
  return Number(data.stock || 0);
}

// ---------- writes ----------
/** Admin helper: create or update one row (canonical). */
export async function upsertInventory(row: InventoryRow): Promise<void> {
  const { p, s } = requireIds(row.productId, row.size);
  const payload = {
    productId: p,
    size: s,
    stock: Number(row.stock || 0),
    updatedAt: serverTimestamp(),
  };
  console.debug('[inventory.service] upsertInventory', { ...payload, stock: payload.stock });

  const ref = doc(db, COL, `${p}_${s}`);
  await setDoc(ref, payload, { merge: true });
}

/** Admin helper: simple alias used by AdminInventory. */
export async function upsert(row: { productId: string; size: string; qty: number }) {
  const { p, s } = requireIds(row.productId, row.size);
  const stock = Number(row.qty || 0);
  console.debug('[inventory.service] upsert (alias)', { productId: p, size: s, stock });
  return upsertInventory({ productId: p, size: s, stock });
}

/** Admin helper: set an absolute stock value. */
export async function setStock(
  productId: string,
  size: string,
  stock: number
): Promise<void> {
  const { p, s } = requireIds(productId, size);
  const payload = { productId: p, size: s, stock: Number(stock || 0), updatedAt: serverTimestamp() };
  console.debug('[inventory.service] setStock', payload);
  const ref = doc(db, COL, `${p}_${s}`);
  await setDoc(ref, payload, { merge: true });
}

/** Admin helper: delete a row completely. */
export async function removeInventory(productId: string, size: string): Promise<void> {
  const { p, s } = requireIds(productId, size);
  console.debug('[inventory.service] removeInventory', { productId: p, size: s });
  const ref = doc(db, COL, `${p}_${s}`);
  await deleteDoc(ref);
}

/** Atomically decrement multiple rows; throws if missing/insufficient. */
export async function decrementBatch(
  lines: { productId: string; size: string; qty: number }[]
): Promise<void> {
  console.debug('[inventory.service] decrementBatch lines', lines);
  await runTransaction(db, async (tx) => {
    const refs = lines.map((l) => {
      const { p, s } = requireIds(l.productId, l.size);
      if (!(l.qty > 0)) throw new Error('Quantity must be > 0.');
      return doc(db, COL, `${p}_${s}`);
    });

    const snaps = await Promise.all(refs.map((r) => tx.get(r)));

    // Validate availability
    snaps.forEach((snap, i) => {
      const { qty, size } = lines[i];
      if (!snap.exists()) throw new Error(`Inventory not found for size "${size}".`);
      const curr = Number((snap.data() as any).stock || 0);
      if (curr < qty) throw new Error(`Insufficient stock for size "${size}".`);
    });

    // Apply decrements
    snaps.forEach((snap, i) => {
      const ref = refs[i];
      const curr = Number((snap.data() as any).stock || 0);
      const next = curr - lines[i].qty;
      tx.update(ref, { stock: next, updatedAt: serverTimestamp() });
    });
  });
  console.debug('[inventory.service] decrementBatch OK');
}
