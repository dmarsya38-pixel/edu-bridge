import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTaskSnapshot 
} from 'firebase/storage';
import { getStorageInstance } from './firebase';
import { COMMENT_ALLOWED_FILE_TYPES, COMMENT_MAX_FILE_SIZE, MAX_FILE_SIZE } from '@/types/academic';

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
 * Validate file before upload using system settings
 */
export async function validateFile(file: File, type: 'material' | 'comment' = 'material'): Promise<FileValidationResult> {
  if (!file) {
    return {
      isValid: false,
      error: {
        code: 'no-file',
        message: 'No file selected'
      }
    };
  }

  try {
    // Import system settings dynamically to avoid circular dependencies
    const { getFileUploadSettings, getCommentFileSettings } = await import('./academic');

    let settings: { maxFileSize: number; allowedFileTypes: string[]; maxFileNameLength?: number };

    if (type === 'comment') {
      const commentSettings = await getCommentFileSettings();
      settings = {
        maxFileSize: commentSettings.maxFileSize,
        allowedFileTypes: commentSettings.allowedFileTypes,
        maxFileNameLength: 100 // Default for comments
      };
    } else {
      settings = await getFileUploadSettings();
    }

    // Check file type
    if (!settings.allowedFileTypes.includes(file.type)) {
      const fileExtensions = settings.allowedFileTypes.map(mime => {
        const ext = mime.split('/').pop()?.toUpperCase();
        if (mime.includes('pdf')) return 'PDF';
        if (mime.includes('word')) return 'DOC/DOCX';
        if (mime.includes('powerpoint')) return 'PPT/PPTX';
        if (mime.includes('jpeg')) return 'JPEG';
        if (mime.includes('png')) return 'PNG';
        return ext || mime;
      }).join(', ');

      return {
        isValid: false,
        error: {
          code: 'invalid-type',
          message: `File type not allowed. Only ${fileExtensions} files are supported.`
        }
      };
    }

    // Check file size
    if (file.size > settings.maxFileSize) {
      const maxSizeMB = settings.maxFileSize / (1024 * 1024);
      const currentSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        isValid: false,
        error: {
          code: 'file-too-large',
          message: `File size must be less than ${maxSizeMB}MB. Current size: ${currentSizeMB}MB`
        }
      };
    }

    // Check filename
    const maxFileNameLength = settings.maxFileNameLength || 100;
    if (file.name.length > maxFileNameLength) {
      return {
        isValid: false,
        error: {
          code: 'invalid-name',
          message: `File name is too long (maximum ${maxFileNameLength} characters)`
        }
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating file with system settings:', error);

    // Fallback to hardcoded defaults if system settings fail
    const defaultAllowedTypes: string[] = type === 'comment'
      ? [...COMMENT_ALLOWED_FILE_TYPES]
      : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

    const defaultMaxSize = type === 'comment' ? COMMENT_MAX_FILE_SIZE : MAX_FILE_SIZE;

    // Check file type
    if (!defaultAllowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: {
          code: 'invalid-type',
          message: 'File type not allowed. Please contact administrator for current file type restrictions.'
        }
      };
    }

    // Check file size
    if (file.size > defaultMaxSize) {
      const maxSizeMB = defaultMaxSize / (1024 * 1024);
      return {
        isValid: false,
        error: {
          code: 'file-too-large',
          message: `File size must be less than ${maxSizeMB}MB.`
        }
      };
    }

    return { isValid: true };
  }
}

/**
 * Synchronous validateFile for backward compatibility (uses default settings)
 */
export function validateFileSync(file: File, type: 'material' | 'comment' = 'material'): FileValidationResult {
  if (!file) {
    return {
      isValid: false,
      error: {
        code: 'no-file',
        message: 'No file selected'
      }
    };
  }

  // Use hardcoded defaults for synchronous validation
  const defaultAllowedTypes: string[] = type === 'comment'
    ? [...COMMENT_ALLOWED_FILE_TYPES]
    : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

  const defaultMaxSize = type === 'comment' ? COMMENT_MAX_FILE_SIZE : MAX_FILE_SIZE;

  // Check file type
  if (!defaultAllowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: {
        code: 'invalid-type',
        message: type === 'comment'
          ? 'File type not allowed. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are supported.'
          : 'File type not allowed. Only PDF, DOC, DOCX, PPT, and PPTX files are supported.'
      }
    };
  }

  // Check file size
  if (file.size > defaultMaxSize) {
    const maxSizeMB = defaultMaxSize / (1024 * 1024);
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
  onProgress?: (progress: FileUploadProgress) => void,
  fileType: 'material' | 'comment' = 'material'
): Promise<FileUploadResult> {
  return new Promise(async (resolve, reject) => {
    // Debug: Check authentication
    import('./firebase').then(({ getAuthInstance }) => {
      console.log('🔐 Upload attempt - User authenticated:', !!getAuthInstance().currentUser);
      console.log('🗂️ Upload path:', storagePath);
      console.log('📁 File details:', { name: file.name, type: file.type, size: file.size });
    });

    // Validate file first using async validation
    try {
      const validation = await validateFile(file, fileType);
      if (!validation.isValid) {
        reject(new Error(validation.error!.message));
        return;
      }
    } catch (validationError) {
      console.error('File validation failed during upload:', validationError);
      reject(new Error('File validation failed. Please try again.'));
      return;
    }

    const storageRef = ref(getStorageInstance(), storagePath);
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
    const storageRef = ref(getStorageInstance(), storagePath);
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

/**
 * Delete material file by extracting storage path from download URL
 */
export async function deleteMaterialFile(downloadURL: string): Promise<void> {
  try {
    const storagePath = extractStoragePathFromURL(downloadURL);
    if (!storagePath) {
      console.warn('⚠️ Could not extract storage path from URL:', downloadURL);
      return;
    }

    await deleteFile(storagePath);
    console.log('🗑️ Material file deleted:', storagePath);
  } catch (error) {
    console.error('Error deleting material file:', error);
    throw error;
  }
}

/**
 * Extract storage path from Firebase Storage download URL
 */
function extractStoragePathFromURL(downloadURL: string): string | null {
  try {
    // Firebase Storage download URLs follow this pattern:
    // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const url = new URL(downloadURL);
    const pathParts = url.pathname.split('/o/');

    if (pathParts.length < 2) {
      return null;
    }

    // Decode the path part (URL encoded)
    const encodedPath = pathParts[1].split('?')[0]; // Remove query parameters
    return decodeURIComponent(encodedPath);
  } catch {
    console.warn('Failed to extract storage path from URL:', downloadURL);
    return null;
  }
}