'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getProgrammes, getMaterialsWithFilters, deleteMaterialWithStorage } from '@/lib/academic';
import { useAuth } from '@/contexts/AuthContext';
import type { Material, MaterialFilter, Programme } from '@/types/academic';
import { formatFileSize, getFileTypeIcon } from '@/lib/storage';
import { MaterialDeleteDialog } from './MaterialDeleteDialog';

interface AdminMaterialsManagerProps {
  className?: string;
}

export function AdminMaterialsManager({ className }: AdminMaterialsManagerProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load programmes and materials
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load programmes
      const programmesData = await getProgrammes();
      setProgrammes(programmesData);

      // Load materials with filters
      const filter: MaterialFilter = {};
      if (selectedProgramme) filter.programmeId = selectedProgramme;
      if (selectedSemester) filter.semester = parseInt(selectedSemester);
      if (selectedType) filter.materialType = selectedType as 'note' | 'exam_paper' | 'answer_scheme';
      if (selectedStatus) filter.approvalStatus = selectedStatus as 'pending' | 'approved' | 'rejected';
      if (debouncedSearchQuery) filter.searchQuery = debouncedSearchQuery;

      const result = await getMaterialsWithFilters(filter);
      setMaterials(result.materials);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProgramme, selectedSemester, selectedType, selectedStatus, debouncedSearchQuery]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering after initial data fetch
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = debouncedSearchQuery === '' ||
      (material.title?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || false) ||
      (material.subjectName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || false) ||
      (material.uploaderName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || false) ||
      (material.programmeId?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || false);

    const matchesProgramme = selectedProgramme === '' || material.programmeId === selectedProgramme;
    const matchesSemester = selectedSemester === '' || material.semester === parseInt(selectedSemester);
    const matchesType = selectedType === '' || material.materialType === selectedType;
    const matchesStatus = selectedStatus === '' || material.approvalStatus === selectedStatus;

    return matchesSearch && matchesProgramme && matchesSemester && matchesType && matchesStatus;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedProgramme, selectedSemester, selectedType, selectedStatus]);

  const handleDeleteClick = (material: Material) => {
    setSelectedMaterial(material);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!selectedMaterial || !user) return;

    try {
      setDeleting(true);
      await deleteMaterialWithStorage(selectedMaterial.materialId, user.uid, reason);

      // Remove from local state
      setMaterials(prev => prev.filter(m => m.materialId !== selectedMaterial.materialId));

      setShowDeleteDialog(false);
      setSelectedMaterial(null);

    } catch (error) {
      console.error('Error deleting material:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Sort filtered materials
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    let aValue: number | string | Date, bValue: number | string | Date;

    switch (sortBy) {
      case 'title':
        aValue = a.title?.toLowerCase() || '';
        bValue = b.title?.toLowerCase() || '';
        break;
      case 'uploadDate':
        aValue = a.uploadDate?.toDate?.() || new Date(0);
        bValue = b.uploadDate?.toDate?.() || new Date(0);
        break;
      case 'downloadCount':
        aValue = a.downloadCount || 0;
        bValue = b.downloadCount || 0;
        break;
      case 'fileSize':
        aValue = a.fileSize || 0;
        bValue = b.fileSize || 0;
        break;
      default:
        aValue = a.uploadDate?.toDate?.() || new Date(0);
        bValue = b.uploadDate?.toDate?.() || new Date(0);
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMaterials = sortedMaterials.slice(startIndex, startIndex + itemsPerPage);

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      {[...Array(8)].map((_, index) => (
        <td key={index} className="px-4 py-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </td>
      ))}
    </tr>
  );

  // Show skeleton while loading data
  const showSkeleton = loading;

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

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading materials...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Content Management 📚
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage and moderate academic materials
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {filteredMaterials.length} materials
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by title, uploader, subject, programme, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Programme Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Programme
            </label>
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">All Programmes</option>
              {programmes.map(programme => (
                <option key={programme.programmeId} value={programme.programmeId}>
                  {programme.programmeCode} - {programme.programmeName}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">All Types</option>
              <option value="note">Notes</option>
              <option value="exam_paper">Exam Papers</option>
              <option value="answer_scheme">Answer Schemes</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedProgramme('');
              setSelectedSemester('');
              setSelectedType('');
              setSelectedStatus('');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear all filters
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Results Info */}
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {paginatedMaterials.length} of {filteredMaterials.length} materials
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Items per page:</span>
            <select
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

      {/* Materials Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => handleSort('title')}
                >
                  Title {getSortIcon('title')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Programme/Semester
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Uploader
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => handleSort('uploadDate')}
                >
                  Upload Date {getSortIcon('uploadDate')}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => handleSort('downloadCount')}
                >
                  Downloads {getSortIcon('downloadCount')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {showSkeleton ? (
                // Show skeleton loaders
                [...Array(itemsPerPage)].map((_, index) => <SkeletonRow key={index} />)
              ) : (
                // Show actual data
                paginatedMaterials.map((material) => (
                <tr key={material.materialId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getFileTypeIcon(material.fileType)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {material.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {material.subjectCode} - {material.subjectName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatFileSize(material.fileSize)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {getTypeIcon(material.materialType)} {material.materialType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {material.programmeId} / Sem {material.semester}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {material.uploaderName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {material.uploaderRole}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {material.uploadDate?.toDate?.().toLocaleDateString() || 'Unknown'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {material.downloadCount || 0}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      material.approvalStatus === 'approved'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : material.approvalStatus === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {getStatusBadge(material.approvalStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleDeleteClick(material)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      disabled={deleting}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>

        {!showSkeleton && paginatedMaterials.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">📂</div>
            <div className="text-gray-500 dark:text-gray-400">No materials found</div>
            <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Try adjusting your filters
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-400'
              }`}
            >
              Previous
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-400'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      {selectedMaterial && (
        <MaterialDeleteDialog
          material={selectedMaterial}
          isOpen={showDeleteDialog}
          isDeleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteDialog(false);
            setSelectedMaterial(null);
          }}
        />
      )}
    </div>
  );
}