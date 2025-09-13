/**
 * Advanced Connection Manager for Firebase in Serverless Environments
 * Handles WebChannel transport issues and connection stability
 */

import { getDb } from './firebase-enhanced';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Connection health monitoring
let connectionAttempts = 0;
let lastSuccessfulConnection = 0;
let connectionHealth = 'healthy';

/**
 * Check Firebase connection health
 */
export async function checkConnectionHealth(): Promise<boolean> {
  try {
    const startTime = Date.now();
    const testRef = doc(getDb(), '_connection_tests', 'health_check');
    
    // Try a quick read operation
    await getDoc(testRef);
    
    const responseTime = Date.now() - startTime;
    lastSuccessfulConnection = Date.now();
    connectionAttempts = 0;
    connectionHealth = 'healthy';
    
    console.log(`✅ Connection healthy (${responseTime}ms)`);
    return true;
  } catch (error) {
    connectionAttempts++;
    const errorCode = (error as { code?: string })?.code;
    
    if (connectionAttempts > 3) {
      connectionHealth = 'degraded';
      console.warn('⚠️ Connection degraded, multiple failures detected');
    }
    
    console.warn(`❌ Connection check failed (attempt ${connectionAttempts}):`, errorCode);
    return false;
  }
}

/**
 * Enhanced retry strategy with circuit breaker pattern
 */
export async function executeWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    timeout?: number;
    fallback?: () => Promise<T>;
  } = {}
): Promise<T> {
  const { maxRetries = 3, timeout = 10000, fallback } = options;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check connection health before attempting
      if (connectionHealth === 'degraded' && attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Extra delay for degraded connections
      }

      // Execute with timeout
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
      ]);

      // Reset health on success
      if (connectionHealth === 'degraded') {
        connectionHealth = 'healthy';
        console.log('✅ Connection restored');
      }

      return result;
    } catch (error) {
      lastError = error;
      const errorCode = (error as { code?: string })?.code;
      
      console.warn(`⚠️ Operation attempt ${attempt}/${maxRetries} failed:`, errorCode);

      // Don't retry on certain errors
      if (errorCode === 'permission-denied' || errorCode === 'not-found') {
        throw error;
      }

      // Exponential backoff with jitter for serverless
      if (attempt < maxRetries) {
        const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        const jitter = Math.random() * 500;
        const delay = baseDelay + jitter;
        
        console.log(`🔄 Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Try fallback if available
  if (fallback) {
    try {
      console.log('🛡️ Using fallback operation');
      return await fallback();
    } catch (fallbackError) {
      console.warn('❌ Fallback operation failed:', fallbackError);
    }
  }

  throw lastError;
}

/**
 * Connection-specific document getter
 */
export async function getDocumentWithConnectionRetry(
  collectionPath: string, 
  documentId: string,
  options: { maxRetries?: number; timeout?: number } = {}
) {
  return executeWithCircuitBreaker(async () => {
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
  }, options);
}

/**
 * Connection-specific document setter
 */
export async function setDocumentWithConnectionRetry(
  collectionPath: string,
  documentId: string,
  data: Record<string, unknown>,
  options: { merge?: boolean; maxRetries?: number; timeout?: number } = {}
) {
  return executeWithCircuitBreaker(async () => {
    const docRef = doc(getDb(), collectionPath, documentId);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: options.merge });
    
    return {
      success: true,
      id: documentId
    };
  }, options);
}

/**
 * Initialize connection monitoring
 */
export function initializeConnectionMonitoring() {
  // Check connection health every 30 seconds
  setInterval(async () => {
    await checkConnectionHealth();
  }, 30000);

  // Initial check
  checkConnectionHealth().catch(console.error);
}

// Export connection status
export function getConnectionStatus() {
  return {
    health: connectionHealth,
    attempts: connectionAttempts,
    lastSuccess: lastSuccessfulConnection
  };
}