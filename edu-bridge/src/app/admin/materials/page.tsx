'use client';

import React from 'react';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import { AdminMaterialsManager } from '@/components/admin/materials/AdminMaterialsManager';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminMaterialsPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Admin Panel - Content Management
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    EduBridge+ Administration
                  </p>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="text-sm text-right">
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {user.fullName}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      System Administrator
                    </p>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <a
                    href="/admin"
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Back to Dashboard
                  </a>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminMaterialsManager />
        </main>
      </div>
    </AdminRoute>
  );
}