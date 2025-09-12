/**
 * User data types for EduBridge+ authentication and user management
 */

import { Timestamp } from 'firebase/firestore';

// User role definitions
export type UserRole = 'student' | 'lecturer' | 'admin';

// Registration form data
export interface RegistrationFormData {
  // Identity & Authentication
  matricId: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  
  // Terms acceptance
  acceptTerms: boolean;
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// User profile (stored in Firestore)
export interface UserProfile {
  // Firebase Auth ID
  uid: string;
  
  // Basic Information
  matricId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  
  // Auto-extracted from Matric ID
  politeknik: string;        // "Politeknik Nilai"
  program: string;           // "DBS", "DAC", "DEC"
  programName: string;       // "Diploma in Business Studies"
  entryYear: string;         // "2023"
  session: string;           // "F1", "F2"
  sessionName: string;       // "Session 1", "Session 2"
  studentNumber: string;     // "001"
  
  // System Fields
  role: UserRole;
  registrationDate: Timestamp;
  lastLogin: Timestamp | null;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approverName?: string;
  approvalDate?: Timestamp;
  rejectionReason?: string;
  
  // Optional Profile Data
  profile: {
    nickname?: string;
    avatar?: string;
    bio?: string;
    interests?: string[];
    displayName?: string;     // Auto-generated: "Ahmad (DBS 2023)"
  };
  
  // Lecturer-specific fields (only for lecturers)
  teachingSubjects?: string[];    // Subject codes lecturer teaches
  programmes?: string[];          // Programmes lecturer can teach
  department?: string;            // Department lecturer belongs to
  
  // Settings
  preferences: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    emailUpdates?: boolean;
  };
}

// Simplified user data for UI components
export interface User {
  uid: string;
  matricId: string;
  email: string;
  fullName: string;
  role: UserRole;
  program: string;
  programName: string;
  entryYear: string;
  avatar?: string;
  displayName?: string;
  isVerified?: boolean;
  
  // Lecturer-specific fields
  teachingSubjects?: string[];    // Subject codes lecturer teaches ["DPP20023", "DBS2024"]
  programmes?: string[];          // Programmes lecturer can teach ["DBS", "DRM"] 
  department?: string;            // "Commerce"
}

// Auth context state
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Registration process states
export type RegistrationStatus = 
  | 'idle'
  | 'validating'
  | 'registering'
  | 'success'
  | 'error';

// Login process states  
export type LoginStatus = 
  | 'idle'
  | 'logging-in'
  | 'success'
  | 'error';

// Form validation states
export interface ValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Firebase errors mapping
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

// Common auth error codes
export const AUTH_ERROR_CODES = {
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  WEAK_PASSWORD: 'auth/weak-password',
  INVALID_EMAIL: 'auth/invalid-email',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  NETWORK_REQUEST_FAILED: 'auth/network-request-failed'
} as const;

// User creation data for Firestore
export interface CreateUserData {
  uid: string;
  matricId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  politeknik: string;
  program: string;
  programName: string;
  entryYear: string;
  session: string;
  sessionName: string;
  studentNumber: string;
  role: UserRole;
  registrationDate: Timestamp;
  lastLogin: null;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approverName?: string;
  approvalDate?: Timestamp;
  rejectionReason?: string;
  profile: {
    nickname: null;
    avatar: null;
    bio: null;
    interests: string[];
    displayName: string;
  };
  preferences: {
    theme: 'system';
    notifications: true;
    emailUpdates: true;
  };
}

// Helper type for form field names
export type RegistrationField = keyof RegistrationFormData;
export type LoginField = keyof LoginFormData;

// API response types
export interface RegistrationResponse {
  success: boolean;
  user?: User;
  error?: AuthError;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: AuthError;
}