'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMaterialFile, formatFileSize, getFileTypeIcon, validateFile } from '@/lib/storage';
import { createMaterial } from '@/lib/academic';
import { getProgrammes, getSubjectsByProgramme, getSubjectsBySemester } from '@/lib/academic';
import type { 
  Programme, 
  Subject, 
  MaterialType, 
  MaterialMetadata 
} from '@/types/academic';
import type { FileUploadProgress } from '@/lib/storage';
import { MATERIAL_TYPES, SEMESTERS } from '@/types/academic';

interface MaterialUploadFormProps {
  onSuccess?: (materialId: string) => void;
  onCancel?: () => void;
  preselectedSubject?: Subject;
}

export function MaterialUploadForm({ 
  onSuccess, 
  onCancel, 
  preselectedSubject 
}: MaterialUploadFormProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState<MaterialMetadata>({
    title: '',
    description: '',
    materialType: 'note',
    programmeId: preselectedSubject?.programmeId || user?.program || '',
    semester: preselectedSubject?.semester || 1,
    subjectCode: preselectedSubject?.subjectCode || '',
    subjectName: preselectedSubject?.subjectName || ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load programmes on mount
  React.useEffect(() => {
    loadProgrammes();
  }, []);

  // Load subjects when programme OR semester changes
  React.useEffect(() => {
    console.log(`🔄 useEffect triggered: programme=${formData.programmeId}, semester=${formData.semester}`);
    if (formData.programmeId) {
      loadSubjects(formData.programmeId, formData.semester);
    } else {
      console.log('⚠️ No programme selected, skipping subject load');
    }
  }, [formData.programmeId, formData.semester]);

  const loadProgrammes = async () => {
    try {
      const data = await getProgrammes();
      setProgrammes(data);
    } catch (error) {
      console.error('Error loading programmes:', error);
    }
  };

  const loadSubjects = async (programmeId: string, semester: number) => {
    try {
      console.log(`🔍 Loading subjects for ${programmeId} semester ${semester}...`);
      const data = await getSubjectsBySemester(programmeId, semester);
      console.log(`✅ Loaded ${data.length} subjects:`, data);
      setSubjects(data);
    } catch (error) {
      console.error('❌ Error loading subjects:', error);
      setSubjects([]); // Clear subjects on error
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    const processedValue = name === 'semester' ? parseInt(value, 10) : value;
    console.log(`📝 Form field changed: ${name}=${processedValue} (type: ${typeof processedValue})`);
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Auto-fill subject name when subject code is selected
    if (name === 'subjectCode') {
      const selectedSubject = subjects.find(s => s.subjectCode === value);
      if (selectedSubject) {
        setFormData(prev => ({
          ...prev,
          subjectName: selectedSubject.subjectName,
          semester: selectedSubject.semester
        }));
      }
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, file: validation.error!.message }));
      return;
    }

    setSelectedFile(file);
    setErrors(prev => ({ ...prev, file: '' }));

    // Auto-fill title if empty
    if (!formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setFormData(prev => ({
        ...prev,
        title: fileName
      }));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.materialType) {
      newErrors.materialType = 'Material type is required';
    }

    if (!formData.programmeId) {
      newErrors.programmeId = 'Programme is required';
    }

    if (!formData.subjectCode) {
      newErrors.subjectCode = 'Subject is required';
    }

    if (!selectedFile) {
      newErrors.file = 'Please select a file to upload';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm() || !selectedFile) {
      return;
    }

    setIsUploading(true);
    setUploadProgress({ bytesTransferred: 0, totalBytes: 0, percentage: 0 });

    try {
      // Upload file to Firebase Storage
      const uploadResult = await uploadMaterialFile(
        selectedFile,
        formData.programmeId,
        formData.semester,
        formData.subjectCode,
        formData.materialType,
        (progress) => setUploadProgress(progress)
      );

      // Create material document in Firestore
      const materialId = await createMaterial(
        formData,
        {
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          fileType: uploadResult.fileType,
          downloadURL: uploadResult.downloadURL
        },
        user.uid,
        user.role as 'student' | 'lecturer'
      );

      // Success callback
      if (onSuccess) {
        onSuccess(materialId);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        materialType: 'note',
        programmeId: user.program || '',
        semester: 1,
        subjectCode: '',
        subjectName: ''
      });
      setSelectedFile(null);
      setUploadProgress(null);

    } catch (error) {
      console.error('Upload failed:', error);
      setErrors({ general: 'Upload failed. Please try again.' });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const getCurrentProgramme = () => {
    return programmes.find(p => p.programmeCode === formData.programmeId);
  };

  const getSubjectsForSemester = () => {
    // No need to filter anymore - subjects are already loaded for the current semester
    return subjects;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Upload Material
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {errors.general && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select File *
          </label>
          
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : selectedFile
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="text-4xl">
                  {getFileTypeIcon(selectedFile.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-4xl">📎</div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drag and drop your file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
                    >
                      browse files
                    </button>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    PDF, DOC, DOCX, PPT, PPTX files up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            className="hidden"
          />
          
          {errors.file && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.file}</p>
          )}
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Uploading...
              </span>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {Math.round(uploadProgress.percentage)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Material Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Material Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Chapter 1 Notes - Introduction to Marketing"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.title && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Material Type */}
          <div>
            <label htmlFor="materialType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Material Type *
            </label>
            <select
              id="materialType"
              name="materialType"
              value={formData.materialType}
              onChange={handleInputChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(MATERIAL_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Programme */}
          <div>
            <label htmlFor="programmeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Programme *
            </label>
            <select
              id="programmeId"
              name="programmeId"
              value={formData.programmeId}
              onChange={handleInputChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Programme</option>
              {programmes.map((programme) => (
                <option key={programme.programmeCode} value={programme.programmeCode}>
                  {programme.programmeCode} - {programme.programmeName}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Semester *
            </label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SEMESTERS.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subjectCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject *
            </label>
            <select
              id="subjectCode"
              name="subjectCode"
              value={formData.subjectCode}
              onChange={handleInputChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!formData.programmeId}
            >
              <option value="">Select Subject</option>
              {getSubjectsForSemester().map((subject) => (
                <option key={subject.subjectCode} value={subject.subjectCode}>
                  {subject.subjectCode} - {subject.subjectName}
                </option>
              ))}
            </select>
            {errors.subjectCode && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.subjectCode}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            placeholder="Describe the content of this material..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Approval Notice */}
        {user?.role === 'student' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Student Upload Notice
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Your upload will be reviewed by an admin before being made available to other students.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload Material</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}