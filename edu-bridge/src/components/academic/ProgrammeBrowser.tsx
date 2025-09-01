'use client';

import React, { useState, useEffect } from 'react';
import { getProgrammes, getSubjectsByProgramme } from '@/lib/academic';
import type { Programme, Subject } from '@/types/academic';
import { SEMESTERS } from '@/types/academic';

interface ProgrammeBrowserProps {
  onSubjectSelect?: (subject: Subject) => void;
  selectedProgrammeId?: string;
  selectedSemester?: number;
  selectedSubjectCode?: string;
}

export function ProgrammeBrowser({ 
  onSubjectSelect, 
  selectedProgrammeId, 
  selectedSemester, 
  selectedSubjectCode 
}: ProgrammeBrowserProps) {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentProgramme, setCurrentProgramme] = useState<string>(selectedProgrammeId || '');
  const [currentSemester, setCurrentSemester] = useState<number>(selectedSemester || 1);
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Load programmes on mount
  useEffect(() => {
    loadProgrammes();
  }, []);

  // Load subjects when programme changes
  useEffect(() => {
    if (currentProgramme) {
      loadSubjects(currentProgramme);
    }
  }, [currentProgramme]);

  const loadProgrammes = async () => {
    try {
      setLoading(true);
      const data = await getProgrammes();
      setProgrammes(data);
      
      // Auto-select first programme if none selected
      if (!currentProgramme && data.length > 0) {
        setCurrentProgramme(data[0].programmeCode);
      }
    } catch (error) {
      console.error('Error loading programmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async (programmeId: string) => {
    try {
      setLoadingSubjects(true);
      const data = await getSubjectsByProgramme(programmeId);
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleProgrammeChange = (programmeId: string) => {
    setCurrentProgramme(programmeId);
    setCurrentSemester(1); // Reset to first semester
  };

  const handleSubjectClick = (subject: Subject) => {
    if (onSubjectSelect) {
      onSubjectSelect(subject);
    }
  };

  const getSubjectsForSemester = (semester: number) => {
    return subjects.filter(subject => subject.semester === semester);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Browse Academic Content
      </h3>

      {/* Programme Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Programme
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {programmes.map((programme) => (
            <button
              key={programme.programmeCode}
              onClick={() => handleProgrammeChange(programme.programmeCode)}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                currentProgramme === programme.programmeCode
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{programme.programmeCode}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {programme.programmeName}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Semester and Subjects */}
      {currentProgramme && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Browse by Semester
          </label>
          
          {loadingSubjects ? (
            <div className="animate-pulse space-y-4">
              {SEMESTERS.map(sem => (
                <div key={sem} className="space-y-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {SEMESTERS.map(semester => {
                const semesterSubjects = getSubjectsForSemester(semester);
                
                if (semesterSubjects.length === 0) {
                  return null;
                }
                
                return (
                  <div key={semester}>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Semester {semester}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {semesterSubjects.map((subject) => (
                        <button
                          key={subject.subjectCode}
                          onClick={() => handleSubjectClick(subject)}
                          className={`p-3 rounded-lg border text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            selectedSubjectCode === subject.subjectCode
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {subject.subjectCode}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {subject.subjectName}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                              {subject.creditHours} Credits
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loadingSubjects && subjects.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                No subjects found for {currentProgramme}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Subjects will appear here once they are added to the system
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}