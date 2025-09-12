'use client';

import React, { useState } from 'react';
import { ProgrammeBrowser } from '@/components/academic/ProgrammeBrowser';
import { MaterialsList } from '@/components/academic/MaterialsList';
import { DocumentViewer } from '@/components/academic/DocumentViewer';
import { MaterialUploadForm } from '@/components/upload/MaterialUploadForm';
import type { User } from '@/types/user';
import type { Subject, Material } from '@/types/academic';

interface StudentDashboardProps {
  user: User;
}

type ViewMode = 'dashboard' | 'browser' | 'materials';

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Study Groups</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Join or create study groups with your classmates for collaborative learning.
          </p>
          <span className="block w-full text-center bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs px-2 py-2 rounded-xl">
            Coming in Phase 3
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Discussion Forums</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Participate in subject-based discussions and get help from peers.
          </p>
          <span className="block w-full text-center bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs px-2 py-2 rounded-xl">
            Coming in Phase 3
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">My Activity</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Track your downloads, uploads, and participation in discussions.
          </p>
          <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            View Activity
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