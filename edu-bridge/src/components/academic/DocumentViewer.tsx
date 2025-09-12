'use client';

import React, { useState } from 'react';
import { incrementDownloadCount } from '@/lib/academic';
import type { Material } from '@/types/academic';

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

  const formatUploadDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isPDF = material.fileType.includes('pdf');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-6xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {material.title}
                </h2>
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getMaterialTypeColor(material.materialType)}`}>
                  {getMaterialTypeLabel(material.materialType)}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{material.subjectCode}</span>
                <span>•</span>
                <span>{formatUploadDate(material.uploadDate)}</span>
                <span>•</span>
                <span>{material.uploaderRole === 'lecturer' ? 'Pensyarah' : 'Pelajar'}</span>
              </div>
              {material.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {material.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3 ml-4">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memuat turun...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Muat turun</span>
                </>
              )}
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    ? 'Tidak dapat memaparkan PDF'
                    : 'Pratonton tidak tersedia'
                  }
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {isPDF && pdfError 
                    ? 'PDF ini tidak dapat dipaparkan dalam pelayar. Sila muat turun untuk melihat kandungan.'
                    : `Jenis fail ${material.fileType.includes('word') ? 'Word' : material.fileType.includes('presentation') ? 'PowerPoint' : 'ini'} tidak boleh dilihat pratonton. Sila muat turun untuk membuka fail.`
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
                        <span>Memuat turun...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Muat Turun {material.fileName}</span>
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
                      <span>Buka dalam tab baru</span>
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