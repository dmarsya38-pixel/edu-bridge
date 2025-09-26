'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { navigateToMaterialFromSearch } from '@/lib/dashboard-navigation';
import type { CommentWithHighlight } from '@/types/academic';

interface CommentSearchResultProps {
  comment: CommentWithHighlight;
  onNavigate?: () => void;
}

export function CommentSearchResult({ comment, onNavigate }: CommentSearchResultProps) {
  const router = useRouter();

  const handleClick = () => {
    navigateToMaterialFromSearch(router, {
      programmeId: comment.programmeId!,
      subjectCode: comment.subjectCode!,
      materialId: comment.materialId!,
      searchQuery: '', // This could be populated from parent component
      commentId: comment.commentId,
      showComments: true
    });
    onNavigate?.();
  };

  const formatContent = (content: string, highlightedContent?: string) => {
    if (highlightedContent) {
      return <span dangerouslySetInnerHTML={{ __html: highlightedContent }} />;
    }
    return content.length > 150 ? `${content.substring(0, 150)}...` : content;
  };

  const formatDate = (timestamp: Date | { toDate: () => Date }) => {
    if (!timestamp) return '';
    const date = 'toDate' in timestamp ? timestamp.toDate() : timestamp;
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4
        hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start space-x-3">
        {/* Comment Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Author and Date */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {comment.highlightedFields?.authorName || comment.authorName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdAt)}
              </span>
            </div>
          </div>

          {/* Comment Text */}
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
            {formatContent(comment.content, comment.highlightedFields?.content)}
          </div>

          {/* Material Context */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>In: {comment.materialTitle}</span>
              <span>•</span>
              <span>{comment.subjectCode}</span>
            </div>

            {/* View Comment Button */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium">
                View Comment →
              </button>
            </div>
          </div>

          {/* Attachments (if any) */}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-2 flex items-center space-x-2">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {comment.attachments.length} attachment{comment.attachments.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}