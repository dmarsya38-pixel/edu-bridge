'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RegistrationForm from '@/components/auth/RegistrationForm';
import LoginForm from '@/components/auth/LoginForm';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const router = useRouter();
  const { login } = useAuth();

  const handleAuthSuccess = (user: import('@/types/user').User) => {
    login(user);
    
    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'lecturer':
        router.push('/lecturer');
        break;
      case 'student':
      default:
        router.push('/dashboard');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {mode === 'login' ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onRegisterRedirect={() => setMode('register')}
          />
        ) : (
          <RegistrationForm
            onSuccess={handleAuthSuccess}
            onLoginRedirect={() => setMode('login')}
          />
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          EduBridge+ • Politeknik Nilai Commerce Department
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Secure learning platform for academic resources
        </p>
      </div>
    </div>
  );
}