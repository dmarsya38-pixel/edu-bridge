/**
 * Admin utilities for EduBridge+
 * Handles user verification, approval workflows, and admin-specific operations
 */

import { 
  doc, 
  updateDoc, 
  getDocs,
  query,
  collection,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

import { db } from './firebase';
import type { User, UserProfile } from '@/types/user';

// Admin response types
export interface AdminResponse {
  success: boolean;
  error?: string;
}

// User verification data
export interface PendingUser {
  uid: string;
  fullName: string;
  email: string;
  matricId?: string;           // Optional for lecturers
  program?: string;            // Optional for lecturers  
  programName?: string;        // Optional for lecturers
  entryYear?: string;          // Optional for lecturers
  employeeId?: string;         // For lecturers
  department?: string;         // For lecturers
  position?: string;           // For lecturers
  role: 'student' | 'lecturer' | 'admin';
  registrationDate: Timestamp;
  verificationStatus: 'pending' | 'approved' | 'rejected';
}

/**
 * Get all pending user registrations for admin approval
 * (Both students and lecturers are now auto-verified, this function returns empty results)
 */
export async function getPendingUsers(): Promise<PendingUser[]> {
  try {
    // Both students and lecturers are now auto-approved, so no pending users
    return [];
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return [];
  }
}

/**
 * Approve a user registration
 */
export async function approveUser(
  userId: string, 
  adminId: string,
  adminName: string
): Promise<AdminResponse> {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      isVerified: true,
      verificationStatus: 'approved',
      approvedBy: adminId,
      approverName: adminName,
      approvalDate: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving user:', error);
    return { 
      success: false, 
      error: 'Failed to approve user. Please try again.' 
    };
  }
}

/**
 * Reject a user registration
 */
export async function rejectUser(
  userId: string, 
  adminId: string,
  adminName: string,
  reason: string
): Promise<AdminResponse> {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      isVerified: false,
      verificationStatus: 'rejected',
      rejectedBy: adminId,
      rejectorName: adminName,
      rejectionDate: serverTimestamp(),
      rejectionReason: reason
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting user:', error);
    return { 
      success: false, 
      error: 'Failed to reject user. Please try again.' 
    };
  }
}

/**
 * Get all users with optional filtering
 */
export async function getAllUsers(
  status?: 'pending' | 'approved' | 'rejected' | 'all',
  userLimit?: number
): Promise<UserProfile[]> {
  try {
    let q;
    
    if (status && status !== 'all') {
      q = query(
        collection(db, 'users'),
        where('verificationStatus', '==', status),
        orderBy('registrationDate', 'desc'),
        ...(userLimit ? [limit(userLimit)] : [])
      );
    } else {
      q = query(
        collection(db, 'users'),
        orderBy('registrationDate', 'desc'),
        ...(userLimit ? [limit(userLimit)] : [])
      );
    }

    const snapshot = await getDocs(q);
    const users: UserProfile[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as UserProfile;
      users.push(data);
    });

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

/**
 * Bulk approve multiple users
 */
export async function bulkApproveUsers(
  userIds: string[], 
  adminId: string,
  adminName: string
): Promise<AdminResponse> {
  try {
    const updatePromises = userIds.map(userId => {
      const userRef = doc(db, 'users', userId);
      return updateDoc(userRef, {
        isVerified: true,
        verificationStatus: 'approved',
        approvedBy: adminId,
        approverName: adminName,
        approvalDate: serverTimestamp()
      });
    });

    await Promise.all(updatePromises);

    return { success: true };
  } catch (error) {
    console.error('Error bulk approving users:', error);
    return { 
      success: false, 
      error: 'Failed to bulk approve users. Please try again.' 
    };
  }
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats() {
  try {
    const [pendingUsersQuery, allUsersQuery] = await Promise.all([
      getDocs(query(
        collection(db, 'users'),
        where('verificationStatus', '==', 'pending')
      )),
      getDocs(collection(db, 'users'))
    ]);

    return {
      pendingUsers: pendingUsersQuery.size,
      totalUsers: allUsersQuery.size,
      approvedUsers: allUsersQuery.docs.filter(doc => 
        doc.data().verificationStatus === 'approved'
      ).length,
      rejectedUsers: allUsersQuery.docs.filter(doc => 
        doc.data().verificationStatus === 'rejected'
      ).length
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      pendingUsers: 0,
      totalUsers: 0,
      approvedUsers: 0,
      rejectedUsers: 0
    };
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user has admin permissions
 */
export function hasAdminPermissions(user: User | null): boolean {
  return isAdmin(user) && user?.isVerified === true;
}

/**
 * Create the first admin user (for system setup)
 */
export async function createFirstAdmin(
  userId: string,
  userData: Partial<UserProfile>
): Promise<AdminResponse> {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      ...userData,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'approved',
      approvedBy: 'system',
      approverName: 'System Setup',
      approvalDate: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating first admin:', error);
    return { 
      success: false, 
      error: 'Failed to create admin user. Please try again.' 
    };
  }
}