'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerLecturer, validateEmployeeId, validateInstitutionalEmail } from '@/lib/lecturer-auth';
import { getProgrammes, getSubjectsBySemester } from '@/lib/academic';
import type { LecturerRegistrationData } from '@/lib/lecturer-auth';
import type { Programme, Subject } from '@/types/academic';

interface LecturerRegistrationFormProps {
  onSwitchToStudent: () => void;
  onSuccess?: (user: import('@/types/user').User) => void;
}

export function LecturerRegistrationForm({ onSwitchToStudent, onSuccess }: LecturerRegistrationFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState<LecturerRegistrationData>({
    employeeId: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    department: 'Commerce',
    position: 'Lecturer',
    programme: '',
    subjects: [],
    acceptTerms: false
  });

  const [status, setStatus] = useState<'idle' | 'registering' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Data for programme and subject selection
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  // Load programmes on mount
  useEffect(() => {
    loadProgrammes();
  }, []);

  // Load subjects when programme changes
  useEffect(() => {
    if (formData.programme) {
      loadSubjectsForProgramme(formData.programme);
    } else {
      setAvailableSubjects([]);
      // Clear selected subjects when programme changes
      setFormData(prev => ({ ...prev, subjects: [] }));
    }
  }, [formData.programme]);

  const loadProgrammes = async () => {
    try {
      const programmeList = await getProgrammes();
      setProgrammes(programmeList);
    } catch (error) {
      console.error('Error loading programmes:', error);
    }
  };

  const loadSubjectsForProgramme = async (programmeId: string) => {
    try {
      // Load subjects for all semesters of the selected programme
      const allSubjects: Subject[] = [];
      
      for (let semester = 1; semester <= 5; semester++) {
        const semesterSubjects = await getSubjectsBySemester(programmeId, semester);
        allSubjects.push(...semesterSubjects);
      }
      
      setAvailableSubjects(allSubjects);
      
      // Clear selected subjects if they're not in the new programme
      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.filter(subjectCode => 
          allSubjects.some(subject => subject.subjectCode === subjectCode)
        )
      }));
    } catch (error) {
      console.error('Error loading subjects:', error);
      setAvailableSubjects([]);
    }
  };

  const validateField = (name: string, value: string | boolean | string[]) => {
    let error = '';

    switch (name) {
      case 'employeeId':
        const employeeValidation = validateEmployeeId(value as string);
        if (!employeeValidation.isValid) {
          error = employeeValidation.error || 'Invalid employee ID';
        }
        break;

      case 'fullName':
        if (!(value as string).trim()) {
          error = 'Full name is required';
        }
        break;

      case 'email':
        const emailValidation = validateInstitutionalEmail(value as string);
        if (!emailValidation.isValid) {
          error = emailValidation.error || 'Invalid email';
        }
        break;

      case 'password':
        if ((value as string).length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;

      case 'confirmPassword':
        if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;

      case 'phoneNumber':
        if (!(value as string).trim()) {
          error = 'Phone number is required';
        }
        break;

      case 'programme':
        if (!(value as string).trim()) {
          error = 'Please select a programme';
        }
        break;

      case 'subjects':
        const subjects = value as string[];
        if (subjects.length < 3) {
          error = 'Please select at least 3 subjects';
        }
        break;

      case 'acceptTerms':
        if (!value) {
          error = 'You must accept the terms and conditions';
        }
        break;
    }

    return error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // Special handling for programme selection to capture both code and name
    if (name === 'programme') {
      const selectedProgramme = programmes.find(p => p.programmeCode === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        programmeName: selectedProgramme ? selectedProgramme.programmeName : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Validate field on change
    const error = validateField(name, type === 'checkbox' ? checked : value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubjectChange = (subjectCode: string, isChecked: boolean) => {
    setFormData(prev => {
      const newSubjects = isChecked 
        ? [...prev.subjects, subjectCode]
        : prev.subjects.filter(code => code !== subjectCode);
      
      // Validate subjects after change
      const error = validateField('subjects', newSubjects);
      setErrors(prevErrors => ({
        ...prevErrors,
        subjects: error
      }));
      
      return {
        ...prev,
        subjects: newSubjects
      };
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof LecturerRegistrationData]);
      if (error) newErrors[key] = error;
    });


    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    setStatus('registering');
    setErrors({});

    try {
      console.log('🎓 Starting lecturer registration...');
      const result = await registerLecturer(formData);
      console.log('✅ Registration result:', result);
      
      if (result.success) {
        setStatus('success');
        
        if (onSuccess && result.user) {
          // Use auth context flow for proper redirect
          console.log('🚀 Using auth context flow for redirect...');
          setTimeout(() => {
            onSuccess(result.user!);
          }, 1000);
        } else {
          // Fallback to direct redirect
          console.log('🚀 Redirecting to dashboard in 2 seconds...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } else {
        setStatus('error');
        if (result.error?.field) {
          setErrors({ [result.error.field]: result.error.message });
        } else {
          setErrors({ general: result.error?.message || 'Registration failed' });
        }
      }
    } catch (error) {
      setStatus('error');
      setErrors({ general: 'Registration failed. Please try again.' });
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Registration Successful! 🎉
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Your lecturer account has been created successfully! 
          You can now log in and access the platform.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Lecturer Registration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Register as a lecturer at Politeknik Nilai Commerce Department
        </p>
      </div>

      {errors.general && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employee ID */}
        <div>
          <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Employee ID *
          </label>
          <input
            type="text"
            id="employeeId"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="L000000"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {touched.employeeId && errors.employeeId && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.employeeId}</p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="Dr. Ahmad Rahman"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {touched.fullName && errors.fullName && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Institutional Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="ahmad.rahman@polinilai.edu.my"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {touched.email && errors.email && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {touched.password && errors.password && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder="01X-XXXXXXX"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {touched.phoneNumber && errors.phoneNumber && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Position */}
        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position *
          </label>
          <select
            id="position"
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Lecturer">Lecturer</option>
            <option value="Senior Lecturer">Senior Lecturer</option>
            <option value="Principal Lecturer">Principal Lecturer</option>
          </select>
        </div>

        {/* Programme Selection */}
        <div>
          <label htmlFor="programme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Programme *
          </label>
          <select
            id="programme"
            name="programme"
            value={formData.programme}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a Programme</option>
            {programmes.map((programme) => (
              <option key={programme.programmeCode} value={programme.programmeCode}>
                {programme.programmeCode} - {programme.programmeName}
              </option>
            ))}
          </select>
          {touched.programme && errors.programme && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.programme}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Choose the programme you will be teaching in
          </p>
        </div>

        {/* Subject Selection */}
        {formData.programme && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teaching Subjects * (Select at least 3)
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800 max-h-60 overflow-y-auto">
              {availableSubjects.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading subjects...</p>
              ) : (
                <div className="space-y-2">
                  {availableSubjects.map((subject) => (
                    <div key={subject.subjectCode} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={subject.subjectCode}
                        checked={formData.subjects.includes(subject.subjectCode)}
                        onChange={(e) => handleSubjectChange(subject.subjectCode, e.target.checked)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={subject.subjectCode} className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        <span className="font-medium">{subject.subjectCode}</span> - {subject.subjectName}
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">
                          Semester {subject.semester}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.subjects && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.subjects}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selected: {formData.subjects.length} subject{formData.subjects.length !== 1 ? 's' : ''} (minimum 3 required)
            </p>
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-700 dark:text-gray-300">
            I agree to the Terms and Conditions and Privacy Policy *
          </label>
        </div>
        {touched.acceptTerms && errors.acceptTerms && (
          <p className="text-red-600 dark:text-red-400 text-sm">{errors.acceptTerms}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'registering'}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors"
        >
          {status === 'registering' ? 'Submitting Registration...' : 'Register as Lecturer'}
        </button>
      </form>

      {/* Switch to Student Registration */}
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Are you a student?{' '}
          <button
            onClick={onSwitchToStudent}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Register as Student
          </button>
        </p>
      </div>
    </div>
  );
}