'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, promoteLecturerToAdmin } from '@/lib/admin';
import { safeFormatTimestamp } from '@/lib/timestamp-utils';
import type { UserProfile } from '@/types/user';

interface LecturerManagerProps {
  className?: string;
}

export function LecturerManager({ className }: LecturerManagerProps) {
  const { user } = useAuth();
  const [lecturers, setLecturers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [selectedLecturer, setSelectedLecturer] = useState<UserProfile | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadLecturers();
  }, []);

  const loadLecturers = async () => {
    try {
      setLoading(true);
      setError(null);
      const allUsers = await getAllUsers('all', 100);
      const lecturerUsers = allUsers.filter(u => u.role === 'lecturer');
      setLecturers(lecturerUsers);
    } catch (error) {
      console.error('Error loading lecturers:', error);
      setError('Failed to load lecturers');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteClick = (lecturer: UserProfile) => {
    setSelectedLecturer(lecturer);
    setShowConfirmDialog(true);
  };

  const handlePromoteConfirm = async () => {
    if (!selectedLecturer || !user) return;

    try {
      setPromoting(selectedLecturer.uid);
      setError(null);
      setSuccess(null);

      const result = await promoteLecturerToAdmin(
        selectedLecturer.uid,
        user.uid,
        user.fullName
      );

      if (result.success) {
        setSuccess(`${selectedLecturer.fullName} has been promoted to admin successfully!`);
        // Remove from lecturers list
        setLecturers(prev => prev.filter(l => l.uid !== selectedLecturer.uid));
        setShowConfirmDialog(false);
        setSelectedLecturer(null);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to promote lecturer');
      }
    } catch (error) {
      console.error('Error promoting lecturer:', error);
      setError('An unexpected error occurred');
    } finally {
      setPromoting(null);
    }
  };

  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading lecturers...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Lecturer Management 👨‍🏫
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Promote lecturers to admin role
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {lecturers.length} lecturers
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              {success}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Lecturers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lecturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Teaching Subjects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {lecturers.map((lecturer) => (
                <tr key={lecturer.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {lecturer.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {lecturer.fullName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {lecturer.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {lecturer.department || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {lecturer.employeeId || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {lecturer.teachingSubjects?.length || 0} subjects
                    </div>
                    {lecturer.teachingSubjects && lecturer.teachingSubjects.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {lecturer.teachingSubjects.slice(0, 2).join(', ')}
                        {lecturer.teachingSubjects.length > 2 && '...'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {safeFormatTimestamp(lecturer.registrationDate)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handlePromoteClick(lecturer)}
                      disabled={promoting === lecturer.uid}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                    >
                      {promoting === lecturer.uid ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Promoting...
                        </>
                      ) : (
                        'Promote to Admin'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lecturers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">👨‍🏫</div>
            <div className="text-gray-500 dark:text-gray-400">No lecturers found</div>
            <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              All lecturers may have already been promoted to admin
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedLecturer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Promote to Admin
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to promote <strong>{selectedLecturer.fullName}</strong> to admin?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                They will gain full administrative access to the system.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setSelectedLecturer(null);
                }}
                disabled={promoting === selectedLecturer.uid}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoteConfirm}
                disabled={promoting === selectedLecturer.uid}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {promoting === selectedLecturer.uid ? 'Promoting...' : 'Promote to Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}