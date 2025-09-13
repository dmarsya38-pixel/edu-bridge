/**
 * Firebase Configuration with Long Polling for Vercel Serverless
 * Alternative approach when WebChannel transport fails
 */

import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCNlc-l1Mrfusljyw_9w0KUWpYkyKihHFc',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'edubridge-e5cba.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'edubridge-e5cba',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'edubridge-e5cba.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '936901717954',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:936901717954:web:7db68d1923f1874040705b',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

/**
 * Initialize Firebase with long polling configuration
 * This bypasses WebChannel transport issues in serverless environments
 */
function initializeFirebaseLongPolling() {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig, 'edu-bridge-longpolling');
      console.log('Firebase initialized with long polling configuration');
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'app/duplicate-app') {
        app = initializeApp(firebaseConfig, 'edu-bridge-longpolling-fallback');
        console.log('Firebase long polling fallback instance created');
      } else {
        console.error('Firebase long polling initialization error:', error);
        throw error;
      }
    }
  }

  if (!auth) {
    auth = getAuth(app);
    // Configure auth for serverless
    auth.settings.appVerificationDisabledForTesting = false;
  }

  if (!db) {
    // Force long polling to avoid WebChannel issues
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true,
      experimentalLongPollingOptions: {
        timeoutSeconds: 30,
      },
    });
    
    console.log('Firestore configured with long polling transport');
  }

  if (!storage) {
    storage = getStorage(app);
  }

  return { app, auth, db, storage };
}

// Initialize with long polling
const firebaseServices = initializeFirebaseLongPolling();

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

export { app, auth, db, storage };
export default firebaseServices;