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
    </div>
  );
}