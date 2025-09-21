// src/services/wishlist.ts
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export type WishlistItem = {
  id: string;            // productId
  productId: string;     // same as id
  product?: any;         // small snapshot for quick render
  addedAt?: any;
};

const itemRef = (uid: string, productId: string) =>
  doc(db, 'wishlists', uid, 'items', productId);

export async function isInWishlist(uid: string, productId: string) {
  const snap = await getDoc(itemRef(uid, productId));
  return snap.exists();
}

export async function toggleWishlistForProduct(uid: string, product: any) {
  const ref = itemRef(uid, product.id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false; // now removed
  }
  await setDoc(
    ref,
    {
      productId: product.id,
      product: {
        id: product.id,
        name: product.name ?? product.product_name ?? '',
        price: Number(product.price ?? 0),
        image: Array.isArray(product.images) && product.images[0]
          ? product.images[0]
          : (product as any)?.image_url ?? null,
      },
      addedAt: new Date(),
    },
    { merge: true }
  );
  return true; // now added
}

export async function getWishlist(uid: string): Promise<WishlistItem[]> {
  const snap = await getDocs(collection(db, 'wishlists', uid, 'items'));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function removeFromWishlist(uid: string, productId: string) {
  await deleteDoc(itemRef(uid, productId));
}
