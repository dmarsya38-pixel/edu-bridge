'use client';

import React, { useState, useEffect } from 'react';
import { MaterialUploadForm } from '@/components/upload/MaterialUploadForm';
import { LecturerMaterialApproval } from '@/components/lecturer/LecturerMaterialApproval';
import { getPendingMaterialsForLecturer, getProgrammes, getLecturerStats } from '@/lib/academic';
import type { User } from '@/types/user';
import type { Programme } from '@/types/academic';

interface LecturerDashboardProps {
  user: User;
}

export function LecturerDashboard({ user }: LecturerDashboardProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [lecturerProgramme, setLecturerProgramme] = useState<Programme | null>(null);
  const [stats, setStats] = useState({
    materialsUploaded: 0,
    totalDownloads: 0,
    studentsServed: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    loadPendingCount();
    loadProgrammeData();
    loadStats();
  }, [user]);

  const loadProgrammeData = async () => {
    if (!user || !user.programmes || user.programmes.length === 0) return;
    
    try {
      const allProgrammes = await getProgrammes();
      setProgrammes(allProgrammes);
      
      // Find the lecturer's programme
      const userProgramme = allProgrammes.find(p => 
        user.programmes && user.programmes.includes(p.programmeCode || p.programmeId)
      );
      setLecturerProgramme(userProgramme || null);
    } catch (error) {
      console.error('Error loading programme data:', error);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const lecturerStats = await getLecturerStats(user.uid);
      setStats(lecturerStats);
      setPendingCount(lecturerStats.pendingApprovals);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPendingCount = async () => {
    if (!user) return;
    
    try {
      const materials = await getPendingMaterialsForLecturer(user.uid);
      setPendingCount(materials.length);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const handleUploadSuccess = (materialId: string) => {
    setUploadSuccess(materialId);
    setShowUploadModal(false);
    
    // Refresh stats after upload
    loadStats();
    
    // Clear success message after 3 seconds
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  const handleApprovalModalClose = () => {
    setShowApprovalModal(false);
    // Refresh stats when approval modal closes
    loadStats();
  };
  return (
    <>
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Welcome, {user.fullName}! 👨‍🏫
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ready to share knowledge and help your students succeed.
            </p>
          </div>
          
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Lecturer Access
              </span>
            </div>
          </div>
        </div>
        
        {/* Lecturer Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Programme</h3>
            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              {lecturerProgramme ? lecturerProgramme.programmeName : 'Loading...'}
            </p>
          </div>
          
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Department</h3>
            <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
              {lecturerProgramme ? lecturerProgramme.department : user.department || 'Commerce Department'}
            </p>
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
                Your material has been automatically approved and is now available to all students.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">{stats.materialsUploaded}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Materials Uploaded</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">{stats.studentsServed}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Students Served</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">{stats.totalDownloads > 1000 ? (stats.totalDownloads / 1000).toFixed(1) + 'k' : stats.totalDownloads}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">32</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</p>
          </div>
        </div>
      </div>

      {/* Lecturer Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Materials</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Upload lecture notes, exam papers, and answer schemes for your subjects.
          </p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Upload New Material
          </button>
        </div>

        {/* Review Student Materials */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Review Student Materials</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Review and approve student-uploaded materials for subjects you teach.
          </p>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Pending materials: <span className="font-semibold text-orange-600 dark:text-orange-400">{pendingCount}</span>
            </div>
          </div>
          <button 
            onClick={() => setShowApprovalModal(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Review Materials</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">My Materials</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Manage your uploaded materials, view download statistics and feedback.
          </p>
          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            Manage Materials
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Browse Materials</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Access materials from other lecturers and departments for reference.
          </p>
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            Browse Library
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Student Discussions</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Participate in subject discussions and answer student questions.
          </p>
          <span className="block w-full text-center bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs px-2 py-2 rounded-xl">
            Coming in Phase 3
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Analytics Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            View detailed analytics about your materials and student engagement.
          </p>
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            View Analytics
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Profile & Settings</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Update your profile information, teaching subjects, and preferences.
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

      {/* Lecturer Material Approval Modal */}
      <LecturerMaterialApproval
        isOpen={showApprovalModal}
        onClose={handleApprovalModalClose}
      />
    </>
  );
}