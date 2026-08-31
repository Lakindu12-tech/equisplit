import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "new-project-f9748.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:demoapp12345",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMO12345"
};

// Initialize Firebase safely (avoid duplicate initialization)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Modern Modular Multi-Tab IndexedDB Firestore Persistence
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const storage = getStorage(app);
