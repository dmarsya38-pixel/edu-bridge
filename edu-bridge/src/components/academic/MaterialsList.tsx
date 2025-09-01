'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MaterialCard } from './MaterialCard';
import { getMaterials } from '@/lib/academic';
import type { Material, MaterialFilter } from '@/types/academic';
import type { Subject } from '@/types/academic';

interface MaterialsListProps {
  subject: Subject;
  onBack?: () => void;
  onPreview?: (material: Material) => void;
}

interface MaterialsByYear {
  [year: string]: Material[];
}

export function MaterialsList({ subject, onBack, onPreview }: MaterialsListProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsByYear, setMaterialsByYear] = useState<MaterialsByYear>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'exam_paper' | 'answer_scheme' | 'note'>('all');

  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filter: MaterialFilter = {
        programmeId: subject.programmeId,
        semester: subject.semester,
        subjectCode: subject.subjectCode,
        approvalStatus: 'approved'
      };

      if (selectedType !== 'all') {
        filter.materialType = selectedType;
      }

      const fetchedMaterials = await getMaterials(filter);
      setMaterials(fetchedMaterials);

      // Group materials by academic year
      const grouped = groupMaterialsByYear(fetchedMaterials);
      setMaterialsByYear(grouped);

    } catch (err) {
      console.error('Error loading materials:', err);
      setError('Gagal memuatkan bahan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  }, [subject, selectedType]);

  const groupMaterialsByYear = (materials: Material[]): MaterialsByYear => {
    const grouped: MaterialsByYear = {};

    materials.forEach(material => {
      const uploadDate = material.uploadDate?.toDate ? material.uploadDate.toDate() : new Date(material.uploadDate);
      const year = uploadDate.getFullYear().toString();

      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(material);
    });

    // Sort materials within each year by upload date (newest first)
    Object.keys(grouped).forEach(year => {
      grouped[year].sort((a, b) => {
        const dateA = a.uploadDate?.toDate ? a.uploadDate.toDate() : new Date(a.uploadDate);
        const dateB = b.uploadDate?.toDate ? b.uploadDate.toDate() : new Date(b.uploadDate);
        return dateB.getTime() - dateA.getTime();
      });
    });

    return grouped;
  };

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case 'exam_paper':
        return 'Exam Paper';
      case 'answer_scheme':
        return 'Answer Scheme';
      case 'note':
        return 'Notes';
      default:
        return 'All';
    }
  };

  // Sort years in descending order (newest first)
  const sortedYears = Object.keys(materialsByYear).sort((a, b) => parseInt(b) - parseInt(a));
  const totalMaterials = materials.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {subject.subjectCode} - {subject.subjectName}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Semester {subject.semester} • {totalMaterials} Materials
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          {['all', 'exam_paper', 'answer_scheme', 'note'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type as 'all' | 'exam_paper' | 'answer_scheme' | 'note')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedType === type
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {getMaterialTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 dark:text-gray-400">Memuatkan bahan...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.764 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">Ralat</p>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadMaterials}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Cuba Lagi
          </button>
        </div>
      )}

      {/* Materials by Year */}
      {!loading && !error && (
        <>
          {sortedYears.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Tiada Bahan Dijumpai
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {selectedType === 'all' 
                    ? 'Belum ada bahan yang dimuatnaik untuk subjek ini.'
                    : `Belum ada ${getMaterialTypeLabel(selectedType).toLowerCase()} untuk subjek ini.`
                  }
                </p>
              </div>
            </div>
          ) : (
            /* Materials List */
            <div className="space-y-8">
              {sortedYears.map(year => (
                <div key={year} className="space-y-4">
                  {/* Year Header */}
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Tahun {year}
                    </h2>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {materialsByYear[year].length} bahan
                    </span>
                  </div>
                  
                  {/* Materials Grid */}
                  <div className="grid gap-4">
                    {materialsByYear[year].map(material => (
                      <MaterialCard
                        key={material.materialId}
                        material={material}
                        onPreview={onPreview}
                        showUploader={true}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}