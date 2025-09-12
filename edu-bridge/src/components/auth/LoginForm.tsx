'use client';

import React, { useState } from 'react';
import { loginUser } from '@/lib/auth';
import { validation } from '@/lib/validation';
import type { LoginFormData, LoginStatus, ValidationState } from '@/types/user';

interface LoginFormProps {
  onSuccess?: (user: import('@/types/user').User) => void;
  onRegisterRedirect?: () => void;
}

export default function LoginForm({ onSuccess, onRegisterRedirect }: LoginFormProps) {
  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });

  // UI state
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    errors: {},
    touched: {}
  });

  // Handle input changes
  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setValidationState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: true }
    }));

    // Clear previous errors for this field
    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: '', general: '' }
    }));

    // Real-time validation
    validateField(field, value);
  };

  const validateField = (field: keyof LoginFormData, value: string | boolean) => {
    let error = '';

    switch (field) {
      case 'email':
        if (typeof value === 'string') {
          const result = validation.email(value);
          error = result.error || '';
        }
        break;
      case 'password':
        if (typeof value === 'string' && value.length === 0) {
          error = 'Password is required';
        }
        break;
    }

    setValidationState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors: Record<string, string> = {};
    
    if (!validation.email(formData.email).isValid) {
      errors.email = validation.email(formData.email).error || '';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    // Update validation state
    setValidationState({
      isValid: Object.keys(errors).length === 0,
      errors,
      touched: { email: true, password: true, rememberMe: true }
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    // Proceed with login
    setStatus('logging-in');

    try {
      const result = await loginUser(formData);
      
      if (result.success && result.user) {
        setStatus('success');
        onSuccess?.(result.user);
      } else {
        setStatus('error');
        if (result.error) {
          setValidationState(prev => ({
            ...prev,
            errors: { 
              ...prev.errors, 
              [result.error!.field || 'general']: result.error!.message 
            }
          }));
        }
      }
    } catch {
      setStatus('error');
      setValidationState(prev => ({
        ...prev,
        errors: { ...prev.errors, general: 'An unexpected error occurred. Please try again.' }
      }));
    }
  };

  const getFieldError = (field: keyof LoginFormData) => {
    return validationState.touched[field] ? validationState.errors[field] : '';
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">E+</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Sign in to your EduBridge+ account
        </p>
      </div>

      {/* Login Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
              className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${
                getFieldError('email')
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
              }`}
              autoComplete="email"
            />
            {getFieldError('email') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('email')}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Your password"
              className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${
                getFieldError('password')
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
              }`}
              autoComplete="current-password"
            />
            {getFieldError('password') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('password')}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-500"
              onClick={() => {
                // TODO: Implement forgot password
                alert('Forgot password feature coming soon!');
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* General Error */}
          {validationState.errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl">
              {validationState.errors.general}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'logging-in'}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-xl shadow-sm font-medium transition-colors"
          >
            {status === 'logging-in' ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <button
              onClick={onRegisterRedirect}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Create one here
            </button>
          </p>
        </div>
      </div>

      {/* Success Message */}
      {status === 'success' && (
        <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl text-center">
          <p className="font-medium">Login successful! 🎉</p>
          <p className="text-sm mt-1">Redirecting to your dashboard...</p>
        </div>
      )}
    </div>
  );
}