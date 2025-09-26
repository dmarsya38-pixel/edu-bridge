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
  uploaderName: string;
  uploaderRole: 'student' | 'lecturer';
  uploadDate: Timestamp;
  
  // Lecturer approval workflow
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;        // Lecturer ID who approved (changed from admin)
  approverName?: string;      // Lecturer name for display
  approverRole?: 'lecturer';  // Track approver type
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
  approvalStatus?: 'approved' | 'pending' | 'rejected';
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
  { id: 'DBS', name: 'Diploma in Business Studies' },
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

// Comment System Types
export interface CommentAttachment {
  fileName: string;
  fileSize: number;           // in bytes
  fileType: string;           // "application/pdf", "image/jpeg", etc.
  downloadURL: string;        // Firebase Storage URL
}

export interface Comment {
  commentId: string;
  materialId: string;
  content: string;
  attachments?: CommentAttachment[];
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'lecturer';
  createdAt: Timestamp;
}

export interface CommentCreateData {
  materialId: string;
  content: string;
  files?: File[];
}

export const COMMENT_ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
] as const;

export const COMMENT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
export const COMMENT_MAX_FILES = 3; // Max 3 files per comment

// Comment Notification System Types
export interface CommentNotification {
  notificationId: string;
  userId: string;           // Material owner who receives notification
  materialId: string;
  materialTitle: string;
  commenterId: string;      // User who commented
  commenterName: string;
  commentContent: string;   // Preview of comment (first 100 chars)
  commentId: string;
  createdAt: Timestamp;
  isRead: boolean;
  subjectCode: string;      // For navigation back to the material
  programmeId: string;      // For navigation
}

export interface NotificationCreateData {
  userId: string;
  materialId: string;
  materialTitle: string;
  commenterId: string;
  commenterName: string;
  commentContent: string;
  commentId: string;
  subjectCode: string;
  programmeId: string;
}

// Search Feature Types
export interface SearchResult {
  id: string;
  type: 'material' | 'comment';
  title: string;
  description?: string;
  snippet?: string;
  relevanceScore: number;
  programmeId?: string;
  subjectCode?: string;
  materialId?: string;
  commentId?: string;
  authorName?: string;
  createdAt?: Timestamp;
  materialType?: 'note' | 'exam_paper' | 'answer_scheme';
  fileSize?: number;
  fileType?: string;
  downloadURL?: string;
}

export interface HighlightedFields {
  title?: string;
  description?: string;
  content?: string;
  authorName?: string;
}

export interface SubjectSearchResult {
  id: string;
  type: 'subject';
  subjectCode: string;
  subjectName: string;
  programmeId: string;
  semester: number;
  materialCount: number;
  description?: string;
  highlightedFields?: {
    subjectName?: string;
    subjectCode?: string;
  };
}

export interface SearchResults {
  materials: SearchResult[];
  comments: SearchResult[];
  subjects: SubjectSearchResult[];
  totalMaterials: number;
  totalComments: number;
  totalSubjects: number;
  searchQuery: string;
  filters: SearchFilters;
  hasMore: boolean;
}

export interface SearchFilters {
  programmeId?: string;
  subjectCode?: string;
  materialType?: 'note' | 'exam_paper' | 'answer_scheme';
  semester?: number;
  uploaderId?: string;
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'material' | 'subject' | 'programme' | 'uploader';
  count?: number;
  programmeId?: string;
  subjectCode?: string;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: Timestamp;
  resultsCount: number;
  filters?: SearchFilters;
}

export type SearchSortBy = 'relevance' | 'date' | 'title' | 'downloads';
export type SearchSortOrder = 'asc' | 'desc';

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
  limit?: number;
  offset?: number;
}

export interface SearchAllOptions {
  filters?: SearchFilters;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
  limit?: number;
  offset?: number;
}

// Extended Material interface for search highlighting
export interface MaterialWithHighlight extends Material {
  relevanceScore?: number;
  highlightedFields?: {
    title?: string;
    description?: string;
    subjectName?: string;
    uploaderName?: string;
  };
}

// Extended Comment interface for search highlighting
export interface CommentWithHighlight extends Comment {
  highlightedFields?: {
    content?: string;
    authorName?: string;
  };
  materialTitle?: string;
  subjectCode?: string;
  programmeId?: string;
}