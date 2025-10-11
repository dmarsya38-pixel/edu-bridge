'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSystemSettings,
  updateSystemSettings,
  clearSystemSettingsCache
} from '@/lib/academic';
import { safeFormatTimestamp } from '@/lib/timestamp-utils';
import type { SystemSettings, SystemSettingsUpdate } from '@/types/academic';

interface FileUploadSettingsProps {
  settings: SystemSettings;
  onUpdate: (updates: SystemSettingsUpdate) => void;
  isSaving: boolean;
}

const FileUploadSettings: React.FC<FileUploadSettingsProps> = ({ settings, onUpdate, isSaving }) => {
  // Initialize with defaults if settings are incomplete
  const defaultSettings = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    maxFileNameLength: 100
  };

  const fileUploadSettings = settings.fileUpload || defaultSettings;
  const allowedFileTypes = fileUploadSettings.allowedFileTypes || defaultSettings.allowedFileTypes;
  const maxFileSize = fileUploadSettings.maxFileSize || defaultSettings.maxFileSize;
  const maxFileNameLength = fileUploadSettings.maxFileNameLength || defaultSettings.maxFileNameLength;

  const [maxFileSizeMB, setMaxFileSizeMB] = useState(maxFileSize / (1024 * 1024));
  const [allowedTypes, setAllowedTypes] = useState(allowedFileTypes);
  const [maxFileNameLengthState, setMaxFileNameLengthState] = useState(maxFileNameLength);

  const availableFileTypes = [
    { mime: 'application/pdf', label: 'PDF', icon: '📄' },
    { mime: 'application/msword', label: 'DOC', icon: '📝' },
    { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX', icon: '📝' },
    { mime: 'application/vnd.ms-powerpoint', label: 'PPT', icon: '📊' },
    { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', label: 'PPTX', icon: '📊' },
    { mime: 'application/vnd.ms-excel', label: 'XLS', icon: '📈' },
    { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'XLSX', icon: '📈' },
    { mime: 'image/jpeg', label: 'JPEG', icon: '🖼️' },
    { mime: 'image/png', label: 'PNG', icon: '🖼️' },
    { mime: 'text/plain', label: 'TXT', icon: '📄' },
  ];

  const handleMaxFileSizeChange = (value: string) => {
    const mb = parseFloat(value);
    if (!isNaN(mb) && mb > 0 && mb <= 100) {
      setMaxFileSizeMB(mb);
    }
  };

  const handleFileTypeToggle = (mime: string) => {
    const newTypes = allowedTypes.includes(mime)
      ? allowedTypes.filter(t => t !== mime)
      : [...allowedTypes, mime];

    setAllowedTypes(newTypes);
    onUpdate({
      fileUpload: {
        ...fileUploadSettings,
        allowedFileTypes: newTypes
      }
    });
  };

  const handleSaveSizeSettings = () => {
    onUpdate({
      fileUpload: {
        maxFileSize: maxFileSizeMB * 1024 * 1024,
        maxFileNameLength: maxFileNameLengthState
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Material Upload Settings
        </h4>

        {/* File Size Limit */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum File Size
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Maximum size for uploaded material files
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={maxFileSizeMB}
                onChange={(e) => handleMaxFileSizeChange(e.target.value)}
                className="w-20 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-center text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">MB</span>
              <button
                onClick={handleSaveSizeSettings}
                disabled={isSaving || maxFileSizeMB === (fileUploadSettings.maxFileSize / (1024 * 1024))}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* File Name Length */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum File Name Length
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Maximum number of characters allowed in file names
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="10"
                max="255"
                value={maxFileNameLength}
                onChange={(e) => setMaxFileNameLength(parseInt(e.target.value) || 100)}
                className="w-20 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-center text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">chars</span>
              <button
                onClick={handleSaveSizeSettings}
                disabled={isSaving || maxFileNameLengthState === fileUploadSettings.maxFileNameLength}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Allowed File Types */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mt-4">
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Allowed File Types
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select which file types students and lecturers can upload
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableFileTypes.map((type) => (
              <label
                key={type.mime}
                className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={allowedTypes.includes(type.mime)}
                  onChange={() => handleFileTypeToggle(type.mime)}
                  disabled={isSaving}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="ml-3 text-2xl">{type.icon}</span>
                <div className="ml-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {type.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {type.mime.split('.').pop()}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {allowedTypes.length === 0 && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3">
              ⚠️ At least one file type must be selected
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function SystemSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Only allow admins to access this page
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don&apos;t have permission to access system settings.
          </p>
        </div>
      </div>
    );
  }

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSystemSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: SystemSettingsUpdate) => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updatedSettings = await updateSystemSettings(updates, user.uid);
      setSettings(updatedSettings);

      // Clear cache to ensure fresh data
      clearSystemSettingsCache();

      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Settings not available'}
          </p>
          <button
            onClick={loadSettings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            System Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure platform-wide settings and restrictions
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Last Updated Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Last updated: {safeFormatTimestamp(settings.updatedAt)}
              </span>
              <span>•</span>
              <span>
                By: {settings.updatedBy === user.uid ? 'You' : 'Another admin'}
              </span>
            </div>
            <button
              onClick={loadSettings}
              disabled={saving}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* File Upload Settings */}
          <FileUploadSettings
            settings={settings}
            onUpdate={handleUpdateSettings}
            isSaving={saving}
          />
        </div>

        {/* Save Status Indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">Saving changes...</span>
          </div>
        )}
      </div>
    </div>
  );
}