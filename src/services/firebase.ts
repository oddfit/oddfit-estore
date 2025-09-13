import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Replace these with your actual Firebase config values
  apiKey: "AIzaSyCnunf_kT-rRqgYJyRUKzPKT1O1AgwCXRo",
  authDomain: "oddfit-2cce7.firebaseapp.com", 
  projectId: "oddfit-2cce7",
  storageBucket: "oddfit-2cce7.firebasestorage.app",
  messagingSenderId: "769787842608",
  appId: "1:769787842608:web:7395782b9a0ca0b9d51df5"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;