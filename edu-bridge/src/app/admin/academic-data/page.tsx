'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

interface Programme {
  id: string;
  programmeCode: string;
  programmeName: string;
  department: string;
  isActive: boolean;
  createdAt?: {
  toDate: () => Date;
};
}

interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  programmeId: string;
  semester: number;
  creditHours: number;
  description: string;
  isActive: boolean;
  createdAt?: {
  toDate: () => Date;
};
}

export default function AcademicDataPage() {
  const { user, logout } = useAuth();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProgramme, setShowAddProgramme] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form states
  const [newProgramme, setNewProgramme] = useState({
    programmeCode: '',
    programmeName: '',
    department: 'Commerce'
  });

  const [newSubject, setNewSubject] = useState({
    subjectCode: '',
    subjectName: '',
    programmeId: '',
    semester: 1,
    creditHours: 3,
    description: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filter states
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      const db = getDb();

      // Fetch programmes
      const programmesSnapshot = await getDocs(collection(db, 'programmes'));
      const programmesData = programmesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Programme[];
      setProgrammes(programmesData);

      // Fetch subjects
      const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsData = subjectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subject[];
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleProgrammeStatus = async (programmeId: string, currentStatus: boolean) => {
    try {
      const db = getDb();
      const programmeRef = doc(db, 'programmes', programmeId);
      await updateDoc(programmeRef, {
        isActive: !currentStatus
      });
      await fetchData();
    } catch (error) {
      console.error('Error updating programme status:', error);
    }
  };

  const toggleSubjectStatus = async (subjectId: string, currentStatus: boolean) => {
    try {
      const db = getDb();
      const subjectRef = doc(db, 'subjects', subjectId);
      await updateDoc(subjectRef, {
        isActive: !currentStatus
      });
      await fetchData();
    } catch (error) {
      console.error('Error updating subject status:', error);
    }
  };

  const handleAddProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const db = getDb();
      await addDoc(collection(db, 'programmes'), {
        ...newProgramme,
        programmeId: newProgramme.programmeCode,
        isActive: true,
        createdAt: serverTimestamp()
      });
      setNewProgramme({ programmeCode: '', programmeName: '', department: 'Commerce' });
      setShowAddProgramme(false);
      await fetchData();
    } catch (error) {
      console.error('Error adding programme:', error);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const db = getDb();
      await addDoc(collection(db, 'subjects'), {
        ...newSubject,
        subjectId: newSubject.subjectCode,
        isActive: true,
        createdAt: serverTimestamp()
      });
      setNewSubject({
        subjectCode: '',
        subjectName: '',
        programmeId: '',
        semester: 1,
        creditHours: 3,
        description: ''
      });
      setShowAddSubject(false);
      await fetchData();
    } catch (error) {
      console.error('Error adding subject:', error);
    }
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    try {
      const db = getDb();
      const subjectRef = doc(db, 'subjects', editingSubject.id);
      await updateDoc(subjectRef, {
        subjectName: editingSubject.subjectName,
        description: editingSubject.description,
        creditHours: editingSubject.creditHours,
        semester: editingSubject.semester
      });
      setEditingSubject(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating subject:', error);
    }
  };

  const getSubjectsByProgramme = (programmeId: string) => {
    return subjects.filter(subject => subject.programmeId === programmeId);
  };

  const getProgrammeName = (programmeId: string) => {
    const programme = programmes.find(p => p.programmeCode === programmeId);
    return programme ? programme.programmeName : programmeId;
  };

  // Filter and paginate subjects
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = debouncedSearchTerm === '' ||
      subject.subjectCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      subject.subjectName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      subject.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    const matchesProgramme = selectedProgramme === '' || subject.programmeId === selectedProgramme;
    const matchesSemester = selectedSemester === '' || subject.semester.toString() === selectedSemester;
    const matchesStatus = selectedStatus === '' ||
      (selectedStatus === 'active' && subject.isActive) ||
      (selectedStatus === 'inactive' && !subject.isActive);

    return matchesSearch && matchesProgramme && matchesSemester && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubjects = filteredSubjects.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedProgramme, selectedSemester, selectedStatus]);

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      {[...Array(8)].map((_, index) => (
        <td key={index} className="py-3 px-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </td>
      ))}
    </tr>
  );

  // Show skeleton while loading data
  const showSkeleton = loading;

  if (loading && !subjects.length) {
    return (
      <AdminRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading academic data...</p>
          </div>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Academic Data Management
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Manage programmes and subjects
                  </p>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="text-sm text-right">
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {user.fullName}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      System Administrator
                    </p>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <a
                    href="/dashboard"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </a>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Action Buttons */}
          <div className="mb-8 flex flex-wrap gap-4">
            <button
              onClick={() => setShowAddProgramme(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Programme</span>
            </button>
            <button
              onClick={() => setShowAddSubject(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Subject</span>
            </button>
          </div>

          {/* Programmes Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Programmes</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Subjects</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {programmes.map((programme) => (
                    <tr key={programme.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{programme.programmeCode}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{programme.programmeName}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{programme.department}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                        {getSubjectsByProgramme(programme.programmeCode).length}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          programme.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {programme.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleProgrammeStatus(programme.id, programme.isActive)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            programme.isActive
                              ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400'
                              : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-800/50 dark:text-green-400'
                          }`}
                        >
                          {programme.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subjects Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Subjects</h2>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Search & Filter</h3>
                {(searchTerm || selectedProgramme || selectedSemester || selectedStatus) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedProgramme('');
                      setSelectedSemester('');
                      setSelectedStatus('');
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div>
                <input
                  type="text"
                  placeholder="Search subjects..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Programme Filter */}
                <div>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedProgramme}
                    onChange={(e) => setSelectedProgramme(e.target.value)}
                  >
                    <option value="">All Programmes</option>
                    {programmes.map(programme => (
                      <option key={programme.programmeCode} value={programme.programmeCode}>
                        {programme.programmeName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester Filter */}
                <div>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <option value="">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Info */}
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {paginatedSubjects.length} of {filteredSubjects.length} subjects
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

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Programme</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Semester</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Credits</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {showSkeleton ? (
                    // Show skeleton loaders
                    [...Array(itemsPerPage)].map((_, index) => <SkeletonRow key={index} />)
                  ) : (
                    // Show actual data
                    paginatedSubjects.map((subject) => (
                      <tr key={subject.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{subject.subjectCode}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{subject.subjectName}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{getProgrammeName(subject.programmeId)}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{subject.semester}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{subject.creditHours}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {subject.description}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            subject.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {subject.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingSubject(subject)}
                              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-400 rounded-lg text-xs font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleSubjectStatus(subject.id, subject.isActive)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                subject.isActive
                                  ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400'
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-800/50 dark:text-green-400'
                              }`}
                            >
                              {subject.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
        </main>

        {/* Add Programme Modal */}
        {showAddProgramme && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New Programme</h3>
              <form onSubmit={handleAddProgramme}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Programme Code
                    </label>
                    <input
                      type="text"
                      value={newProgramme.programmeCode}
                      onChange={(e) => setNewProgramme({...newProgramme, programmeCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Programme Name
                    </label>
                    <input
                      type="text"
                      value={newProgramme.programmeName}
                      onChange={(e) => setNewProgramme({...newProgramme, programmeName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department
                    </label>
                    <select
                      value={newProgramme.department}
                      onChange={(e) => setNewProgramme({...newProgramme, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="Commerce">Commerce</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Science">Science</option>
                      <option value="Arts">Arts</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddProgramme(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                  >
                    Add Programme
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Subject Modal */}
        {showAddSubject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New Subject</h3>
              <form onSubmit={handleAddSubject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      value={newSubject.subjectCode}
                      onChange={(e) => setNewSubject({...newSubject, subjectCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={newSubject.subjectName}
                      onChange={(e) => setNewSubject({...newSubject, subjectName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Programme
                    </label>
                    <select
                      value={newSubject.programmeId}
                      onChange={(e) => setNewSubject({...newSubject, programmeId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      required
                    >
                      <option value="">Select a programme</option>
                      {programmes.filter(p => p.isActive).map(programme => (
                        <option key={programme.id} value={programme.programmeCode}>
                          {programme.programmeCode} - {programme.programmeName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Semester
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={newSubject.semester}
                        onChange={(e) => setNewSubject({...newSubject, semester: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Credit Hours
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={newSubject.creditHours}
                        onChange={(e) => setNewSubject({...newSubject, creditHours: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newSubject.description}
                      onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      rows={3}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddSubject(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                  >
                    Add Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Subject Modal */}
        {editingSubject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Subject</h3>
              <form onSubmit={handleEditSubject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      value={editingSubject.subjectCode}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={editingSubject.subjectName}
                      onChange={(e) => setEditingSubject({...editingSubject, subjectName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Semester
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={editingSubject.semester}
                        onChange={(e) => setEditingSubject({...editingSubject, semester: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Credit Hours
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={editingSubject.creditHours}
                        onChange={(e) => setEditingSubject({...editingSubject, creditHours: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingSubject.description}
                      onChange={(e) => setEditingSubject({...editingSubject, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      rows={3}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingSubject(null)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Update Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}