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
} from 'firebase/firestore';
import { db } from './firebase';

/** Replace undefined -> null so Firestore won't reject the write */
const scrubUndefined = (obj: any) =>
  JSON.parse(JSON.stringify(obj, (_k, v) => (v === undefined ? null : v)));

export class FirestoreService {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Create a new document (uses server timestamps + scrubbing)
  async create(data: any) {
    try {
      const clean = scrubUndefined(data);
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
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
