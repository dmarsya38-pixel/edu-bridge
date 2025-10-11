/**
 * Firebase Authentication utilities for EduBridge+
 * Handles user registration, login, and user management
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
  FieldValue
} from 'firebase/firestore';

import { getAuthInstance, getDb } from './firebase';
import { getUserProfileWithRetry, updateUserLastLogin } from './vercel-firestore';
import { validateMatricId, formatPhoneNumber, generateDisplayName } from './validation';
import type { 
  RegistrationFormData, 
  LoginFormData,
  UserProfile,
  CreateUserData,
  RegistrationResponse,
  LoginResponse,
  User,
  AuthError
} from '@/types/user';
import { AUTH_ERROR_CODES } from '@/types/user';

/**
 * Check if matric ID already exists in the system
 */
export async function checkMatricIdExists(matricId: string): Promise<boolean> {
  try {
    const q = query(
      collection(getDb(), 'users'),
      where('matricId', '==', matricId.trim().toUpperCase())
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking matric ID:', error);
    return false; // Allow registration to proceed if check fails
  }
}

/**
 * Register new user with email/password and create user profile
 */
export async function registerUser(formData: RegistrationFormData): Promise<RegistrationResponse> {
  try {
    // Validate matric ID format
    const matricValidation = validateMatricId(formData.matricId);
    if (!matricValidation.isValid) {
      return {
        success: false,
        error: {
          code: 'invalid-matric-id',
          message: matricValidation.error || 'Invalid matric ID format',
          field: 'matricId'
        }
      };
    }

    // Check for duplicate matric ID
    const matricExists = await checkMatricIdExists(formData.matricId);
    if (matricExists) {
      return {
        success: false,
        error: {
          code: 'matric-id-exists',
          message: 'This matric ID is already registered. Please contact admin if this is an error.',
          field: 'matricId'
        }
      };
    }

    // Create Firebase Auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      getAuthInstance(),
      formData.email,
      formData.password
    );

    // Send email verification
    await sendEmailVerification(userCredential.user);

    // Create user profile in Firestore
    const userData: CreateUserData = {
      uid: userCredential.user.uid,
      matricId: formData.matricId.trim().toUpperCase(),
      email: formData.email,
      fullName: formData.fullName.trim(),
      phoneNumber: formatPhoneNumber(formData.phoneNumber),
      
      // Auto-extracted from matric ID
      politeknik: matricValidation.politeknik,
      program: matricValidation.program,
      programName: matricValidation.programName,
      entryYear: matricValidation.entryYear,
      session: matricValidation.session,
      sessionName: matricValidation.sessionName,
      studentNumber: matricValidation.studentNumber,
      
      // System fields
      role: 'student',
      registrationDate: serverTimestamp() as Timestamp,
      lastLogin: null,
      isVerified: true,  // Auto-verify students with valid matric ID
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
        displayName: generateDisplayName(formData.fullName, matricValidation.program, matricValidation.entryYear)
      },
      
      // Preferences
      preferences: {
        theme: 'system',
        notifications: true,
        emailUpdates: true
      }
    };

    // Save to Firestore
    await setDoc(doc(getDb(), 'users', userCredential.user.uid), userData);

    // Convert to User type for response
    const user: User = {
      uid: userCredential.user.uid,
      matricId: userData.matricId,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      program: userData.program,
      programName: userData.programName,
      entryYear: userData.entryYear,
      displayName: userData.profile?.displayName,
      isVerified: userData.isVerified
    };

    return {
      success: true,
      user
    };

  } catch (error: unknown) {
    console.error('Registration error:', error);
    
    return {
      success: false,
      error: mapFirebaseError(error)
    };
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(formData: LoginFormData): Promise<LoginResponse> {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      getAuthInstance(),
      formData.email,
      formData.password
    );

    // Get user profile using Vercel-optimized Firestore utilities
    const userProfileResult = await getUserProfileWithRetry(userCredential.user.uid);
    
    if (!userProfileResult.success) {
      return {
        success: false,
        error: userProfileResult.error
      };
    }

    const userData = userProfileResult.user as UserProfile;

    // Update last login using Vercel-optimized utilities
    await updateUserLastLogin(userCredential.user.uid);

    // Convert to User type for response - include lecturer fields
    const user: User = {
      uid: userData.uid,
      matricId: userData.matricId,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      program: userData.program,
      programName: userData.programName,
      entryYear: userData.entryYear,
      avatar: userData.profile?.avatar,
      displayName: userData.profile?.displayName,
      isVerified: userData.isVerified,

      // Include lecturer-specific fields
      ...(userData.teachingSubjects && { teachingSubjects: userData.teachingSubjects }),
      ...(userData.programmes && { programmes: userData.programmes }),
      ...(userData.department && { department: userData.department })
    };

    return {
      success: true,
      user
    };

  } catch (error: unknown) {
    console.error('Login error:', error);
    
    return {
      success: false,
      error: mapFirebaseError(error)
    };
  }
}

