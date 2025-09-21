'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LecturerRoute } from '@/components/auth/ProtectedRoute';
import { updateLecturerProfile } from '@/lib/auth';
import { getProgrammes, getSubjectsByProgramme } from '@/lib/academic';
import type { Subject, Programme } from '@/types/academic';

// Helper function to compare arrays
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [availableProgrammes, setAvailableProgrammes] = useState<Programme[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [programmesLoading, setProgrammesLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUserChangedProgramme, setHasUserChangedProgramme] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalSubjects, setOriginalSubjects] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      console.log('🟡 USER DATA LOADED:', {
        uid: user.uid,
        programmes: user.programmes,
        teachingSubjects: user.teachingSubjects,
        fullName: user.fullName
      });

      // Reset user change flag for fresh load
      setHasUserChangedProgramme(false);

        // Set the first programme as selected (or empty if none)
      const userProgrammes = user.programmes || [];
      const programmeToSet = userProgrammes[0] || '';
      const subjectsToSet = user.teachingSubjects || [];

      console.log('🟡 SETTING INITIAL STATE:', {
        programmeToSet,
        subjectsToSet,
        isInitialized: false,
        hasUserChangedProgramme: false
      });

      setSelectedProgramme(programmeToSet);
      setSelectedSubjects(subjectsToSet);

      // Mark as initialized after setting user data
      setIsInitialized(true);
    }
  }, [user]);

  // Load programmes on component mount
  useEffect(() => {
    const loadProgrammes = async () => {
      setProgrammesLoading(true);
      try {
        const programmeList = await getProgrammes();
        setAvailableProgrammes(programmeList);
      } catch (error) {
        console.error('Error loading programmes:', error);
        setError('Failed to load programmes');
      } finally {
        setProgrammesLoading(false);
      }
    };

    loadProgrammes();
  }, []);

  // Load subjects when selected programme changes
  useEffect(() => {
    const loadSubjects = async () => {
      console.log('🔵 SUBJECT LOAD TRIGGERED:', {
        selectedProgramme,
        isInitialized,
        user: user ? user.uid : null,
        currentSelectedSubjects: selectedSubjects
      });

      if (!selectedProgramme) {
        console.log('🔴 NO PROGRAMME - Clearing subjects');
        setAvailableSubjects([]);
        setSelectedSubjects([]);
        return;
      }

      setSubjectsLoading(true);
      try {
        console.log('🟢 LOADING SUBJECTS FOR PROGRAMME:', selectedProgramme);
        // Load all subjects for the selected programme (already ordered by semester)
        const allSubjects = await getSubjectsByProgramme(selectedProgramme);
        console.log('🟢 SUBJECTS LOADED:', {
          programme: selectedProgramme,
          count: allSubjects.length,
          subjectCodes: allSubjects.map(s => s.subjectCode)
        });
        setAvailableSubjects(allSubjects);

        // Handle subject selection based on user intent
        if (hasUserChangedProgramme) {
          // User manually changed programme - let them select new subjects
          console.log('🔄 USER CHANGED PROGRAMME - allowing new subject selection');
          // Don't override user's selections, just clear invalid ones
          setSelectedSubjects(prev =>
            prev.filter(subjectCode =>
              allSubjects.some(subject => subject.subjectCode === subjectCode)
            )
          );
        } else if (!isInitialized) {
          // Initial load - auto-select saved subjects
          if (user && user.teachingSubjects && user.teachingSubjects.length > 0) {
            console.log('🟡 INITIAL LOAD - comparing saved vs available:', {
              savedSubjects: user.teachingSubjects,
              availableSubjects: allSubjects.map(s => ({
                code: s.subjectCode,
                trimmed: s.subjectCode.trim(),
                name: s.subjectName
              }))
            });

            const validSavedSubjects = user.teachingSubjects.filter(subjectCode =>
              allSubjects.some(subject => {
                const availableCode = subject.subjectCode.trim();
                const savedCode = subjectCode.trim();
                const matches = availableCode === savedCode;
                console.log('🔍 COMPARING:', {
                  saved: savedCode,
                  available: availableCode,
                  matches
                });
                return matches;
              })
            );

            console.log('🟡 INITIAL LOAD - auto-selecting saved subjects:', {
              savedSubjects: user.teachingSubjects,
              validSavedSubjects,
              currentSelected: selectedSubjects
            });

            if (!arraysEqual(selectedSubjects, validSavedSubjects)) {
              console.log('🟡 UPDATING SELECTED SUBJECTS TO:', validSavedSubjects);
              setSelectedSubjects(validSavedSubjects);
            } else {
              console.log('🟡 SUBJECTS ALREADY MATCH, NO UPDATE NEEDED');
            }
          } else {
            console.log('🟡 INITIAL LOAD - no saved subjects, clearing selection');
            setSelectedSubjects([]);
          }
        }
        // After initial load, let user manage their own selections
      } catch (error) {
        console.error('Error loading subjects:', error);
        setError('Failed to load subjects');
      } finally {
        setSubjectsLoading(false);
      }
    };

    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgramme, isInitialized, user, hasUserChangedProgramme]);

  const handleProgrammeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const programmeCode = e.target.value;
    console.log('🔄 USER CHANGED PROGRAMME:', {
      from: selectedProgramme,
      to: programmeCode,
      wasUserChange: true
    });

    setSelectedProgramme(programmeCode);
    setHasUserChangedProgramme(true);
  };

  const handleSubjectToggle = (subjectCode: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectCode)
        ? prev.filter(s => s !== subjectCode)
        : [...prev, subjectCode]
    );
  };

  const getFilteredSubjects = () => {
    if (!searchTerm.trim()) {
      return availableSubjects;
    }

    const term = searchTerm.toLowerCase();
    return availableSubjects.filter(subject =>
      subject.subjectCode.toLowerCase().includes(term) ||
      subject.subjectName.toLowerCase().includes(term)
    );
  };

  const getSubjectsBySemester = () => {
    const subjectsBySemester = new Map<number, Subject[]>();

    for (const subject of availableSubjects) {
      if (!subjectsBySemester.has(subject.semester)) {
        subjectsBySemester.set(subject.semester, []);
      }
      subjectsBySemester.get(subject.semester)!.push(subject);
    }

    return subjectsBySemester;
  };

  const getSubjectsBySemesterForCurrent = () => {
    const subjectsBySemester = new Map<number, Subject[]>();

    // Filter available subjects to only include current teaching subjects
    const currentSubjects = availableSubjects.filter(subject =>
      user?.teachingSubjects?.includes(subject.subjectCode)
    );

    for (const subject of currentSubjects) {
      if (!subjectsBySemester.has(subject.semester)) {
        subjectsBySemester.set(subject.semester, []);
      }
      subjectsBySemester.get(subject.semester)!.push(subject);
    }

    return subjectsBySemester;
  };

  const handleSelectAllSemester = (semester: number, subjects: Subject[]) => {
    const allSelected = subjects.every(subject => selectedSubjects.includes(subject.subjectCode));

    if (allSelected) {
      // Deselect all
      setSelectedSubjects(prev =>
        prev.filter(code => !subjects.some(s => s.subjectCode === code))
      );
    } else {
      // Select all
      setSelectedSubjects(prev =>
        [...new Set([...prev, ...subjects.map(s => s.subjectCode)])]
      );
    }
  };

  const isSemesterFullySelected = (subjects: Subject[]) => {
    return subjects.length > 0 && subjects.every(subject => selectedSubjects.includes(subject.subjectCode));
  };

  const isSemesterPartiallySelected = (subjects: Subject[]) => {
    return subjects.some(subject => selectedSubjects.includes(subject.subjectCode)) &&
           !isSemesterFullySelected(subjects);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('💾 SAVE ATTEMPTED:', {
      selectedProgramme,
      selectedSubjects,
      originalUserSubjects: user?.teachingSubjects,
      originalUserProgrammes: user?.programmes
    });

    if (!selectedProgramme) {
      setError('Please select a programme');
      return;
    }

    // Check if there are actual changes to save
    const currentProgrammes = user?.programmes || [];
    const currentSubjects = user?.teachingSubjects || [];

    const programmeChanged = !arraysEqual(currentProgrammes, [selectedProgramme]);
    const subjectsChanged = !arraysEqual(currentSubjects, selectedSubjects);

    // Validate save attempt based on edit mode
    if (isEditMode && !programmeChanged && !subjectsChanged) {
      // In edit mode, require actual changes to either programme or subjects
      setError('No changes to save. Make changes to your programme or teaching subjects.');
      return;
    }

    // Bypass validation for view mode - allow save to proceed
    // The core issue (accidental subject overwrites) is already fixed by edit mode protection

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Build update payload based on edit mode
      const updatePayload: {
        programmes: string[];
        teachingSubjects?: string[];
      } = {
        programmes: [selectedProgramme]
      };

      // Only include teachingSubjects if in edit mode (prevents accidental overwrites)
      if (isEditMode) {
        updatePayload.teachingSubjects = selectedSubjects;
        console.log('💾 SAVING TO FIRESTORE (Edit Mode):', {
          uid: user!.uid,
          programmes: [selectedProgramme],
          teachingSubjects: selectedSubjects
        });
      } else {
        console.log('💾 SAVING TO FIRESTORE (View Mode - Programme Only):', {
          uid: user!.uid,
          programmes: [selectedProgramme],
          teachingSubjects: 'PRESERVING_EXISTING'
        });
      }

      await updateLecturerProfile(user!.uid, updatePayload);

      console.log('💾 SAVE SUCCESSFUL');
      setSuccess('Profile updated successfully!');
      setIsEditMode(false); // Exit edit mode after successful save
      await refreshUser(); // Refresh user data in context

      // Redirect back to dashboard after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Profile update error:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <LecturerRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancel}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Update Profile
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lecturer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">Name</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{user?.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">Department</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{user?.department || 'Commerce'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400">Employee ID</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{user?.employeeId}</p>
                  </div>
                </div>
              </div>

              {/* Programme Selection */}
              <div>
                <label htmlFor="programme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teaching Programme <span className="text-red-500">*</span>
                </label>

                {programmesLoading ? (
                  <div className="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-xl">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading programmes...</span>
                  </div>
                ) : (
                  <select
                    id="programme"
                    value={selectedProgramme}
                    onChange={handleProgrammeChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a Programme</option>
                    {availableProgrammes.map((programme) => (
                      <option key={programme.programmeCode} value={programme.programmeCode}>
                        {programme.programmeCode} - {programme.programmeName}
                      </option>
                    ))}
                  </select>
                )}

                {!selectedProgramme && !programmesLoading && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    Please select a programme
                  </p>
                )}
              </div>

              {/* Current Subjects Display */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Subjects
                    <span className="text-gray-500 font-normal ml-1">
                      ({user?.teachingSubjects?.length || 0} assigned)
                    </span>
                  </label>
                </div>

                {user?.teachingSubjects && user.teachingSubjects.length > 0 ? (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {Array.from(getSubjectsBySemesterForCurrent().entries()).map(([semester, subjects]) => (
                      <div key={semester} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                          Semester {semester}
                        </h4>
                        <div className="space-y-2">
                          {subjects.map((subject) => (
                            <div
                              key={subject.subjectId}
                              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
                            >
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {subject.subjectCode}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {subject.creditHours} credits
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {subject.subjectName}
                                </p>
                              </div>
                              <div className="ml-3">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No Subjects Assigned</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You don&apos;t have any teaching subjects assigned yet</p>
                  </div>
                )}
              </div>

              {/* Enhanced Teaching Subjects Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Teaching Subjects
                      <span className="text-gray-500 font-normal ml-1">
                        ({selectedSubjects.length} selected)
                      </span>
                    </label>
                    {!isEditMode && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (View only)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isEditMode ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditMode(true);
                          setOriginalSubjects([...selectedSubjects]);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                      >
                        Edit Subjects
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditMode(false);
                          setSelectedSubjects([...originalSubjects]);
                        }}
                        className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400 font-medium"
                      >
                        Cancel
                      </button>
                    )}
                    {isEditMode && selectedSubjects.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedSubjects([])}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Bar - Only enabled in edit mode */}
                {isEditMode && (
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search subjects by code or name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                      <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Subjects Loading State */}
                {subjectsLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading subjects...</p>
                  </div>
                )}

                {/* No Programme Selected */}
                {!selectedProgramme && !subjectsLoading && (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No Programme Selected</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select a teaching programme above to see available subjects</p>
                  </div>
                )}

                {/* Subjects List */}
                {selectedProgramme && !subjectsLoading && (
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {Array.from(getSubjectsBySemester().entries()).map(([semester, subjects]) => (
                      <div key={semester} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Semester {semester}
                          </h4>
                          {isEditMode && subjects.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSelectAllSemester(semester, subjects)}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              {isSemesterFullySelected(subjects) ? 'Deselect All' :
                               isSemesterPartiallySelected(subjects) ? 'Select Remaining' : 'Select All'}
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {subjects.map((subject) => (
                            <div
                              key={subject.subjectId}
                              className={`relative flex items-start p-3 rounded-lg border transition-colors ${
                                selectedSubjects.includes(subject.subjectCode)
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700'
                              } ${!isEditMode ? 'cursor-default' : 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600'}`}
                            >
                              <input
                                type="checkbox"
                                className={`mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${
                                  !isEditMode ? 'cursor-default' : 'cursor-pointer'
                                }`}
                                checked={selectedSubjects.includes(subject.subjectCode)}
                                onChange={() => isEditMode && handleSubjectToggle(subject.subjectCode)}
                                disabled={!isEditMode}
                              />
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {subject.subjectCode}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {subject.creditHours} credits
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {subject.subjectName}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results Found */}
                {searchTerm && getFilteredSubjects().length === 0 && (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No subjects found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search term</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !selectedProgramme}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </LecturerRoute>
  );
}