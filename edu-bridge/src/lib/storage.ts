import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTaskSnapshot 
} from 'firebase/storage';
import { storage } from './firebase';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/types/academic';

export interface FileUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface FileUploadResult {
  downloadURL: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
}

export interface FileValidationError {
  code: 'invalid-type' | 'file-too-large' | 'no-file' | 'invalid-name';
  message: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: FileValidationError;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): FileValidationResult {
  if (!file) {
    return {
      isValid: false,
      error: {
        code: 'no-file',
        message: 'No file selected'
      }
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error: {
        code: 'invalid-type',
        message: 'File type not allowed. Only PDF, DOC, DOCX, PPT, and PPTX files are supported.'
      }
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      isValid: false,
      error: {
        code: 'file-too-large',
        message: `File size must be less than ${maxSizeMB}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      }
    };
  }

  // Check filename
  if (file.name.length > 100) {
    return {
      isValid: false,
      error: {
        code: 'invalid-name',
        message: 'File name is too long (maximum 100 characters)'
      }
    };
  }

  return { isValid: true };
}

/**
 * Generate storage path for material file
 */
export function generateStoragePath(
  programmeId: string,
  semester: number,
  subjectCode: string,
  materialType: string,
  fileName: string
): string {
  // Clean filename - remove special characters and spaces
  const cleanFileName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_');
  
  const timestamp = Date.now();
  const fileNameWithTimestamp = `${timestamp}_${cleanFileName}`;
  
  return `materials/${programmeId}/${semester}/${subjectCode}/${materialType}/${fileNameWithTimestamp}`;
}

/**
 * Upload file to Firebase Storage with progress tracking
 */
export function uploadFile(
  file: File,
  storagePath: string,
  onProgress?: (progress: FileUploadProgress) => void
): Promise<FileUploadResult> {
  return new Promise((resolve, reject) => {
    // Debug: Check authentication
    import('./firebase').then(({ auth }) => {
      console.log('🔐 Upload attempt - User authenticated:', !!auth.currentUser);
      console.log('🗂️ Upload path:', storagePath);
      console.log('📁 File details:', { name: file.name, type: file.type, size: file.size });
    });

    // Validate file first
    const validation = validateFile(file);
    if (!validation.isValid) {
      reject(new Error(validation.error!.message));
      return;
    }

    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress) {
          const progress: FileUploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          };
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const result: FileUploadResult = {
            downloadURL,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            storagePath
          };
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

/**
 * Delete file from Firebase Storage
 */
export async function deleteFile(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Upload material file with automatic path generation
 */
export async function uploadMaterialFile(
  file: File,
  programmeId: string,
  semester: number,
  subjectCode: string,
  materialType: 'note' | 'exam_paper' | 'answer_scheme',
  onProgress?: (progress: FileUploadProgress) => void
): Promise<FileUploadResult> {
  const storagePath = generateStoragePath(
    programmeId,
    semester,
    subjectCode,
    materialType,
    file.name
  );

  return uploadFile(file, storagePath, onProgress);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type icon for display
 */
export function getFileTypeIcon(fileType: string): string {
  switch (fileType) {
    case 'application/pdf':
      return '📄';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '📝';
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return '📊';
    default:
      return '📋';
  }
}