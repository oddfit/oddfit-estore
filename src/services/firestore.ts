// src/services/firestore.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query as fsQuery,
  where,
  orderBy,
  limit,
  serverTimestamp,
  QueryConstraint,
  runTransaction,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Sequence doc shape (in `sequences/{name}`):
 * { next: number, start?: number, end?: number, step?: number }
 *
 * - If `start`/`end` are omitted, defaults will be used (start=100001, no end).
 * - If `end` is present, allocator throws when exceeded.
 */
type SequenceDoc = {
  next: number;
  start?: number;
  end?: number;
  step?: number;
};

/** Replace undefined -> null so Firestore won't reject the write */
function makeService(collectionName: string) {
  return {
    async getAll() {
      const q = fsQuery(collection(db, collectionName), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    async getById(id: string) {
      const ref = doc(db, collectionName, id);
      const s = await getDoc(ref);
      return s.exists() ? { id: s.id, ...s.data() } : null;
    },
    async create(data: any) {
      return addDoc(collection(db, collectionName), data);
    },
    async update(id: string, data: any) {
      const ref = doc(db, collectionName, id);
      return updateDoc(ref, data);
    },
    async delete(id: string) {
      const ref = doc(db, collectionName, id);
      return deleteDoc(ref);
    },
  };
}

const scrubUndefined = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_k, v) => (v === undefined ? null : v)));

export function formatSequence(n: number, prefix = 'ODF', pad = 6): string {
  return `${prefix}${String(n).padStart(pad, '0')}`;
}
export class FirestoreService {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Create a new document (uses server timestamps + scrubbing)
  async create(data: any) {
    try {
      console.log(`Creating document in ${this.collectionName} with data:`, data);
      const clean = scrubUndefined(data);
      console.log('Cleaned data:', clean);
      
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log(`Document created successfully with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, {
        error,
        code: (error as any)?.code,
        message: (error as any)?.message,
        details: (error as any)?.details
      });
      throw error;
    }
  }

  // Read a single document by ID
  async getById(id: string) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const snap = await getDoc(docRef);
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
      console.error(`Error fetching document from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Read all documents
  async getAll() {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error(`Error fetching documents from ${this.collectionName}:`, error);
      return [];
    }
  }

  // Update a document (uses server timestamp + scrubbing)
  async update(id: string, data: any) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const clean = scrubUndefined(data);
      await updateDoc(docRef, {
        ...clean,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error updating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Delete a document
  async delete(id: string) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Query documents with filters
  async query(
    filters: { field: string; operator: any; value: any }[] = [],
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
  ) {
    try {
      const base = collection(db, this.collectionName);
      const constraints: QueryConstraint[] = [];

      // Apply filters
      for (const f of filters) {
        constraints.push(where(f.field, f.operator, f.value));
      }

      // Apply ordering
      if (orderByField) {
        constraints.push(orderBy(orderByField, orderDirection));
      }

      // Apply limit
      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = constraints.length ? fsQuery(base, ...constraints) : base;
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error(`Error querying documents from ${this.collectionName}:`, error);
      return [];
    }
  }
}

// Specialized services
export const productsService  = new FirestoreService('products');
export const categoriesService = new FirestoreService('categories');
export const ordersService    = new FirestoreService('orders');

// 🔧 fix: use the same collection name your CartContext uses
export const cartService      = new FirestoreService('carts');

export const usersService     = new FirestoreService('users');
export const returnsService   = new FirestoreService('returns');
export const AdminCustomersService  = makeService('users'); 
export const AdminOrdersService     = makeService('orders');
export const AdminCategoriesService = makeService('categories');
export const AdminReturnsService    = makeService('returns'); 
// Atomic counter stored under: counters/{counterName}  →  { value: number }
export async function getNextSequence(counterName: string, start = 100001): Promise<number> {
  const ref = doc(db, 'counters', counterName);
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    let value: number;

    if (snap.exists()) {
      const curr = (snap.data() as any)?.value;
      const n = typeof curr === 'number' ? curr : start - 1;
      value = n + 1;
    } else {
      // seed the counter on first use
      value = start;
    }

    tx.set(ref, { value, updatedAt: serverTimestamp() }, { merge: true });
    return value;
  });

  return next;
}

