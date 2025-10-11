'use client';

import React, { useState } from 'react';
import { formatFileSize, getFileTypeIcon } from '@/lib/storage';
import type { Material } from '@/types/academic';

interface MaterialDeleteDialogProps {
  material: Material;
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function MaterialDeleteDialog({
  material,
  isOpen,
  isDeleting,
  onConfirm,
  onCancel
}: MaterialDeleteDialogProps) {
  const [reason, setReason] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen) return null;

  const isPopularContent = (material.downloadCount || 0) > 10;
  const isNewContent = material.uploadDate?.toDate
    ? (Date.now() - material.uploadDate.toDate().getTime()) < (7 * 24 * 60 * 60 * 1000) // 7 days
    : false;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setShowWarning(true);
      return;
    }
    onConfirm(reason);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
        return '📝';
      case 'exam_paper':
        return '📄';
      case 'answer_scheme':
        return '📋';
      default:
        return '📁';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return '🟢 Approved';
      case 'pending':
        return '🟡 Pending';
      case 'rejected':
        return '🔴 Rejected';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <span className="text-red-600 mr-2">🗑️</span>
              Delete Material
            </h3>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  This action cannot be undone
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Deleting this material will permanently remove it from the system and students will no longer be able to access it.
                </p>
              </div>
            </div>
          </div>

          {/* Material Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Material Details</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getFileTypeIcon(material.fileType)}</span>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    {material.title}
                  </h5>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {material.description || 'No description provided'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {getTypeIcon(material.materialType)} {material.materialType.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {getStatusBadge(material.approvalStatus)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Subject:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {material.subjectCode} - {material.subjectName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Programme:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {material.programmeId} / Semester {material.semester}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Uploader:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {material.uploaderName} ({material.uploaderRole})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">File Size:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {formatFileSize(material.fileSize)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Downloads:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {material.downloadCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Upload Date:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {material.uploadDate?.toDate?.().toLocaleDateString() || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Warnings */}
          {(isPopularContent || isNewContent) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">⚠️ Additional Warnings</h4>
              <div className="space-y-2">
                {isPopularContent && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-yellow-800 dark:text-yellow-200">
                        This material has been downloaded {material.downloadCount} times. Deleting it may affect many students.
                      </span>
                    </div>
                  </div>
                )}
                {isNewContent && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        This material was recently uploaded. Consider if the uploader should be notified.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Reason for Deletion <span className="text-red-600">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setShowWarning(false);
              }}
              placeholder="Please provide a reason for deleting this material..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-gray-100"
            />
            {showWarning && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Please provide a reason for deletion.
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This reason will be logged for audit purposes.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting || !reason.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Material</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}