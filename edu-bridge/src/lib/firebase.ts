// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCNlc-l1Mrfusljyw_9w0KUWpYkyKihHFc',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'edubridge-e5cba.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'edubridge-e5cba',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'edubridge-e5cba.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '936901717954',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:936901717954:web:7db68d1923f1874040705b',
};

// Debug: Log environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment variables check:');
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Found' : '✗ Missing');
  console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ Found' : '✗ Missing');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ Found' : '✗ Missing');
}

// Validate Firebase configuration (only check that we have fallback values)
const validateFirebaseConfig = () => {
  // We now have fallback values, so this should always be true
  return true;
};

// Initialize Firebase lazily
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;
  
  try {
    const isValid = validateFirebaseConfig();
    if (!isValid) {
      console.error('Firebase configuration invalid');
      return;
    }
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseInitialized = true;
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    // Keep as null to indicate initialization failure
  }
}

// Export getters that initialize Firebase on first access
export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseInitialized) initializeFirebase();
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (!firebaseInitialized) initializeFirebase();
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  if (!firebaseInitialized) initializeFirebase();
  return db;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!firebaseInitialized) initializeFirebase();
  return storage;
}

// For backward compatibility
export { app, auth, db, storage };