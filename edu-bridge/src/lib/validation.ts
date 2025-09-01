/**
 * Matric ID validation utilities for EduBridge+ 
 * Supports Politeknik Nilai Commerce Department format: 23DBS23F1001
 */

export interface MatricValidation {
  isValid: boolean;
  politeknik: string;
  program: string;
  programName: string;
  entryYear: string;
  session: string;
  sessionName: string;
  studentNumber: string;
  error?: string;
}

// Commerce Department program mappings
const COMMERCE_PROGRAMS = {
  DBS: 'Diploma in Business Studies',
  DAC: 'Diploma in Accountancy',
  DEC: 'Diploma in E-Commerce'
} as const;

type CommerceProgram = keyof typeof COMMERCE_PROGRAMS;

/**
 * Validates Politeknik Nilai matric ID format and extracts information
 * @param matricId - Student matric ID (e.g., "23DBS23F1001")
 * @returns MatricValidation object with validation result and extracted data
 */
export function validateMatricId(matricId: string): MatricValidation {
  // Clean input
  const cleanId = matricId.trim().toUpperCase();
  
  // Basic format validation: 23DBS23F1001
  const pattern = /^(23)([A-Z]{3})(\d{2})([F][12])(\d{3})$/;
  const match = cleanId.match(pattern);
  
  if (!match) {
    return {
      isValid: false,
      politeknik: '',
      program: '',
      programName: '',
      entryYear: '',
      session: '',
      sessionName: '',
      studentNumber: '',
      error: 'Invalid matric ID format. Example: 23DBS23F1001'
    };
  }
  
  const [, politeknik, program, year, session, number] = match;
  
  // Validate politeknik code (must be 23 for Politeknik Nilai)
  if (politeknik !== '23') {
    return {
      isValid: false,
      politeknik: '',
      program: '',
      programName: '',
      entryYear: '',
      session: '',
      sessionName: '',
      studentNumber: '',
      error: 'Only Politeknik Nilai students (ID starting with 23) can register'
    };
  }
  
  // Validate program is Commerce Department
  if (!(program in COMMERCE_PROGRAMS)) {
    return {
      isValid: false,
      politeknik: 'Politeknik Nilai',
      program,
      programName: '',
      entryYear: `20${year}`,
      session,
      sessionName: session === 'F1' ? 'Session 1' : 'Session 2',
      studentNumber: number,
      error: `Program ${program} is not supported. Only Commerce Department programs allowed: ${Object.keys(COMMERCE_PROGRAMS).join(', ')}`
    };
  }
  
  // All validations passed
  return {
    isValid: true,
    politeknik: 'Politeknik Nilai',
    program,
    programName: COMMERCE_PROGRAMS[program as CommerceProgram],
    entryYear: `20${year}`,
    session,
    sessionName: session === 'F1' ? 'Session 1' : 'Session 2',
    studentNumber: number
  };
}

/**
 * Additional validation utilities
 */

export const validation = {
  email: (email: string): { isValid: boolean; error?: string } => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!emailPattern.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  },

  password: (password: string): { isValid: boolean; error?: string; strength?: string } => {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return { 
        isValid: false, 
        error: 'Password must contain uppercase, lowercase, and number',
        strength: 'weak' 
      };
    }
    
    return { isValid: true, strength: 'strong' };
  },

  phone: (phone: string): { isValid: boolean; error?: string } => {
    // Malaysian phone number format
    const phonePattern = /^(\+60|60)?[1-9][0-9]{8,9}$/;
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    if (!cleanPhone) {
      return { isValid: false, error: 'Phone number is required' };
    }
    if (!phonePattern.test(cleanPhone)) {
      return { isValid: false, error: 'Please enter a valid Malaysian phone number (+60xxxxxxxxx)' };
    }
    return { isValid: true };
  },

  fullName: (name: string): { isValid: boolean; error?: string } => {
    if (!name || name.trim().length < 2) {
      return { isValid: false, error: 'Full name must be at least 2 characters' };
    }
    if (name.trim().length > 100) {
      return { isValid: false, error: 'Full name must be less than 100 characters' };
    }
    // Basic name validation - letters, spaces, and common name characters
    const namePattern = /^[a-zA-Z\s.'`-]+$/;
    if (!namePattern.test(name.trim())) {
      return { isValid: false, error: 'Full name can only contain letters, spaces, and common name characters' };
    }
    return { isValid: true };
  }
};

/**
 * Format phone number to Malaysian standard
 */
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/[\s-]/g, '');
  
  // Add +60 prefix if not present
  if (cleanPhone.startsWith('0')) {
    return `+60${cleanPhone.substring(1)}`;
  }
  if (cleanPhone.startsWith('60')) {
    return `+${cleanPhone}`;
  }
  if (!cleanPhone.startsWith('+60')) {
    return `+60${cleanPhone}`;
  }
  
  return cleanPhone;
}

/**
 * Generate user display name from matric info
 */
export function generateDisplayName(fullName: string, program: string, entryYear: string): string {
  const firstName = fullName.split(' ')[0];
  return `${firstName} (${program} ${entryYear})`;
}