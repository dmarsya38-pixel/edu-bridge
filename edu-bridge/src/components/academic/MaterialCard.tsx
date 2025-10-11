'use client';

import React, { useState, useCallback } from 'react';
import { incrementDownloadCount, getComments } from '@/lib/academic';
import { CommentSection } from './CommentSection';
import type { Material } from '@/types/academic';
import type { Timestamp } from 'firebase/firestore';

interface MaterialCardProps {
  material: Material;
  onPreview?: (material: Material) => void;
  showUploader?: boolean;
  initialShowComments?: boolean;
  highlight?: string;
  commentId?: string;
}

export function MaterialCard({ material, onPreview, showUploader = false, initialShowComments = false, highlight = '', commentId = '' }: MaterialCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showComments, setShowComments] = useState(initialShowComments);
  const [commentCount, setCommentCount] = useState(0);

  // Function to highlight text
  const highlightText = (text: string, highlightTerm: string) => {
    if (!highlightTerm.trim()) return text;

    const regex = new RegExp(`(${highlightTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // Safe HTML rendering for highlighted text
  const HighlightedText = ({ text, highlightTerm }: { text: string; highlightTerm: string }) => {
    if (!highlightTerm.trim()) {
      return <span>{text}</span>;
    }

    const highlightedText = highlightText(text, highlightTerm);
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };
  
  const handleDownload = async () => {
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      // Track download
      await incrementDownloadCount(material.materialId);
      
      // Open download URL
      window.open(material.downloadURL, '_blank');
      
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const loadCommentCount = useCallback(async () => {
    try {
      const comments = await getComments(material.materialId);
      setCommentCount(comments.length);
    } catch (error) {
      console.error('Error loading comment count:', error);
    }
  }, [material.materialId]);

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  // Load comment count when component mounts
  React.useEffect(() => {
    loadCommentCount();
  }, [loadCommentCount]);

  const handlePreview = () => {
    if (onPreview) {
      onPreview(material);
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return (
        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
          <span className="text-red-600 dark:text-red-400 text-xs font-bold">PDF</span>
        </div>
      );
    }
    if (fileType.includes('word') || fileType.includes('document')) {
      return (
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">DOC</span>
        </div>
      );
    }
    if (fileType.includes('presentation')) {
      return (
        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
          <span className="text-orange-600 dark:text-orange-400 text-xs font-bold">PPT</span>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    );
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        {/* File Type Icon */}
        {getFileTypeIcon(material.fileType)}
        
        {/* Material Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                <HighlightedText text={material.title} highlightTerm={highlight} />
              </h3>

              {material.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  <HighlightedText text={material.description} highlightTerm={highlight} />
                </p>
              )}
            </div>
            
            {/* Material Type Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getMaterialTypeColor(material.materialType)}`}>
              {getMaterialTypeLabel(material.materialType)}
            </span>
          </div>
          
          {/* File Details */}
          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatFileSize(material.fileSize)}</span>
            <span>{formatUploadDate(material.uploadDate)}</span>
            {material.downloadCount > 0 && (
              <span className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{material.downloadCount}</span>
              </span>
            )}
            {showUploader && (
              <span>by {material.uploaderRole === 'lecturer' ? 'Lecturer' : 'Student'} | {material.uploaderName}</span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="mt-3 flex items-center space-x-2">
            {/* Preview Button (for PDFs) */}
            {material.fileType.includes('pdf') && onPreview && (
              <button
                onClick={handlePreview}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Preview</span>
              </button>
            )}
            
            {/* Comments Button - Hidden for exam papers */}
            {material.materialType !== 'exam_paper' && (
              <button
                onClick={toggleComments}
                className={`inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  showComments 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Comments ({commentCount})</span>
              </button>
            )}
            
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {isDownloading ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Comments Section - Hidden for exam papers */}
      {showComments && material.materialType !== 'exam_paper' && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <CommentSection
            materialId={material.materialId}
            isVisible={showComments}
            materialUploaderId={material.uploaderId}
            commentId={commentId}
          />
        </div>
      )}
    </div>
  );
}