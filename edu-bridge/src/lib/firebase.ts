// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
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

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If app already initialized, use existing instance
  if ((error as { code?: string })?.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'edu-bridge-secondary');
  } else {
    throw error;
  }
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable Firestore persistence for better offline support
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not available in this browser.');
    }
  });
}

export { app, auth, db, storage };