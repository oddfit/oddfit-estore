// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
  PhoneAuthProvider,
  linkWithCredential,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  sendOTP: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

/* -------------------- Cart merge from local stash -------------------- */
type StashedItem = {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  name?: string;
  image?: string | null;
};
type StashShape = { uid: string | null; items: StashedItem[] };

const STASH_KEY = 'merge_cart';

function mergeItems(existing: StashedItem[], incoming: StashedItem[]) {
  const key = (i: StashedItem) => `${i.productId}__${i.size}__${i.color}`;
  const map = new Map<string, StashedItem>();

  for (const it of existing) {
    map.set(key(it), {
      ...it,
      quantity: Number(it.quantity || 0),
      price: Number(it.price || 0),
    });
  }
  for (const it of incoming) {
    const k = key(it);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, {
        ...it,
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0),
      });
    } else {
      map.set(k, {
        ...prev,
        quantity: prev.quantity + Number(it.quantity || 0),
        // keep existing price/name/image; change if you prefer incoming
      });
    }
  }
  return Array.from(map.values());
}

async function finalizeCartMergeFor(user: FirebaseUser) {
  const raw = localStorage.getItem(STASH_KEY);
  if (!raw) return; // nothing stashed

  try {
    const stash: StashShape = JSON.parse(raw);
    const incoming = Array.isArray(stash?.items) ? stash.items : [];
    if (!incoming.length) {
      localStorage.removeItem(STASH_KEY);
      return;
    }

    // If you linked credentials and kept the same UID, nothing to do.
    if (stash.uid && stash.uid === user.uid) {
      localStorage.removeItem(STASH_KEY);
      return;
    }

    const targetRef = doc(db, 'carts', user.uid);
    const snap = await getDoc(targetRef);
    const existingItems: StashedItem[] = (snap.exists() ? (snap.data() as any).items || [] : []).map(
      (i: any) => ({
        productId: String(i?.productId || ''),
        size: String(i?.size || ''),
        color: String(i?.color || ''),
        quantity: Number(i?.quantity || 0),
        price: Number(i?.price || 0),
        name: i?.name || '',
        image: i?.image ?? null,
      })
    );

    const merged = mergeItems(existingItems, incoming);
    const total = merged.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0), 0);

    await setDoc(
      targetRef,
      {
        userId: user.uid, // optional; rules use the doc id, but nice to have
        items: merged,
        total,
        createdAt: snap.exists() ? (snap.data() as any).createdAt ?? new Date() : new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    localStorage.removeItem(STASH_KEY);
    console.log('[cart] merged from guest → user', { mergedCount: merged.length });
  } catch (err) {
    console.log('[cart] merge skipped:', err);
    // keep stash so we can try again on next auth state change
  }
}
/* -------------------------------------------------------------------- */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mergedUidRef = useRef<string | null>(null); // avoid duplicate merges per UID

  const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    try {
      const formatted = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      return await signInWithPhoneNumber(auth, formatted, recaptchaVerifier);
    } catch (error: any) {
      if (error.code === 'auth/invalid-phone-number') throw new Error('Invalid phone number format.');
      if (error.code === 'auth/too-many-requests') throw new Error('Too many attempts. Try again later.');
      if (error.code === 'auth/captcha-check-failed') throw new Error('Security verification failed.');
      if (error.code === 'auth/quota-exceeded') throw new Error('SMS quota exceeded. Please try later.');
      if (error.code === 'auth/network-request-failed') throw new Error('Network error. Check your connection.');
      throw new Error(error.message || 'Authentication error.');
    }
  };

  const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string, name?: string) => {
    try {
      const verificationId = (confirmationResult as any).verificationId;
      if (!verificationId) throw new Error('Missing verificationId');

      const cred = PhoneAuthProvider.credential(verificationId, otp);
      let userCred;

      if (auth.currentUser?.isAnonymous) {
        try {
          // Prefer linking (keeps the same UID → cart already belongs to this UID)
          userCred = await linkWithCredential(auth.currentUser, cred);
        } catch (err: any) {
          // If that phone already belongs to an account, sign into that account instead
          if (
            err?.code === 'auth/credential-already-in-use' ||
            err?.code === 'auth/account-exists-with-different-credential'
          ) {
            userCred = await signInWithCredential(auth, cred);
          } else {
            throw err;
          }
        }
      } else {
        userCred = await signInWithCredential(auth, cred);
      }

      const user = userCred.user;

      // Upsert profile
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data() : {};

      await setDoc(
        ref,
        {
          name: name ?? (existing as any).name ?? user.displayName ?? '',
          phone: user.phoneNumber || (existing as any).phone || '',
          addresses: (existing as any).addresses || [],
          createdAt: snap.exists() ? (existing as any).createdAt ?? new Date() : new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );

      if (name && (!user.displayName || user.displayName !== name)) {
        await updateProfile(user, { displayName: name });
      }

      // 🔑 Merge the guest cart (if any) into this user's cart
      await finalizeCartMergeFor(user);
      mergedUidRef.current = user.uid;
    } catch (error: any) {
      if (error.code === 'auth/invalid-verification-code') throw new Error('Invalid OTP.');
      if (error.code === 'auth/code-expired') throw new Error('OTP expired. Request a new one.');
      if (error.code === 'auth/too-many-requests') throw new Error('Too many attempts. Try again later.');
      throw new Error(error.message || 'Verification failed.');
    }
  };

  const logout = async () => {
    await auth.signOut();
    try {
      await signInAnonymously(auth); // back to guest
    } catch (e) {
      console.error('Anonymous sign-in after logout failed:', e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        auth.useDeviceLanguage();
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error('Auth init failed (is Anonymous provider enabled?):', e);
      }
    })();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      setCurrentUser(user);

      // Try merging once per UID (in case the OTP page navigates before verifyOTP finishes)
      if (!user.isAnonymous && mergedUidRef.current !== user.uid) {
        await finalizeCartMergeFor(user);
        mergedUidRef.current = user.uid;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const d = userDoc.data() as any;
          setUserProfile({
            id: user.uid,
            name: d.name || user.displayName || '',
            phone: d.phone || user.phoneNumber || '',
            addresses: d.addresses || [],
            createdAt: d.createdAt?.toDate?.() || new Date(),
            updatedAt: d.updatedAt?.toDate?.() || new Date(),
          });
        } else {
          setUserProfile(null);
        }
      } catch {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    sendOTP,
    verifyOTP,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
