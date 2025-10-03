'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to dashboard
        router.push('/dashboard');
      } else {
        // Redirect unauthenticated users to auth page
        router.push('/auth');
      }
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth state
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-[100px] h-[100px] mx-auto mb-4 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="EduBridge+ Logo"
            width={100}
            height={100}
            className="object-contain"
            priority
          />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading EduBridge+...</p>
      </div>
    </div>
  );
}