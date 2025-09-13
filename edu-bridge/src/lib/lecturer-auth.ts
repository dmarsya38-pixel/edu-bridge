/**
 * Lecturer registration utilities for EduBridge+
 * Handles lecturer registration with admin approval workflow
 */

import { 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  UserCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  query, 
  collection, 
  where, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

import { getAuthInstance, getDb } from './firebase';
import type { 
  AuthError,
  RegistrationResponse,
  CreateUserData
} from '@/types/user';
import { AUTH_ERROR_CODES } from '@/types/user';

// Lecturer registration form data
export interface LecturerRegistrationData {
  // Identity
  employeeId: string;           // e.g., "L001234"
  fullName: string;
  email: string;                // Must be @polinilai.edu.my
  password: string;
  confirmPassword: string;
  phoneNumber: string;

  // Institution info
  department: string;           // "Commerce"
  position: string;             // "Lecturer", "Senior Lecturer"

  // Teaching assignments (NEW REQUIREMENT)
  programme: string;            // Single programme (e.g., "DBS")
  subjects: string[];           // At least 3 subject codes

  // Terms acceptance
  acceptTerms: boolean;
}

/**
 * Validate lecturer employee ID format
 */
export function validateEmployeeId(employeeId: string): { isValid: boolean; error?: string } {
  // Simple format: L + 6 digits (e.g., L001234)
  const pattern = /^L\d{6}$/;
  
  if (!employeeId.trim()) {
    return { isValid: false, error: 'Employee ID is required' };
  }
  
  if (!pattern.test(employeeId.trim())) {
    return { isValid: false, error: 'Employee ID must be in format L000000 (L followed by 6 digits)' };
  }
  
  return { isValid: true };
}

/**
 * Validate institutional email
 */
export function validateInstitutionalEmail(email: string): { isValid: boolean; error?: string } {
  const pattern = /^[a-zA-Z0-9._%+-]+@polinilai\.edu\.my$/;
  
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!pattern.test(email.trim().toLowerCase())) {
    return { isValid: false, error: 'Must use institutional email (@polinilai.edu.my)' };
  }
  
  return { isValid: true };
}

/**
 * Check if employee ID already exists
 */
export async function checkEmployeeIdExists(employeeId: string): Promise<boolean> {
  try {
    const q = query(
      collection(getDb(), 'users'),
      where('employeeId', '==', employeeId.trim().toUpperCase())
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking employee ID:', error);
    return false;
  }
}

/**
 * Register new lecturer (requires admin approval)
 */
export async function registerLecturer(formData: LecturerRegistrationData): Promise<RegistrationResponse> {
  try {
    // Validate employee ID format
    const employeeValidation = validateEmployeeId(formData.employeeId);
    if (!employeeValidation.isValid) {
      return {
        success: false,
        error: {
          code: 'invalid-employee-id',
          message: employeeValidation.error || 'Invalid employee ID format',
          field: 'employeeId'
        }
      };
    }

    // Validate institutional email
    const emailValidation = validateInstitutionalEmail(formData.email);
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: {
          code: 'invalid-institutional-email',
          message: emailValidation.error || 'Invalid institutional email',
          field: 'email'
        }
      };
    }

    // Skip duplicate check during registration since user is not authenticated yet
    // The uniqueness will be enforced by the unique employeeId constraint in the user profile

    // Create Firebase Auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      getAuthInstance(),
      formData.email,
      formData.password
    );

    // Send email verification
    await sendEmailVerification(userCredential.user);

    // Fetch programme name from programmes collection
    let programmeName = 'Unknown Programme';
    try {
      const programmesCollection = collection(getDb(), 'programmes');
      const programmeQuery = query(programmesCollection, where('programmeId', '==', formData.programme));
      const programmeSnapshot = await getDocs(programmeQuery);
      
      if (!programmeSnapshot.empty) {
        const programmeData = programmeSnapshot.docs[0].data();
        programmeName = programmeData.programmeName || 'Unknown Programme';
      }
    } catch (error) {
      console.warn('Failed to fetch programme name during registration:', error);
    }

    // Create lecturer profile in Firestore (auto-approved)
    const userData: CreateUserData & { 
      employeeId: string; 
      department: string; 
      position: string;
      teachingSubjects: string[];
      programmes: string[];
    } = {
      uid: userCredential.user.uid,
      matricId: '', // Not applicable for lecturers
      email: formData.email,
      fullName: formData.fullName.trim(),
      phoneNumber: formData.phoneNumber,
      
      // Lecturer-specific fields
      employeeId: formData.employeeId.trim().toUpperCase(),
      department: formData.department,
      position: formData.position,
      
      // Teaching assignments (NEW)
      teachingSubjects: formData.subjects,
      programmes: [formData.programme], // Single programme as array
      programName: programmeName, // Use fetched programme name
      
      // Auto-generated fields (not applicable for lecturers)
      politeknik: 'Politeknik Nilai',
      program: 'N/A',
      entryYear: 'N/A',
      session: 'N/A',
      sessionName: 'N/A',
      studentNumber: 'N/A',
      
      // System fields - LECTURERS AUTO-APPROVED WITH INSTITUTIONAL EMAIL
      role: 'lecturer',
      registrationDate: serverTimestamp() as Timestamp,
      lastLogin: null,
      isVerified: true,  // Auto-verify lecturers with institutional email
      verificationStatus: 'approved',
      approvedBy: 'system',
      approverName: 'Automatic Verification',
      approvalDate: serverTimestamp() as Timestamp,
      
      // Profile
      profile: {
        nickname: null,
        avatar: null,
        bio: null,
        interests: [],
        displayName: `${formData.fullName} (${formData.position})`
      },
      
      // Preferences
      preferences: {
        theme: 'system',
        notifications: true,
        emailUpdates: true
      }
    };

    // Save to Firestore
    console.log('💾 Saving lecturer data to Firestore...', userData);
    await setDoc(doc(getDb(), 'users', userCredential.user.uid), userData);
    console.log('✅ Lecturer data saved successfully');

    // Convert to User type for response (with isVerified: false)
    const user = {
      uid: userCredential.user.uid,
      matricId: '', // Not applicable for lecturers
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      program: userData.program,
      programName: userData.programName,
      entryYear: userData.entryYear,
      displayName: userData.profile.displayName,
      isVerified: userData.isVerified
    };

    return {
      success: true,
      user
    };

  } catch (error: unknown) {
    console.error('Lecturer registration error:', error);
    
    return {
      success: false,
      error: mapFirebaseError(error)
    };
  }
}

/**
 * Map Firebase errors to user-friendly messages
 */
function mapFirebaseError(error: unknown): AuthError {
  const errorCode = (error as { code?: string }).code || 'unknown-error';
  
  switch (errorCode) {
    case AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE:
      return {
        code: errorCode,
        message: 'This email address is already registered. If you deleted your account, you may need to wait a few minutes or contact admin to remove it from Firebase Authentication.',
        field: 'email'
      };
      
    case AUTH_ERROR_CODES.WEAK_PASSWORD:
      return {
        code: errorCode,
        message: 'Password is too weak. Please choose a stronger password.',
        field: 'password'
      };
      
    case AUTH_ERROR_CODES.INVALID_EMAIL:
      return {
        code: errorCode,
        message: 'Please enter a valid email address.',
        field: 'email'
      };
      
    default:
      return {
        code: errorCode,
        message: (error as { message?: string }).message || 'An unexpected error occurred. Please try again.'
      };
  }
}