/**
 * Logout current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(getAuthInstance());
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  try {
    // Get user profile using Vercel-optimized utilities
    const userProfileResult = await getUserProfileWithRetry(uid);
    
    if (!userProfileResult.success || !userProfileResult.user) {
      return null;
    }

    const userData = userProfileResult.user as UserProfile;
    
    return {
      uid: userData.uid,
      matricId: userData.matricId,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      program: userData.program,
      programName: userData.programName,
      entryYear: userData.entryYear,
      avatar: userData.profile?.avatar,
      displayName: userData.profile?.displayName,
      isVerified: userData.isVerified,

      // Include profile fields if they exist
      profile: {
        ...(userData.profile?.nickname && { nickname: userData.profile.nickname }),
        ...(userData.profile?.bio && { bio: userData.profile.bio }),
        ...(userData.profile?.interests && { interests: userData.profile.interests }),
        ...(userData.profile?.displayName && { displayName: userData.profile.displayName }),
        ...(userData.profile?.avatar && { avatar: userData.profile.avatar })
      },

      // Include preferences if they exist
      preferences: {
        ...(userData.preferences?.theme && { theme: userData.preferences.theme }),
        ...(userData.preferences?.notifications !== undefined && { notifications: userData.preferences.notifications }),
        ...(userData.preferences?.emailUpdates !== undefined && { emailUpdates: userData.preferences.emailUpdates })
      },

      // Include lecturer-specific fields if they exist
      ...(userData.teachingSubjects && { teachingSubjects: userData.teachingSubjects }),
      ...(userData.programmes && { programmes: userData.programmes }),
      ...(userData.department && { department: userData.department }),
      ...(userData.employeeId && { employeeId: userData.employeeId })
    };

  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
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
      
    case AUTH_ERROR_CODES.USER_NOT_FOUND:
      return {
        code: errorCode,
        message: 'No account found with this email address.',
        field: 'email'
      };
      
    case AUTH_ERROR_CODES.WRONG_PASSWORD:
      return {
        code: errorCode,
        message: 'Incorrect password. Please try again.',
        field: 'password'
      };
      
    case AUTH_ERROR_CODES.TOO_MANY_REQUESTS:
      return {
        code: errorCode,
        message: 'Too many failed attempts. Please try again later.'
      };
      
    case AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED:
      return {
        code: errorCode,
        message: 'Network error. Please check your internet connection and try again.'
      };
      
    case 'firestore/failed-precondition':
    case 'firestore/unavailable':
    case 'firestore/deadline-exceeded':
      return {
        code: 'firestore-connection-error',
        message: 'Unable to connect to the database. Please try again in a few moments.'
      };
      
    default:
      return {
        code: errorCode,
        message: (error as { message?: string }).message || 'An unexpected error occurred. Please try again.'
      };
  }
}

/**
 * Check if current user is authenticated
 */
export function getCurrentUser(): FirebaseUser | null {
  return getAuthInstance().currentUser;
}

/**
 * Wait for auth state to be ready
 */
export function waitForAuthReady(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = getAuthInstance().onAuthStateChanged((user: FirebaseUser | null) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Update user profile and preferences
 * Uses updateDoc to safely update only specified fields without overwriting existing data
 */
export async function updateUserProfile(
  uid: string,
  updates: {
    profile?: {
      nickname?: string;
      bio?: string;
      interests?: string[];
    };
    preferences?: {
      theme?: 'light' | 'dark' | 'system';
      notifications?: boolean;
      emailUpdates?: boolean;
    };
  }
): Promise<boolean> {
  try {
    const userDocRef = doc(getDb(), 'users', uid);

    // Build update payload dynamically - only include provided fields
    const updatePayload: Record<string, unknown> = {
      lastLogin: serverTimestamp() // Update last login timestamp
    };

    // Add profile updates if provided
    if (updates.profile) {
      const profile = updates.profile;
      Object.keys(profile).forEach(key => {
        const profileKey = key as keyof typeof profile;
        if (profile[profileKey] !== undefined) {
          updatePayload[`profile.${profileKey}`] = profile[profileKey];
        }
      });
    }

    // Add preference updates if provided
    if (updates.preferences) {
      const preferences = updates.preferences;
      Object.keys(preferences).forEach(key => {
        const prefKey = key as keyof typeof preferences;
        if (preferences[prefKey] !== undefined) {
          updatePayload[`preferences.${prefKey}`] = preferences[prefKey];
        }
      });
    }

    // Use updateDoc to only update the specified fields
    // This preserves all existing user data
    await updateDoc(userDocRef, updatePayload);

    console.log('User profile updated successfully for:', uid, updatePayload);
    return true;

  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Update lecturer profile (programmes and teaching subjects only)
 * Uses updateDoc to safely update only specified fields without overwriting existing data
 */
export async function updateLecturerProfile(
  uid: string,
  updates: {
    programmes: string[];
    teachingSubjects?: string[]; // Make optional to prevent accidental overwrites
  }
): Promise<boolean> {
  try {
    const userDocRef = doc(getDb(), 'users', uid);

    // Fetch programme name for the new programme
    let programmeName = 'Unknown Programme';
    if (updates.programmes.length > 0) {
      try {
        const programmeDoc = await getDoc(doc(getDb(), 'programmes', updates.programmes[0]));
        if (programmeDoc.exists()) {
          const programmeData = programmeDoc.data();
          programmeName = programmeData.programmeName || 'Unknown Programme';
        }
      } catch (error) {
        console.warn('Failed to fetch programme name during profile update:', error);
      }
    }

    // Build update payload dynamically - only include teachingSubjects if provided
    const updatePayload: {
      programmes: string[];
      programmeName: string;
      programName: string;
      lastLogin: FieldValue;
      teachingSubjects?: string[];
    } = {
      programmes: updates.programmes,
      programmeName: programmeName, // Update programmeName as well
      programName: programmeName, // Update programName to match programmeName from programmes collection
      lastLogin: serverTimestamp() // Update last login timestamp
    };

    // Only include teachingSubjects if explicitly provided (prevents accidental overwrites)
    if (updates.teachingSubjects !== undefined) {
      updatePayload.teachingSubjects = updates.teachingSubjects;
    }

    // Use updateDoc to only update the specified fields
    // This preserves all existing user data (name, email, profile, etc.)
    await updateDoc(userDocRef, updatePayload);

    console.log('Lecturer profile updated successfully for:', uid, { programmeName });
    return true;

  } catch (error) {
    console.error('Error updating lecturer profile:', error);
    throw error;
  }
}