/**
 * Enhanced Firebase Configuration for Vercel Serverless Environment
 * Optimized for WebChannel transport issues and connection stability
 */

import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCNlc-l1Mrfusljyw_9w0KUWpYkyKihHFc',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'edubridge-e5cba.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'edubridge-e5cba',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'edubridge-e5cba.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '936901717954',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:936901717954:web:7db68d1923f1874040705b',
};

// Singleton pattern to prevent multiple Firebase instances
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

/**
 * Enhanced Firebase initialization with serverless-specific optimizations
 */
function initializeFirebaseEnhanced() {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully with enhanced settings');
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'app/duplicate-app') {
        app = initializeApp(firebaseConfig, 'edu-bridge-enhanced');
        console.log('Firebase enhanced standalone instance created');
      } else {
        console.error('Firebase initialization error:', error);
        throw error;
      }
    }
  }

  if (!auth) {
    auth = getAuth(app);
    // Set auth persistence to NONE for serverless
    import('firebase/auth').then(({ setPersistence, browserLocalPersistence }) => {
      setPersistence(auth!, browserLocalPersistence).catch(() => {
        console.log('Auth persistence disabled for serverless environment');
      });
    });
  }

  if (!db) {
    // Enhanced Firestore initialization for serverless
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true, // Force long polling instead of WebChannel
      experimentalAutoDetectLongPolling: true, // Auto-detect best transport
    });
    
    console.log('Firestore initialized with enhanced serverless settings');
  }

  if (!storage) {
    storage = getStorage(app);
  }

  return { app, auth, db, storage };
}

// Initialize Firebase immediately
const firebaseServices = initializeFirebaseEnhanced();

// Export getters that ensure non-null values
export function getApp() {
  if (!app) throw new Error('Firebase app not initialized');
  return app;
}

export function getAuthInstance() {
  if (!auth) throw new Error('Firebase auth not initialized');
  return auth;
}

export function getDb() {
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

export function getStorageInstance() {
  if (!storage) throw new Error('Firebase storage not initialized');
  return storage;
}

// Legacy exports
export { app, auth, db, storage };
export default firebaseServices;