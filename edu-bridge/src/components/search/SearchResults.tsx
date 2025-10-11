'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { searchAll } from '@/lib/academic';
import { SearchBar } from './SearchBar';
import { SearchFilters } from './SearchFilters';
import { CommentSearchResult } from './CommentSearchResult';
import { SubjectSearchResult } from './SubjectSearchResult';
import { MaterialCard } from '@/components/academic/MaterialCard';
import type { Material, SearchResults as SearchResultsType, SearchSortBy, SearchAllOptions } from '@/types/academic';

interface SearchResultsProps {
  query: string;
  highlight?: string;
  commentId?: string;
  onBack: () => void;
  onPreview: (material: Material) => void;
}

type ActiveTab = 'materials' | 'comments' | 'subjects';

export function SearchResults({ query, highlight = '', commentId: _commentId, onBack, onPreview }: SearchResultsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('materials');
  const [searchResults, setSearchResults] = useState<SearchResultsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuery, setCurrentQuery] = useState(query);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const resultsPerPage = 10;

  const debouncedQuery = useDebounce(currentQuery, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const options: SearchAllOptions = {
          filters,
          limit: 50, // Get more results for pagination
          sortBy: sortBy as SearchSortBy
        };
        const results = await searchAll(debouncedQuery, options);
        setSearchResults(results);
      } catch (error) {
        console.error('Error performing search:', error);
        setSearchResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, sortBy, filters]);

  const handleSearch = (newQuery: string) => {
    setCurrentQuery(newQuery);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  };

  const getCurrentResults = () => {
    if (!searchResults) return [];

    const results = activeTab === 'materials' ? searchResults.materials :
                   activeTab === 'comments' ? searchResults.comments :
                   searchResults.subjects;
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    return results.slice(startIndex, endIndex);
  };

  const getTotalResults = () => {
    if (!searchResults) return 0;
    return activeTab === 'materials' ? searchResults.totalMaterials :
           activeTab === 'comments' ? searchResults.totalComments :
           searchResults.totalSubjects;
  };

  const getTotalPages = () => {
    const total = getTotalResults();
    return Math.ceil(total / resultsPerPage);
  };


  if (!query.trim()) {
    return (
      <div className="space-y-6">
        {/* Search Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <SearchBar
            value={currentQuery}
            onSearch={handleSearch}
            autoFocus
            placeholder="Search materials, subjects, programmes..."
            className="w-full"
          />
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Search for Materials and Comments
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a search term to find academic materials and discussions across all subjects.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              onBack?.();
              router.push('/dashboard');
            }}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </button>

          {searchResults && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Found {searchResults.totalMaterials + searchResults.totalComments + searchResults.totalSubjects} results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Filters and Sort Options */}
        <div className="flex items-center space-x-2">
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <SearchBar
          value={currentQuery}
          onSearch={handleSearch}
          autoFocus
          placeholder="Search materials, subjects, programmes..."
          className="w-full"
        />
      </div>

      {/* Results Section */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 dark:text-gray-400">Searching...</span>
          </div>
        </div>
      ) : searchResults ? (
        <>
          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleTabChange('materials')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'materials'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                Materials ({searchResults.totalMaterials})
              </button>
              <button
                onClick={() => handleTabChange('comments')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'comments'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                Comments ({searchResults.totalComments})
              </button>
              <button
                onClick={() => handleTabChange('subjects')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'subjects'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                Subjects ({searchResults.totalSubjects})
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {getCurrentResults().length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No {activeTab === 'materials' ? 'materials' : activeTab === 'comments' ? 'comments' : 'subjects'} found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search terms or filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Results Count */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Showing {(currentPage - 1) * resultsPerPage + 1} - {Math.min(currentPage * resultsPerPage, getTotalResults())} of {getTotalResults()} {activeTab}
                  </div>

                  {/* Results List */}
                  <div className="space-y-4">
                    {activeTab === 'materials' ? (
                      getCurrentResults().map((result) => {
                        // Type guard to ensure we only process SearchResult materials
                        if (result.type !== 'material') return null;

                        return (
                          <div key={result.id} className="hover:shadow-md transition-shadow">
                            <MaterialCard
                              material={{
                                materialId: result.id,
                                title: result.title,
                                description: result.description,
                                materialType: result.materialType!,
                                fileName: '', // This would need to be populated
                                fileSize: result.fileSize!,
                                fileType: result.fileType!,
                                downloadURL: result.downloadURL!,
                                programmeId: result.programmeId!,
                                semester: 0, // This would need to be populated
                                subjectCode: result.subjectCode!,
                                subjectName: '', // This would need to be populated
                                uploaderId: '',
                                uploaderName: result.authorName!,
                                uploaderRole: 'student',
                                uploadDate: result.createdAt!,
                                approvalStatus: 'approved',
                                downloadCount: 0,
                                views: 0
                              }}
                              onPreview={onPreview}
                              highlight={highlight}
                            />
                          </div>
                        );
                      })
                    ) : activeTab === 'comments' ? (
                      getCurrentResults().map((result) => {
                        // Type guard to ensure we only process SearchResult comments
                        if (result.type !== 'comment') return null;

                        return (
                          <CommentSearchResult
                            key={result.id}
                            comment={{
                              commentId: result.id,
                              materialId: result.materialId!,
                              content: result.snippet || result.title,
                              authorId: '',
                              authorName: result.authorName!,
                              authorRole: 'student',
                              createdAt: result.createdAt!,
                              materialTitle: result.description || '',
                              subjectCode: result.subjectCode,
                              programmeId: result.programmeId,
                              highlightedFields: {
                                content: result.snippet ? result.snippet.replace(/<mark>/g, '<mark>').replace(/<\/mark>/g, '</mark>') : undefined
                              }
                            }}
                          />
                        );
                      })
                    ) : (
                      getCurrentResults().map((result) => {
                        // Type guard to ensure we only process SubjectSearchResult
                        if (result.type !== 'subject') return null;

                        return (
                          <SubjectSearchResult
                            key={result.id}
                            subject={result}
                          />
                        );
                      })
                    )}
                  </div>

                  {/* Pagination */}
                  {getTotalPages() > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-8">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(getTotalPages(), 5) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-sm border rounded ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
                        disabled={currentPage === getTotalPages()}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Search Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There was an error performing your search. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}