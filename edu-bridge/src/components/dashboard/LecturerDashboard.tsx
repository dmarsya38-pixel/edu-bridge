'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ProgrammeBrowser } from '@/components/academic/ProgrammeBrowser';
import { MaterialsList } from '@/components/academic/MaterialsList';
import { DocumentViewer } from '@/components/academic/DocumentViewer';
import { MaterialUploadForm } from '@/components/upload/MaterialUploadForm';
import { LecturerMaterialApproval } from '@/components/lecturer/LecturerMaterialApproval';
import { getPendingMaterialsForLecturer, getProgrammes, getLecturerStats, getSubjectByProgrammeAndCode } from '@/lib/academic';
import type { User } from '@/types/user';
import type { Programme, Subject, Material } from '@/types/academic';

interface LecturerDashboardProps {
  user: User;
}

type ViewMode = 'dashboard' | 'browser' | 'materials';

export function LecturerDashboard({ user }: LecturerDashboardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [, setProgrammes] = useState<Programme[]>([]);
  const [lecturerProgramme, setLecturerProgramme] = useState<Programme | null>(null);
  const [programmeLoading, setProgrammeLoading] = useState(true);
  const [stats, setStats] = useState({
    materialsUploaded: 0,
    totalDownloads: 0,
    studentsServed: 0,
    pendingApprovals: 0
  });

  const loadProgrammeData = useCallback(async () => {
    if (!user) return;
    
    try {
      setProgrammeLoading(true);
      const allProgrammes = await getProgrammes();
      setProgrammes(allProgrammes);
      
      // Find the lecturer's programme - improved matching logic
      let userProgramme = null;
      
      // Debug logging
      console.log('🔍 Programme matching debug:', {
        userProgrammes: user.programmes,
        userProgram: user.program,
        allProgrammes: allProgrammes.map(p => ({ 
          code: p.programmeCode, 
          id: p.programmeId, 
          name: p.programmeName 
        }))
      });
      
      if (user.programmes && user.programmes.length > 0) {
        // Primary: Match using programmes array (preferred for lecturers)
        const programmeCode = user.programmes[0]; // Take first programme
        userProgramme = allProgrammes.find(p => 
          p.programmeCode === programmeCode || p.programmeId === programmeCode
        );
        
        console.log('✅ Found programme via programmes array:', {
          searchCode: programmeCode,
          foundProgramme: userProgramme ? {
            id: userProgramme.programmeId,
            code: userProgramme.programmeCode,
            name: userProgramme.programmeName
          } : null
        });
      } else if (user.program && user.program !== 'N/A') {
        // Fallback: Match using program field (legacy support)
        userProgramme = allProgrammes.find(p => 
          p.programmeCode === user.program || p.programmeId === user.program
        );
        
        console.log('⚠️ Found programme via legacy program field:', {
          searchCode: user.program,
          foundProgramme: userProgramme ? {
            id: userProgramme.programmeId,
            code: userProgramme.programmeCode,
            name: userProgramme.programmeName
          } : null
        });
      }
      
      setLecturerProgramme(userProgramme || null);
      
      // Auto-fix: If user has "Unknown Programme" but we found the correct programme
      if (userProgramme && user.programName === 'Unknown Programme') {
        console.log('🔧 Auto-fixing lecturer programme name...');
        try {
          // Import here to avoid circular dependency
          const { updateDoc, doc } = await import('firebase/firestore');
          const { getDb } = await import('@/lib/firebase');
          
          await updateDoc(doc(getDb(), 'users', user.uid), {
            programName: userProgramme.programmeName
          });
          
          console.log(`✅ Fixed ${user.fullName}'s programme name: ${userProgramme.programmeName}`);
          
          // Force re-render by updating local state
          // Note: The user object itself doesn't update, but the fix will apply on next login
        } catch (fixError) {
          console.error('❌ Failed to auto-fix programme name:', fixError);
        }
      }
      
      if (!userProgramme) {
        console.error('❌ No programme found for lecturer:', {
          programmes: user.programmes,
          program: user.program,
          availableProgrammes: allProgrammes.map(p => p.programmeCode)
        });
      }
    } catch (error) {
      console.error('Error loading programme data:', error);
    } finally {
      setProgrammeLoading(false);
    }
  }, [user]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    
    try {
      const lecturerStats = await getLecturerStats(user.uid);
      setStats(lecturerStats);
      setPendingCount(lecturerStats.pendingApprovals);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [user]);

  const loadPendingCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const materials = await getPendingMaterialsForLecturer(user.uid);
      setPendingCount(materials.length);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // For lecturers, always load programme data first to prevent "No programme assigned" flash
      if (user.role === 'lecturer') {
        if (!user.programmes || user.programmes.length === 0) {
          console.log('⚠️  Lecturer missing programme data - needs re-registration');
          console.log('🔍 Current user data:', {
            uid: user.uid,
            department: user.department,
            programmes: user.programmes,
            program: user.program,
            teachingSubjects: user.teachingSubjects
          });
        }
        
        // Load programme data immediately to avoid flash of "No programme assigned"
        loadProgrammeData();
        loadPendingCount();
        loadStats();
      }
    }
  }, [user, loadProgrammeData, loadStats, loadPendingCount]);

  // Handle URL parameters for deep linking from notifications
  useEffect(() => {
    const programmeId = searchParams.get('programme');
    const subjectCode = searchParams.get('subject');
    const materialId = searchParams.get('material');
    
    if (programmeId && subjectCode && materialId) {
      const loadSubjectFromUrl = async () => {
        try {
          const subject = await getSubjectByProgrammeAndCode(programmeId, subjectCode);
          if (subject) {
            setSelectedSubject(subject);
            setViewMode('materials');
          }
        } catch (error) {
          console.error('Error loading subject from URL:', error);
        }
      };

      loadSubjectFromUrl();
    }
  }, [searchParams]);

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

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setViewMode('materials');
  };

  const handlePreviewMaterial = (material: Material) => {
    setPreviewMaterial(material);
  };

  const handleClosePreview = () => {
    setPreviewMaterial(null);
  };

  // Render different views based on viewMode
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
            <span>Back to Dashboard</span>
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
              {programmeLoading ? 'Loading...' : 
               user.programName && user.programName !== 'Unknown Programme' ? user.programName : 
               lecturerProgramme ? lecturerProgramme.programmeName : 
               user.department ? `${user.department} Department` : 'No programme assigned'}
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
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Browse Materials</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Access materials from other lecturers and departments for reference.
          </p>
          <button 
            onClick={handleBrowseMaterials}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Browse Library
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
          <button
            onClick={() => router.push('/profile')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
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