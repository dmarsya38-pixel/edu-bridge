'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (error) {
        // Show error state instead of redirecting
        console.error('Auth error:', error);
        return;
      }
      
      if (user) {
        // Redirect authenticated users to dashboard
        router.push('/dashboard');
      } else {
        // Redirect unauthenticated users to auth page
        router.push('/auth');
      }
    }
  }, [user, loading, error, router]);

  // Show loading spinner while checking auth state
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">E+</span>
        </div>
        {error ? (
          <div className="text-red-500 mb-4">
            <p className="font-medium">Configuration Error</p>
            <p className="text-sm">Please check environment variables</p>
          </div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading EduBridge+...</p>
          </>
        )}
      </div>
    </div>
  );
}