// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  isAdmin: boolean;
  loading: boolean;

  sendOTP: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string, name?: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    try {
      const formatted = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      return await signInWithPhoneNumber(auth, formatted, recaptchaVerifier);
    } catch (error: any) {
      if (error.code === 'auth/invalid-phone-number') throw new Error('Invalid phone number format.');
      if (error.code === 'auth/too-many-requests') throw new Error('Too many attempts. Try again later.');
      if (error.code === 'auth/captcha-check-failed') throw new Error('Security verification failed.');
      if (error.code === 'auth/quota-exceeded') throw new Error('SMS quota exceeded. Try again later.');
      if (error.code === 'auth/network-request-failed') throw new Error('Network error. Check your connection.');
      throw new Error(error.message || 'Authentication error.');
    }
  };

  const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string, name?: string) => {
    const verificationId = (confirmationResult as any).verificationId;
    if (!verificationId) throw new Error('Missing verificationId');

    const cred = PhoneAuthProvider.credential(verificationId, otp);
    const userCred = await signInWithCredential(auth, cred);
    const user = userCred.user;

    // Upsert profile in Firestore (do NOT set role here)
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? (snap.data() as any) : {};

    await setDoc(
      ref,
      {
        name: name ?? existing.name ?? user.displayName ?? '',
        phone: user.phoneNumber || existing.phone || '',
        addresses: existing.addresses || [],
        createdAt: snap.exists() ? existing.createdAt ?? new Date() : new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    if (name && (!user.displayName || user.displayName !== name)) {
      await updateProfile(user, { displayName: name });
    }
  };

  const updateName = async (name: string) => {
    if (!auth.currentUser) throw new Error('Not signed in');
    const user = auth.currentUser;

    // Update Firebase Auth displayName
    await updateProfile(user, { displayName: name });

    // Update Firestore
    const ref = doc(db, 'users', user.uid);
    await setDoc(ref, { name, updatedAt: new Date() }, { merge: true });

    // Reflect in local state immediately
    setUserProfile((prev) =>
      prev ? { ...prev, name, updatedAt: new Date() } : prev
    );
  };

  const logout = async () => {
    await auth.signOut();
  };

  useEffect(() => {
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        auth.useDeviceLanguage();
      } catch (e) {
        console.error('Auth init failed:', e);
      }
    })();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const d = userDoc.data() as any;
            setUserProfile({
              id: user.uid,
              name: d.name || user.displayName || '',
              phone: d.phone || user.phoneNumber || '',
              addresses: d.addresses || [],
              role: d.role || 'user',
              createdAt: d.createdAt?.toDate?.() || new Date(),
              updatedAt: d.updatedAt?.toDate?.() || new Date(),
            });
          } else {
            setUserProfile({
              id: user.uid,
              name: user.displayName || '',
              phone: user.phoneNumber || '',
              addresses: [],
              role: 'user',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsub;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    isAdmin: userProfile?.role === 'admin',
    loading,
    sendOTP,
    verifyOTP,
    updateName,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
