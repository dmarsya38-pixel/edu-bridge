/**
 * Vercel-Optimized Firestore Utilities
 * Handles connection issues specific to Vercel serverless environment
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from './firebase';

/**
 * Enhanced document getter with Vercel-specific error handling and WebChannel fixes
 */
export async function getDocumentWithRetry(collectionPath: string, documentId: string, maxRetries = 5) {
  let lastError: unknown = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firestore operation timeout')), 15000);
      });
      
      const operationPromise = (async () => {
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
      })();
      
      const result = await Promise.race([operationPromise, timeoutPromise]);
      return result;
      
    } catch (error) {
      lastError = error;
      const errorMessage = (error as Error)?.message || 'Unknown error';
      const errorCode = (error as { code?: string })?.code;
      
      console.warn(`Firestore attempt ${attempt}/${maxRetries} failed:`, errorMessage, `(Code: ${errorCode})`);
      
      // Don't retry on certain errors
      if (errorCode === 'permission-denied' || errorCode === 'not-found') {
        break;
      }
      
      // Special handling for WebChannel and offline errors
      if (errorMessage.includes('WebChannel') || errorMessage.includes('offline') || errorMessage.includes('network') || errorMessage.includes('transport') || errorMessage.includes('RPC')) {
        console.log('Detected WebChannel/transport error, will retry with backoff...');
      }
      
      // Enhanced exponential backoff for serverless
      if (attempt < maxRetries) {
        const baseDelay = Math.min(2000 * Math.pow(2, attempt - 1), 10000); // Increased base delay
        const jitter = Math.random() * 1000; // Increased jitter
        const delay = baseDelay + jitter;
        
        console.log(`Retrying in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${maxRetries})`);
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
 * Enhanced document setter with Vercel-specific error handling and WebChannel fixes
 */
export async function setDocumentWithRetry(
  collectionPath: string, 
  documentId: string, 
  data: Record<string, unknown>, 
  options: { merge?: boolean } = {},
  maxRetries = 5
) {
  let lastError: unknown = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Firestore write timeout')), 20000); // Longer timeout for writes
      });
      
      const operationPromise = (async () => {
        const docRef = doc(getDb(), collectionPath, documentId);
        await setDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        }, options);
        
        return {
          success: true,
          id: documentId
        };
      })();
      
      const result = await Promise.race([operationPromise, timeoutPromise]);
      return result;
      
    } catch (error) {
      lastError = error;
      const errorMessage = (error as Error)?.message || 'Unknown error';
      const errorCode = (error as { code?: string })?.code;
      
      console.warn(`Firestore write attempt ${attempt}/${maxRetries} failed:`, errorMessage, `(Code: ${errorCode})`);
      
      // Don't retry on certain errors
      if (errorCode === 'permission-denied') {
        break;
      }
      
      // Special handling for WebChannel and offline errors
      if (errorMessage.includes('WebChannel') || errorMessage.includes('offline') || errorMessage.includes('network') || errorMessage.includes('transport') || errorMessage.includes('RPC')) {
        console.log('Detected WebChannel/transport error on write, will retry with backoff...');
      }
      
      // Enhanced exponential backoff for serverless writes
      if (attempt < maxRetries) {
        const baseDelay = Math.min(3000 * Math.pow(2, attempt - 1), 12000); // Increased for writes
        const jitter = Math.random() * 1500; // Increased jitter
        const delay = baseDelay + jitter;
        
        console.log(`Retrying write in ${Math.round(delay)}ms... (attempt ${attempt + 1}/${maxRetries})`);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await getDocumentWithRetry('users', uid) as any;
  
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