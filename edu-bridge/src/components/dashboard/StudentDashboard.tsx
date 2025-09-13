'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProgrammeBrowser } from '@/components/academic/ProgrammeBrowser';
import { MaterialsList } from '@/components/academic/MaterialsList';
import { DocumentViewer } from '@/components/academic/DocumentViewer';
import { MaterialUploadForm } from '@/components/upload/MaterialUploadForm';
import { getSubjectByProgrammeAndCode } from '@/lib/academic';
import type { User } from '@/types/user';
import type { Subject, Material } from '@/types/academic';

interface StudentDashboardProps {
  user: User;
}

type ViewMode = 'dashboard' | 'browser' | 'materials';

export function StudentDashboard({ user }: StudentDashboardProps) {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);

  // Handle URL parameters for deep linking from notifications
  useEffect(() => {
    const programmeId = searchParams.get('programme');
    const subjectCode = searchParams.get('subject');
    const materialId = searchParams.get('material');
    
    if (programmeId && subjectCode && materialId) {
      const loadSubjectFromUrl = async () => {
        setIsLoadingFromUrl(true);
        try {
          const subject = await getSubjectByProgrammeAndCode(programmeId, subjectCode);
          if (subject) {
            setSelectedSubject(subject);
            setViewMode('materials');
          }
        } catch (error) {
          console.error('Error loading subject from URL:', error);
        } finally {
          setIsLoadingFromUrl(false);
        }
      };
      
      loadSubjectFromUrl();
    }
  }, [searchParams]);

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setViewMode('materials');
  };

  const handleBrowseMaterials = () => {
    setViewMode('browser');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setSelectedSubject(null);
  };

  const handleBackToBrowser = () => {
    setViewMode('browser');
    setSelectedSubject(null);
  };

  const handlePreviewMaterial = (material: Material) => {
    setPreviewMaterial(material);
  };

  const handleClosePreview = () => {
    setPreviewMaterial(null);
  };

  const handleUploadSuccess = (materialId: string) => {
    setUploadSuccess(materialId);
    setShowUploadModal(false);
    
    // Clear success message after 5 seconds
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  // Show loading state when navigating from URL
  if (isLoadingFromUrl) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading material...</span>
        </div>
      </div>
    );
  }

  // Render different views based on current mode
  if (viewMode === 'materials' && selectedSubject) {
    return (
      <>
        <MaterialsList
          subject={selectedSubject}
          onBack={handleBackToBrowser}
          onPreview={handlePreviewMaterial}
        />
        <DocumentViewer
          material={previewMaterial!}
          isOpen={!!previewMaterial}
          onClose={handleClosePreview}
        />
      </>
    );
  }

  if (viewMode === 'browser') {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Kembali ke Dashboard</span>
          </button>
        </div>

        <ProgrammeBrowser 
          onSubjectSelect={handleSubjectSelect}
          selectedProgrammeId={user.program}
        />
      </div>
    );
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Welcome back, {user.fullName.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ready to explore your study materials and connect with classmates.
            </p>
          </div>
          
          {/* Verification Status - Students are auto-verified, so no warning needed */}
        </div>
        
        {/* User Info Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Student ID</h3>
            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{user.matricId}</p>
          </div>
          
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Programme</h3>
            <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">{user.program}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{user.programName}</p>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Entry Year</h3>
            <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">{user.entryYear}</p>
          </div>
        </div>
      </div>

      {/* Upload Success Message */}
      {uploadSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                Material Uploaded Successfully! 🎉
              </h3>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                Your material has been submitted for admin review and will be available to other students after approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Student Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Browse Materials</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Access lecture notes, exam papers, and answer schemes organized by subject.
          </p>
          <button 
            onClick={handleBrowseMaterials}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Browse Materials
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Materials</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Share your notes and resources with classmates. Uploads require admin approval.
          </p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Upload Material
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Profile Settings</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Update your profile, preferences, and notification settings.
          </p>
          <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            Manage Profile
          </button>
        </div>
      </div>

      {/* Upload Material Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <MaterialUploadForm
              onSuccess={handleUploadSuccess}
              onCancel={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}