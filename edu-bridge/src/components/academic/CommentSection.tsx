'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Comment } from './Comment';
import { addComment, getComments, deleteComment } from '@/lib/academic';
import type { Comment as CommentType } from '@/types/academic';
import { COMMENT_ALLOWED_FILE_TYPES, COMMENT_MAX_FILE_SIZE, COMMENT_MAX_FILES } from '@/types/academic';

interface CommentSectionProps {
  materialId: string;
  isVisible: boolean;
  materialUploaderId?: string;
  commentId?: string;
}

export function CommentSection({ materialId, isVisible, materialUploaderId, commentId = '' }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!isVisible) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const fetchedComments = await getComments(materialId);
      setComments(fetchedComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Gagal memuatkan komen. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [materialId, isVisible]);

  React.useEffect(() => {
    if (isVisible) {
      loadComments();
    }
  }, [loadComments, isVisible]);

  // Scroll to specific comment if commentId is provided
  React.useEffect(() => {
    if (isVisible && commentId && comments.length > 0) {
      const timer = setTimeout(() => {
        const commentElement = document.getElementById(`comment-${commentId}`);
        if (commentElement) {
          commentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Highlight the comment briefly
          commentElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            commentElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }, 3000);
        }
      }, 100); // Small delay to ensure comments are rendered

      return () => clearTimeout(timer);
    }
  }, [isVisible, commentId, comments]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!COMMENT_ALLOWED_FILE_TYPES.includes(file.type as typeof COMMENT_ALLOWED_FILE_TYPES[number])) {
        alert(`File type ${file.type} is not allowed. Allowed types: PDF, DOC, DOCX, PNG, JPG`);
        return false;
      }
      
      if (file.size > COMMENT_MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });

    if (selectedFiles.length + validFiles.length > COMMENT_MAX_FILES) {
      alert(`You can only attach up to ${COMMENT_MAX_FILES} files per comment.`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newComment.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await addComment(
        {
          materialId,
          content: newComment.trim(),
          files: selectedFiles.length > 0 ? selectedFiles : undefined
        },
        user.uid,
        user.displayName || 'Unknown User',
        user.role as 'student' | 'lecturer'
      );

      // Reset form
      setNewComment('');
      setSelectedFiles([]);
      
      // Reload comments
      await loadComments();
      
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Gagal menghantar komen. Sila cuba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(materialId, commentId);
      await loadComments(); // Reload comments
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Gagal memadam komen. Sila cuba lagi.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Comment Input Form */}
      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Tambah Komen
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Kongsi pemikiran anda atau tanya soalan tentang bahan ini..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isSubmitting}
            />

            {/* File Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lampiran Fail (Opsional)
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedFiles.length}/{COMMENT_MAX_FILES} files • Max 5MB setiap satu
                </span>
              </div>

              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={selectedFiles.length >= COMMENT_MAX_FILES || isSubmitting}
              />

              <label
                htmlFor="file-upload"
                className={`inline-flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors ${
                  selectedFiles.length >= COMMENT_MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Pilih fail atau seret ke sini
                </span>
              </label>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghantar...</span>
                  </div>
                ) : (
                  'Hantar Komen'
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Komen ({comments.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 dark:text-gray-400">Memuatkan komen...</span>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Tiada Komen Lagi
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Jadilah yang pertama untuk komen pada bahan ini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Comment
                key={comment.commentId}
                comment={comment}
                currentUserId={user?.uid}
                onDelete={user?.uid === comment.authorId ? handleDeleteComment : undefined}
                materialUploaderId={materialUploaderId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}