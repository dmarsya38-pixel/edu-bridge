'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { LecturerDashboard } from '@/components/dashboard/LecturerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getDashboardComponent = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'lecturer':
        return <LecturerDashboard user={user} />;
      case 'student':
      default:
        return <StudentDashboard user={user} />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="EduBridge+ Logo"
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  EduBridge+
                </h1>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                {/* Notification Center */}
                <NotificationCenter />
                
                {user && (
                  <div className="text-sm">
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {user.fullName}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {user.role === 'student' ? `${user.matricId} • ${user.programName}` : 
                       user.role === 'lecturer' ? 'Commerce Department' : 
                       'System Administrator'}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {getDashboardComponent()}
        </main>
      </div>
    </ProtectedRoute>
  );
}