/**
 * Firebase Configuration for EduBridge+
 * Optimized for Vercel serverless environment
 */

import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
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
let app: any = null; // Firebase app type is not exported, so we use any
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

/**
 * Initialize Firebase services with singleton pattern
 * This prevents multiple app initializations in serverless environment
 */
function initializeFirebase() {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'app/duplicate-app') {
        // If app already exists (can happen in hot reload), get existing instance
        app = initializeApp(firebaseConfig, 'edu-bridge-standalone');
        console.log('Firebase standalone instance created');
      } else {
        console.error('Firebase initialization error:', error);
        throw error;
      }
    }
  }

  if (!auth) {
    auth = getAuth(app);
  }

  if (!db) {
    db = getFirestore(app);
    // IMPORTANT: No persistence for Vercel compatibility
    // Persistence causes 'client is offline' errors in serverless environments
  }

  if (!storage) {
    storage = getStorage(app);
  }

  return { app, auth, db, storage };
}

// Initialize Firebase immediately
const firebaseServices = initializeFirebase();

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

// Legacy exports (use getters above for new code)
export { app, auth, db, storage };
export default firebaseServices;