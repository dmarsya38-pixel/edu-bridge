'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPendingMaterialsForLecturer, 
  approveMaterialByLecturer, 
  rejectMaterialByLecturer
} from '@/lib/academic';
import { formatFileSize, getFileTypeIcon } from '@/lib/storage';
import type { Material } from '@/types/academic';
import type { Timestamp } from 'firebase/firestore';

interface LecturerMaterialApprovalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LecturerMaterialApproval({ isOpen, onClose }: LecturerMaterialApprovalProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingMaterials, setProcessingMaterials] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const loadPendingMaterials = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const pendingMaterials = await getPendingMaterialsForLecturer(user.uid);
      setMaterials(pendingMaterials);
    } catch (error) {
      console.error('Error loading pending materials:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      loadPendingMaterials();
    }
  }, [isOpen, user, loadPendingMaterials]);

  const handleApprove = async (material: Material) => {
    if (!user) return;

    setProcessingMaterials(prev => [...prev, material.materialId]);
    try {
      await approveMaterialByLecturer(material.materialId, user.uid, user.fullName);
      setMaterials(prev => prev.filter(m => m.materialId !== material.materialId));
    } catch (error) {
      console.error('Error approving material:', error);
    } finally {
      setProcessingMaterials(prev => prev.filter(id => id !== material.materialId));
    }
  };

  const handleReject = async (material: Material) => {
    if (!user || !rejectionReason.trim()) return;

    setProcessingMaterials(prev => [...prev, material.materialId]);
    try {
      await rejectMaterialByLecturer(material.materialId, user.uid, user.fullName, rejectionReason);
      setMaterials(prev => prev.filter(m => m.materialId !== material.materialId));
      setShowRejectModal(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting material:', error);
    } finally {
      setProcessingMaterials(prev => prev.filter(id => id !== material.materialId));
    }
  };

  const formatUploadDate = (timestamp: Timestamp | Date | number | null) => {
    if (!timestamp) return '';
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      date = timestamp.toDate();
    }
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Review Student Materials
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Materials pending approval from your teaching subjects
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">No pending materials</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                All student materials for your subjects have been reviewed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => (
                <div key={material.materialId} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">
                          {getFileTypeIcon(material.fileType)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {material.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>{material.subjectCode} - {material.subjectName}</span>
                            <span>•</span>
                            <span>{material.programmeId} Semester {material.semester}</span>
                            <span>•</span>
                            <span>{formatFileSize(material.fileSize)}</span>
                            <span>•</span>
                            <span>Uploaded {formatUploadDate(material.uploadDate)}</span>
                          </div>
                          {material.description && (
                            <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm">
                              {material.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => window.open(material.downloadURL, '_blank')}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm font-medium flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Preview</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowRejectModal(material.materialId)}
                        disabled={processingMaterials.includes(material.materialId)}
                        className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(material)}
                        disabled={processingMaterials.includes(material.materialId)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-xl disabled:cursor-not-allowed text-sm font-medium flex items-center space-x-2"
                      >
                        {processingMaterials.includes(material.materialId) ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Reject Material
                </h3>
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason('');
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this material..."
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const material = materials.find(m => m.materialId === showRejectModal);
                    if (material) handleReject(material);
                  }}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl disabled:cursor-not-allowed"
                >
                  Reject Material
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}