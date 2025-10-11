'use client';

import React, { useState } from 'react';
import { incrementDownloadCount } from '@/lib/academic';
import type { Material } from '@/types/academic';
import type { Timestamp } from 'firebase/firestore';

interface DocumentViewerProps {
  material: Material;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ material, isOpen, onClose }: DocumentViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      // Track download
      await incrementDownloadCount(material.materialId);
      
      // Create download link
      const link = document.createElement('a');
      link.href = material.downloadURL;
      link.download = material.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case 'exam_paper':
        return 'Exam Paper';
      case 'answer_scheme':
        return 'Answer Scheme';
      case 'note':
        return 'Notes';
      default:
        return type;
    }
  };

  const getMaterialTypeColor = (type: string) => {
    switch (type) {
      case 'exam_paper':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'answer_scheme':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'note':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isPDF = material.fileType.includes('pdf');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-0"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-7xl w-full h-[100vh] flex flex-col">
        {/* Ultra Compact Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {material.title}
                </h2>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getMaterialTypeColor(material.materialType)}`}>
                  {getMaterialTypeLabel(material.materialType)}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <span>{material.subjectCode}</span>
                <span>•</span>
                <span>{formatUploadDate(material.uploadDate)}</span>
                <span>•</span>
                <span>{material.uploaderRole === 'lecturer' ? 'Lecturer' : 'Student'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-xs font-medium rounded-md transition-colors"
            >
              {isDownloading ? (
                <>
                  <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Downloading...</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Document Content */}
        <div className="flex-1 overflow-hidden">
          {isPDF && !pdfError ? (
            /* PDF Viewer */
            <div className="h-full">
              <iframe
                src={`${material.downloadURL}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-0"
                title={material.title}
                onError={() => setPdfError(true)}
              />
            </div>
          ) : (
            /* Fallback for non-PDF or PDF error */
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {isPDF ? (
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.764 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {isPDF && pdfError
                    ? 'Cannot display PDF'
                    : 'Preview not available'
                  }
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {isPDF && pdfError
                    ? 'This PDF cannot be displayed in the browser. Please download to view the content.'
                    : `This ${material.fileType.includes('word') ? 'Word' : material.fileType.includes('presentation') ? 'PowerPoint' : 'file'} type cannot be previewed. Please download to open the file.`
                  }
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors"
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download {material.fileName}</span>
                      </>
                    )}
                  </button>
                  
                  {isPDF && pdfError && (
                    <button
                      onClick={() => window.open(material.downloadURL, '_blank')}
                      className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Open in new tab</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}