'use client';

import React, { useState } from 'react';
import { validateMatricId, validation } from '@/lib/validation';
import { registerUser } from '@/lib/auth';
import type { RegistrationFormData, RegistrationStatus, ValidationState } from '@/types/user';

interface RegistrationFormProps {
  onSuccess?: (user: import('@/types/user').User) => void;
  onLoginRedirect?: () => void;
}

export default function RegistrationForm({ onSuccess, onLoginRedirect }: RegistrationFormProps) {
  // Form state
  const [formData, setFormData] = useState<RegistrationFormData>({
    matricId: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    acceptTerms: false
  });

  // UI state
  const [status, setStatus] = useState<RegistrationStatus>('idle');
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    errors: {},
    touched: {}
  });
  
  // Real-time matric ID validation
  const [matricInfo, setMatricInfo] = useState<import('@/lib/validation').MatricValidation | null>(null);

  // Handle input changes with real-time validation
  const handleInputChange = (field: keyof RegistrationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mark field as touched
    setValidationState(prev => ({
      ...prev,
      touched: { ...prev.touched, [field]: true }
    }));

    // Real-time validation for specific fields
    if (field === 'matricId' && typeof value === 'string') {
      const matricValidation = validateMatricId(value);
      if (matricValidation.isValid) {
        setMatricInfo(matricValidation);
        setValidationState(prev => ({
          ...prev,
          errors: { ...prev.errors, matricId: '' }
        }));
      } else {
        setMatricInfo(null);
        setValidationState(prev => ({
          ...prev,
          errors: { ...prev.errors, matricId: matricValidation.error || '' }
        }));
      }
    }

    // Validate other fields
    validateField(field, value);
  };

  const validateField = (field: keyof RegistrationFormData, value: string | boolean) => {
    let error = '';

    switch (field) {
      case 'fullName':
        if (typeof value === 'string') {
          const result = validation.fullName(value);
          error = result.error || '';
        }
        break;
      case 'email':
        if (typeof value === 'string') {
          const result = validation.email(value);
          error = result.error || '';
        }
        break;
      case 'password':
        if (typeof value === 'string') {
          const result = validation.password(value);
          error = result.error || '';
        }
        break;
      case 'confirmPassword':
        if (typeof value === 'string' && value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
      case 'phoneNumber':
        if (typeof value === 'string') {
          const result = validation.phone(value);
          error = result.error || '';
        }
        break;
      case 'acceptTerms':
        if (typeof value === 'boolean' && !value) {
          error = 'You must accept the terms and conditions';
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
    
    if (!validateMatricId(formData.matricId).isValid) {
      errors.matricId = validateMatricId(formData.matricId).error || '';
    }
    
    if (!validation.fullName(formData.fullName).isValid) {
      errors.fullName = validation.fullName(formData.fullName).error || '';
    }
    
    if (!validation.email(formData.email).isValid) {
      errors.email = validation.email(formData.email).error || '';
    }
    
    if (!validation.password(formData.password).isValid) {
      errors.password = validation.password(formData.password).error || '';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!validation.phone(formData.phoneNumber).isValid) {
      errors.phoneNumber = validation.phone(formData.phoneNumber).error || '';
    }
    
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    // Update validation state
    setValidationState({
      isValid: Object.keys(errors).length === 0,
      errors,
      touched: Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    // Proceed with registration
    setStatus('registering');

    try {
      const result = await registerUser(formData);
      
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
    } catch (error) {
      setStatus('error');
      setValidationState(prev => ({
        ...prev,
        errors: { ...prev.errors, general: 'An unexpected error occurred. Please try again.' }
      }));
    }
  };

  const getFieldError = (field: keyof RegistrationFormData) => {
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
          Join EduBridge+
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Create your account for Politeknik Nilai Commerce Department
        </p>
      </div>

      {/* Registration Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Matric ID */}
          <div>
            <label htmlFor="matricId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Matric ID
            </label>
            <input
              type="text"
              id="matricId"
              value={formData.matricId}
              onChange={(e) => handleInputChange('matricId', e.target.value.toUpperCase())}
              placeholder="e.g., 23DBS23F1001"
              className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${
                getFieldError('matricId')
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : matricInfo
                  ? 'border-emerald-300 dark:border-emerald-600 focus:ring-emerald-500'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
              }`}
            />
            {getFieldError('matricId') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('matricId')}</p>
            )}
            {matricInfo && (
              <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">✓ Valid Politeknik Nilai ID</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  {matricInfo.programName} • {matricInfo.sessionName} • {matricInfo.entryYear}
                </p>
              </div>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Your full name as in IC"
              className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${
                getFieldError('fullName')
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
              }`}
            />
            {getFieldError('fullName') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('fullName')}</p>
            )}
          </div>

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
            />
            {getFieldError('email') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('email')}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="+60123456789"
              className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${
                getFieldError('phoneNumber')
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
              }`}
            />
            {getFieldError('phoneNumber') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('phoneNumber')}</p>
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
              placeholder="At least 8 characters"
              className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${
                getFieldError('password')
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
              }`}
            />
            {getFieldError('password') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('password')}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Repeat your password"
              className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 ${
                getFieldError('confirmPassword')
                  ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'
              }`}
            />
            {getFieldError('confirmPassword') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('confirmPassword')}</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={formData.acceptTerms}
              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-700 dark:text-gray-300">
              I accept the{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 underline">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 underline">
                Privacy Policy
              </a>
            </label>
          </div>
          {getFieldError('acceptTerms') && (
            <p className="text-sm text-red-600 dark:text-red-400">{getFieldError('acceptTerms')}</p>
          )}

          {/* General Error */}
          {validationState.errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-xl">
              {validationState.errors.general}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'registering'}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-xl shadow-sm font-medium transition-colors"
          >
            {status === 'registering' ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={onLoginRedirect}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>

      {/* Success Message */}
      {status === 'success' && (
        <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl text-center">
          <p className="font-medium">Account created successfully! 🎉</p>
          <p className="text-sm mt-1">Please check your email to verify your account.</p>
        </div>
      )}
    </div>
  );
}