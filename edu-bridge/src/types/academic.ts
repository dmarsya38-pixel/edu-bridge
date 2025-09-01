import { Timestamp } from 'firebase/firestore';

export interface Programme {
  programmeId: string;        // "DBS", "DRM", "DIB", "DIF", "DLS"
  programmeCode: string;      // "DBS"
  programmeName: string;      // "Diploma in Business Information System"
  department: string;         // "Commerce"
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Subject {
  subjectId: string;          // "DPP20023"
  subjectCode: string;        // "DPP20023"
  subjectName: string;        // "INTERNATIONAL BUSINESS"
  programmeId: string;        // "DBS"
  semester: number;           // 1, 2, 3, 4, 5
  creditHours: number;        // 3
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Material {
  materialId: string;
  title: string;
  description?: string;
  materialType: 'note' | 'exam_paper' | 'answer_scheme';
  
  // Single file only
  fileName: string;
  fileSize: number;           // in bytes
  fileType: string;           // "application/pdf", "image/jpeg", etc.
  downloadURL: string;        // Firebase Storage URL
  
  // Organization
  programmeId: string;        // "DBS", "DRM", "DIB", "DIF", "DLS"
  semester: number;           // 1-5
  subjectCode: string;        // e.g., "DPP20023"
  subjectName: string;        // e.g., "INTERNATIONAL BUSINESS"
  
  // Upload info
  uploaderId: string;
  uploaderRole: 'student' | 'lecturer';
  uploadDate: Timestamp;
  
  // Simple approval workflow
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;        // Admin who approved
  approvedDate?: Timestamp;
  rejectionReason?: string;
  
  // Engagement
  downloadCount: number;
  views: number;
  lastAccessed?: Timestamp;
}

export interface MaterialFilter {
  programmeId?: string;
  semester?: number;
  subjectCode?: string;
  materialType?: 'note' | 'exam_paper' | 'answer_scheme';
  approvalStatus?: 'approved' | 'pending';
  uploaderId?: string;
  searchQuery?: string;
}

export interface MaterialUploadData {
  title: string;
  description?: string;
  materialType: 'note' | 'exam_paper' | 'answer_scheme';
  programmeId: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  file: File;
}

export interface MaterialMetadata {
  title: string;
  description?: string;
  materialType: 'note' | 'exam_paper' | 'answer_scheme';
  programmeId: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
}

export type MaterialType = 'note' | 'exam_paper' | 'answer_scheme';

export const MATERIAL_TYPES: { [key in MaterialType]: string } = {
  note: 'Notes',
  exam_paper: 'Exam Papers',
  answer_scheme: 'Answer Schemes'
};

export const PROGRAMMES = [
  { id: 'DBS', name: 'Diploma in Business Information System' },
  { id: 'DRM', name: 'Diploma in Retail Management' },
  { id: 'DIB', name: 'Diploma in Islamic Banking' },
  { id: 'DIF', name: 'Diploma in Islamic Finance' },
  { id: 'DLS', name: 'Diploma in Logistics Supply Chain' }
] as const;

export const SEMESTERS = [1, 2, 3, 4, 5] as const;

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB