/**
 * Vercel-Optimized Firestore Utilities
 * Handles connection issues specific to Vercel serverless environment
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase';

/**
 * Enhanced document getter with Vercel-specific error handling
 */
export async function getDocumentWithRetry(collectionPath: string, documentId: string, maxRetries = 3) {
  let lastError: unknown = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const docRef = doc(getDb(), collectionPath, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          success: true,
          data: docSnap.data(),
          id: docSnap.id,
          exists: true
        };
      } else {
        return {
          success: true,
          data: null,
          id: documentId,
          exists: false
        };
      }
    } catch (error) {
      lastError = error;
      console.warn(`Firestore attempt ${attempt}/${maxRetries} failed:`, (error as Error)?.message);
      
      // Don't retry on certain errors
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'permission-denied' || errorCode === 'not-found') {
        break;
      }
      
      // Exponential backoff with jitter
      if (attempt < maxRetries) {
        const delay = Math.min(
          1000 * Math.pow(2, attempt - 1) + Math.random() * 200,
          8000
        );
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('All Firestore attempts failed:', (lastError as Error)?.message);
  return {
    success: false,
    error: lastError,
    data: null,
    exists: false
  };
}

/**
 * Enhanced document setter with Vercel-specific error handling
 */
export async function setDocumentWithRetry(
  collectionPath: string, 
  documentId: string, 
  data: Record<string, unknown>, 
  options: { merge?: boolean } = {},
  maxRetries = 3
) {
  let lastError: unknown = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const docRef = doc(getDb(), collectionPath, documentId);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      }, options);
      
      return {
        success: true,
        id: documentId
      };
    } catch (error) {
      lastError = error;
      console.warn(`Firestore write attempt ${attempt}/${maxRetries} failed:`, (error as Error)?.message);
      
      // Don't retry on certain errors
      const errorCode = (error as { code?: string })?.code;
      if (errorCode === 'permission-denied') {
        break;
      }
      
      // Exponential backoff with jitter
      if (attempt < maxRetries) {
        const delay = Math.min(
          1000 * Math.pow(2, attempt - 1) + Math.random() * 200,
          8000
        );
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('All Firestore write attempts failed:', (lastError as Error)?.message);
  return {
    success: false,
    error: lastError
  };
}

/**
 * Specialized user profile getter for authentication
 */
export async function getUserProfileWithRetry(uid: string) {
  const result = await getDocumentWithRetry('users', uid);
  
  if (result.success && result.exists) {
    return {
      success: true,
      user: result.data
    };
  } else if (result.success && !result.exists) {
    return {
      success: false,
      error: {
        code: 'user-not-found',
        message: 'User profile not found'
      }
    };
  } else {
    return {
      success: false,
      error: {
        code: 'firestore-error',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message: (result.error as any)?.message || 'Failed to fetch user profile'
      }
    };
  }
}

/**
 * Update user last login time
 */
export async function updateUserLastLogin(uid: string) {
  return await setDocumentWithRetry('users', uid, {
    lastLogin: serverTimestamp()
  }, { merge: true });
}