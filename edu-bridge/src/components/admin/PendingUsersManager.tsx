'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingUsers, approveUser, rejectUser, bulkApproveUsers } from '@/lib/admin';
import type { PendingUser } from '@/lib/admin';

export function PendingUsersManager() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [processingUsers, setProcessingUsers] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const users = await getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!user) return;

    setProcessingUsers(prev => [...prev, userId]);
    try {
      const result = await approveUser(userId, user.uid, user.fullName);
      if (result.success) {
        setPendingUsers(prev => prev.filter(u => u.uid !== userId));
      }
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setProcessingUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!user || !rejectionReason.trim()) return;

    setProcessingUsers(prev => [...prev, userId]);
    try {
      const result = await rejectUser(userId, user.uid, user.fullName, rejectionReason);
      if (result.success) {
        setPendingUsers(prev => prev.filter(u => u.uid !== userId));
        setShowRejectModal(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setProcessingUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkApprove = async () => {
    if (!user || selectedUsers.length === 0) return;

    try {
      const result = await bulkApproveUsers(selectedUsers, user.uid, user.fullName);
      if (result.success) {
        setPendingUsers(prev => prev.filter(u => !selectedUsers.includes(u.uid)));
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error('Error bulk approving users:', error);
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedUsers(prev => 
      prev.length === pendingUsers.length 
        ? [] 
        : pendingUsers.map(u => u.uid)
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              User Registration Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              All users are automatically verified upon registration
            </p>
          </div>
          
          {selectedUsers.length > 0 && (
            <button
              onClick={handleBulkApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Approve Selected ({selectedUsers.length})
            </button>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="max-h-96 overflow-y-auto">
        {pendingUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No pending registrations
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Both students and lecturers are automatically verified upon registration. Students with valid matric IDs and lecturers with institutional emails get instant access.
            </p>
          </div>
        ) : (
          <>
            {/* Select All Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === pendingUsers.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select All
                </span>
              </label>
            </div>

            {/* Users List */}
            {pendingUsers.map((pendingUser) => (
              <div key={pendingUser.uid} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(pendingUser.uid)}
                    onChange={() => toggleSelectUser(pendingUser.uid)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {pendingUser.fullName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pendingUser.email}
                        </p>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {pendingUser.role === 'lecturer' ? (
                          <>
                            <p className="font-medium">{pendingUser.employeeId}</p>
                            <p>{pendingUser.department} • {pendingUser.position}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{pendingUser.matricId}</p>
                            <p>{pendingUser.program} • {pendingUser.entryYear}</p>
                          </>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        {pendingUser.registrationDate.toDate().toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApproveUser(pendingUser.uid)}
                      disabled={processingUsers.includes(pendingUser.uid)}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      {processingUsers.includes(pendingUser.uid) ? 'Processing...' : 'Approve'}
                    </button>
                    
                    <button
                      onClick={() => setShowRejectModal(pendingUser.uid)}
                      disabled={processingUsers.includes(pendingUser.uid)}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Reject User Registration
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for rejecting this registration:
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={() => handleRejectUser(showRejectModal)}
                disabled={!rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                Reject User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}