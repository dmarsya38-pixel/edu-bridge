'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { SubjectSearchResult } from '@/types/academic';

interface SubjectSearchResultProps {
  subject: SubjectSearchResult;
  onNavigate?: () => void;
}

export function SubjectSearchResult({ subject, onNavigate }: SubjectSearchResultProps) {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to the materials view for this specific subject
    const url = `/dashboard?programme=${encodeURIComponent(subject.programmeId)}&subject=${encodeURIComponent(subject.subjectCode)}`;
    router.push(url);
    onNavigate?.();
  };

  const formatName = (name: string, highlightedName?: string) => {
    if (highlightedName) {
      return <span dangerouslySetInnerHTML={{ __html: highlightedName }} />;
    }
    return name;
  };

  const formatCode = (code: string, highlightedCode?: string) => {
    if (highlightedCode) {
      return <span dangerouslySetInnerHTML={{ __html: highlightedCode }} />;
    }
    return code;
  };

  const getProgrammeName = (programmeId: string) => {
    const programmeNames: { [key: string]: string } = {
      'DBS': 'Diploma in Business Studies',
      'DRM': 'Diploma in Retail Management',
      'DIB': 'Diploma in Islamic Banking',
      'DIF': 'Diploma in Islamic Finance',
      'DLS': 'Diploma in Logistics Supply Chain'
    };
    return programmeNames[programmeId] || programmeId;
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4
        hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start space-x-3">
        {/* Subject Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        {/* Subject Content */}
        <div className="flex-1 min-w-0">
          {/* Subject Name and Code */}
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {formatName(subject.subjectName, subject.highlightedFields?.subjectName)}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Code: {formatCode(subject.subjectCode, subject.highlightedFields?.subjectCode)}
            </p>
          </div>

          {/* Programme and Semester */}
          <div className="flex items-center space-x-4 mb-2">
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {getProgrammeName(subject.programmeId)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Semester {subject.semester}
              </span>
            </div>
          </div>

          {/* Material Count and Description */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {subject.materialCount} {subject.materialCount === 1 ? 'material' : 'materials'}
                </span>
              </div>

              {subject.description && (
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                  {subject.description}
                </span>
              )}
            </div>

            {/* View Subject Button */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium">
                View Subject →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}