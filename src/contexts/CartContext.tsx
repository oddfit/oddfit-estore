// src/contexts/CartContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Cart, CartItem, Product } from '../types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  addToCart: (product: Product, size: string, color: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartItemCount: number;
  cartTotal: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  // ----- Helpers -----
  const loadCart = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const cartRef = doc(db, 'carts', currentUser.uid);
      const snap = await getDoc(cartRef);

      if (snap.exists()) {
        const d = snap.data() as any;
        setCart({
          id: cartRef.id,
          userId: d.userId,
          items: (d.items || []) as CartItem[],
          total: Number(d.total || 0),
          createdAt: d.createdAt?.toDate?.() || new Date(),
          updatedAt: d.updatedAt?.toDate?.() || new Date(),
        });
      } else {
        // Try to seed from localStorage (same UID even for anon users)
        const ls = localStorage.getItem(`cart_${currentUser.uid}`);
        let items: CartItem[] = [];
        if (ls) {
          try {
            const parsed = JSON.parse(ls);
            if (Array.isArray(parsed.items)) {
              items = parsed.items.map((it: any) => ({
                id: String(it.id),
                productId: String(it.productId),
                product: it.product ?? null,
                quantity: Number(it.quantity ?? 1),
                size: String(it.size ?? ''),
                color: String(it.color ?? ''),
                price: Number(it.price ?? 0),
              }));
            }
          } catch {
            // ignore parse errors and just start empty
          }
        }
        const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

        await setDoc(
          cartRef,
          {
            userId: currentUser.uid,
            items,
            total,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true }
        );

        setCart({
          id: currentUser.uid,
          userId: currentUser.uid,
          items,
          total,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (err) {
      // Firestore unreachable -> localStorage fallback
      try {
        const saved = localStorage.getItem(`cart_${currentUser!.uid}`);
        if (saved) {
          setCart(JSON.parse(saved));
        } else {
          setCart({
            id: currentUser!.uid,
            userId: currentUser!.uid,
            items: [],
            total: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (localErr) {
        console.error('Error loading cart from localStorage:', localErr);
        setCart({
          id: currentUser!.uid,
          userId: currentUser!.uid,
          items: [],
          total: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async (updated: Cart) => {
    if (!currentUser) return;

    try {
      await setDoc(
        doc(db, 'carts', currentUser.uid),
        {
          userId: updated.userId,
          items: updated.items,
          total: updated.total,
          updatedAt: new Date(),
          createdAt: updated.createdAt || new Date(),
        },
        { merge: true }
      );
      setCart(updated);
      // also mirror to localStorage as a resilience fallback
      localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(updated));
    } catch (err) {
      console.log('Firestore unavailable; persisting to localStorage only');
      try {
        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(updated));
        setCart(updated);
      } catch (localErr) {
        console.error('Error saving cart to localStorage:', localErr);
      }
    }
  };

  // ----- Actions -----
  const addToCart = async (product: Product, size: string, color: string, quantity = 1) => {
    if (!currentUser) return;

    const base: Cart =
      cart || {
        id: currentUser.uid,
        userId: currentUser.uid,
        items: [],
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

    const idx = base.items.findIndex(
      (it) => it.productId === product.id && it.size === size && it.color === color
    );

    let items: CartItem[];
    if (idx >= 0) {
      items = [...base.items];
      items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
    } else {
      const newItem: CartItem = {
        id: `${product.id}-${size}-${color}-${Date.now()}`,
        productId: product.id,
        product: {
          ...product,
          images: (product.images || []).filter((img) => typeof img === 'string'),
          sizes: (product.sizes || []).filter((s) => typeof s === 'string'),
          colors: (product.colors || []).filter((c) => typeof c === 'string'),
        },
        quantity,
        size,
        color,
        price: Number(product.price || 0),
      };
      items = [...base.items, newItem];
    }

    const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

    const updated: Cart = { ...base, items, total, updatedAt: new Date() };
    await saveCart(updated);
  };

  const removeFromCart = async (itemId: string) => {
    if (!currentUser || !cart) return;

    const items = cart.items.filter((it) => it.id !== itemId);
    const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

    const updated: Cart = { ...cart, items, total, updatedAt: new Date() };
    await saveCart(updated);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!currentUser || !cart) return;

    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    const items = cart.items.map((it) => (it.id === itemId ? { ...it, quantity } : it));
    const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

    const updated: Cart = { ...cart, items, total, updatedAt: new Date() };
    await saveCart(updated);
  };

  const clearCart = async () => {
    if (!currentUser || !cart) return;
    const updated: Cart = { ...cart, items: [], total: 0, updatedAt: new Date() };
    await saveCart(updated);
  };

  // ----- Derived -----
  const cartItemCount = cart?.items.reduce((s, it) => s + it.quantity, 0) || 0;
  const cartTotal = cart?.total || 0;

  // ----- Effects -----
  useEffect(() => {
    if (currentUser) {
      loadCart();
    } else {
      setCart(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]); // key off uid changes (anon → linked phone keeps same UID, so still fine)

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartItemCount,
    cartTotal,
    loading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
