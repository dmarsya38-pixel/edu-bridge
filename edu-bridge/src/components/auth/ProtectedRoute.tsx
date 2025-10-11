'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireVerification?: boolean;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles = ['student', 'lecturer', 'admin'],
  requireVerification = false,
  fallbackPath = '/auth'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Handle redirect when user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push(fallbackPath);
    }
  }, [user, loading, router, fallbackPath]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Return null while waiting for redirect
  if (!user) {
    return null;
  }

  // Check role permissions
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this page. 
            Required role: {allowedRoles.join(' or ')}
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check verification status if required
  if (requireVerification && !user.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-yellow-600 text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Verification</h2>
          <p className="text-gray-600 mb-4">
            Your account is pending admin approval. You&apos;ll receive an email once verified.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

// Convenience wrapper for admin-only routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']} requireVerification>
      {children}
    </ProtectedRoute>
  );
}

// Convenience wrapper for lecturer routes
export function LecturerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['lecturer', 'admin']} requireVerification>
      {children}
    </ProtectedRoute>
  );
}

// Convenience wrapper for verified student routes
export function StudentRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['student', 'lecturer', 'admin']} requireVerification>
      {children}
    </ProtectedRoute>
  );
}