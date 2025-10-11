import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
    addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from './firebase';
import { getDb } from './firebase';
import { sendCommentEmail, sendApprovalEmail, generateMaterialLink } from './email';
import type {
  Programme,
  Subject,
  Material,
  MaterialFilter,
  MaterialMetadata,
  Comment,
  CommentCreateData,
  CommentAttachment,
  CommentNotification,
  NotificationCreateData,
  ApprovalNotification,
  ApprovalNotificationCreateData,
  SearchResults,
  SearchResult,
  SearchFilters,
  SearchOptions,
  SearchAllOptions,
  CommentWithHighlight,
  MaterialWithHighlight,
  HighlightedFields,
  SubjectSearchResult,
  SystemSettings,
  SystemSettingsUpdate
} from '@/types/academic';
import { DEFAULT_SYSTEM_SETTINGS } from '@/types/academic';
import { createSafeTimestamp } from './timestamp-utils';
import type { User } from '@/types/user';

// Global cache for programmes (rarely change)
let programmesCache: Programme[] | null = null;
let programmesCacheTime = 0;

// Programme Management
export async function getProgrammes(): Promise<Programme[]> {
  const now = Date.now();
  
  // Use longer cache for programmes (15 minutes) since they rarely change
  if (programmesCache && (now - programmesCacheTime < 15 * 60 * 1000)) {
    console.log('💰 CACHE HIT: Using cached programmes');
    return programmesCache;
  }
  
  try {
    console.log('🔍 Firestore query: Loading programmes');
    if (!getDb()) {
      throw new Error('Firestore is not initialized');
    }
    const querySnapshot = await getDocs(
      query(collection(getDb(), 'programmes'), orderBy('programmeCode'))
    );
    
    const programmes = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      programmeId: doc.id
    })) as Programme[];
    
    // Cache programmes
    programmesCache = programmes;
    programmesCacheTime = now;
    
    console.log(`💾 CACHED: Stored ${programmes.length} programmes`);
    return programmes;
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return [];
  }
}

export async function getProgramme(programmeId: string): Promise<Programme | null> {
  try {
    const docSnap = await getDoc(doc(getDb(), 'programmes', programmeId));
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        programmeId: docSnap.id
      } as Programme;
    }
    return null;
  } catch (error) {
    console.error('Error fetching programme:', error);
    return null;
  }
}

export async function createProgramme(programme: Omit<Programme, 'programmeId' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(getDb(), 'programmes'), {
      ...programme,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating programme:', error);
    throw error;
  }
}

// Subject Management
export async function getSubjects(): Promise<Subject[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(getDb(), 'subjects'), orderBy('subjectCode'))
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      subjectId: doc.id
    })) as Subject[];
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

export async function getSubjectsByProgramme(programmeId: string): Promise<Subject[]> {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(getDb(), 'subjects'),
        where('programmeId', '==', programmeId),
        orderBy('semester'),
        orderBy('subjectCode')
      )
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      subjectId: doc.id
    })) as Subject[];
  } catch (error) {
    console.error('Error fetching subjects by programme:', error);
    return [];
  }
}

/**
 * Get subjects by multiple programmes (for lecturer profile management)
 * Returns subjects organized by programme and semester
 */
export async function getSubjectsByProgrammes(programmeIds: string[]): Promise<Map<string, Map<number, Subject[]>>> {
  if (programmeIds.length === 0) {
    return new Map();
  }

  const result = new Map<string, Map<number, Subject[]>>();

  try {
    console.log('🔍 Firestore query: Loading subjects for programmes', programmeIds);

    // Create queries for each programme (Firestore 'in' operator has limit of 10 items)
    const batchSize = 10;
    const allSubjects: Subject[] = [];

    for (let i = 0; i < programmeIds.length; i += batchSize) {
      const batch = programmeIds.slice(i, i + batchSize);

      const querySnapshot = await getDocs(
        query(
          collection(getDb(), 'subjects'),
          where('programmeId', 'in', batch),
          orderBy('programmeId'),
          orderBy('semester'),
          orderBy('subjectCode')
        )
      );

      const batchSubjects = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        subjectId: doc.id
      })) as Subject[];

      allSubjects.push(...batchSubjects);
    }

    // Organize subjects by programme and semester
    for (const subject of allSubjects) {
      if (!result.has(subject.programmeId)) {
        result.set(subject.programmeId, new Map());
      }

      const programmeSubjects = result.get(subject.programmeId)!;
      if (!programmeSubjects.has(subject.semester)) {
        programmeSubjects.set(subject.semester, []);
      }

      programmeSubjects.get(subject.semester)!.push(subject);
    }

    console.log(`✅ Loaded ${allSubjects.length} subjects across ${programmeIds.length} programmes`);
    return result;

  } catch (error) {
    console.error('Error fetching subjects by programmes:', error);
    return new Map();
  }
}

// In-memory cache for subjects (per session)
const subjectsCache = new Map<string, Subject[]>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

export async function getSubjectsBySemester(programmeId: string, semester: number): Promise<Subject[]> {
  const cacheKey = `${programmeId}_${semester}`;
  const now = Date.now();
  
  // Check if we have fresh cached data
  if (subjectsCache.has(cacheKey) && cacheTimestamps.has(cacheKey)) {
    const cacheTime = cacheTimestamps.get(cacheKey)!;
    if (now - cacheTime < CACHE_DURATION) {
      console.log(`💰 CACHE HIT: Using cached subjects for ${programmeId} semester ${semester}`);
      return subjectsCache.get(cacheKey)!;
    }
  }
  
  try {
    console.log(`🔍 Firestore query (CACHED): programme="${programmeId}", semester=${semester}`);
    
    // Use regular getDocs (with Firebase's built-in caching)
    const querySnapshot = await getDocs(
      query(
        collection(getDb(), 'subjects'),
        where('programmeId', '==', programmeId),
        where('semester', '==', semester),
        orderBy('subjectCode')
      )
    );
    
    const subjects = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      subjectId: doc.id
    })) as Subject[];
    
    // Cache the results
    subjectsCache.set(cacheKey, subjects);
    cacheTimestamps.set(cacheKey, now);
    
    console.log(`💾 CACHED: Stored ${subjects.length} subjects for ${cacheKey}`);
    return subjects;
  } catch (error) {
    console.error('Error fetching subjects by semester:', error);
    return [];
  }
}

export async function getSubjectByProgrammeAndCode(programmeId: string, subjectCode: string): Promise<Subject | null> {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(getDb(), 'subjects'),
        where('programmeId', '==', programmeId),
        where('subjectCode', '==', subjectCode)
      )
    );
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        ...doc.data(),
        subjectId: doc.id
      } as Subject;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching subject by programme and code:', error);
    return null;
  }
}

export async function createSubject(subject: Omit<Subject, 'subjectId' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(getDb(), 'subjects'), {
      ...subject,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating subject:', error);
    throw error;
  }
}

// Material Management
export async function getMaterials(filter?: MaterialFilter): Promise<Material[]> {
  try {
    let q = query(collection(getDb(), 'materials'));
    
    // Apply filters
    if (filter?.programmeId) {
      q = query(q, where('programmeId', '==', filter.programmeId));
    }
    if (filter?.semester) {
      q = query(q, where('semester', '==', filter.semester));
    }
    if (filter?.subjectCode) {
      q = query(q, where('subjectCode', '==', filter.subjectCode));
    }
    if (filter?.materialType) {
      q = query(q, where('materialType', '==', filter.materialType));
    }
    if (filter?.approvalStatus) {
      q = query(q, where('approvalStatus', '==', filter.approvalStatus));
    }
    if (filter?.uploaderId) {
      q = query(q, where('uploaderId', '==', filter.uploaderId));
    }
    
    // Order by most recent
    q = query(q, orderBy('uploadDate', 'desc'));
    
    const querySnapshot = await getDocs(q);
    let materials = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      materialId: doc.id
    })) as Material[];
    
    // Apply text search filter if provided
    if (filter?.searchQuery) {
      const searchTerm = filter.searchQuery.toLowerCase();
      materials = materials.filter(material =>
        material.title.toLowerCase().includes(searchTerm) ||
        (material.description && material.description.toLowerCase().includes(searchTerm)) ||
        material.subjectName.toLowerCase().includes(searchTerm)
      );
    }
    
    return materials;
  } catch (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
}

export async function getMaterial(materialId: string): Promise<Material | null> {
  try {
    const docSnap = await getDoc(doc(getDb(), 'materials', materialId));
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        materialId: docSnap.id
      } as Material;
    }
    return null;
  } catch (error) {
    console.error('Error fetching material:', error);
    return null;
  }
}

export async function createMaterial(
  metadata: MaterialMetadata,
  file: {
    fileName: string;
    fileSize: number;
    fileType: string;
    downloadURL: string;
  },
  uploaderId: string,
  uploaderName: string,
  uploaderRole: 'student' | 'lecturer'
): Promise<string> {
  try {
    // Auto-approve lecturer uploads, require approval for students
    const approvalStatus = uploaderRole === 'lecturer' ? 'approved' : 'pending';
    
    const materialData = {
      ...metadata,
      ...file,
      uploaderId,
      uploaderName,
      uploaderRole,
      uploadDate: serverTimestamp(),
      approvalStatus,
      ...(approvalStatus === 'approved' && { approvedDate: serverTimestamp() }),
      downloadCount: 0,
      views: 0
    };
    
    const docRef = await addDoc(collection(getDb(), 'materials'), materialData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating material:', error);
    throw error;
  }
}

export async function updateMaterial(materialId: string, updates: Partial<Material>): Promise<void> {
  try {
    await updateDoc(doc(getDb(), 'materials', materialId), updates);
  } catch (error) {
    console.error('Error updating material:', error);
    throw error;
  }
}

export async function deleteMaterial(materialId: string): Promise<void> {
  try {
    await deleteDoc(doc(getDb(), 'materials', materialId));
  } catch (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
}

export async function deleteMaterialWithStorage(materialId: string, adminId?: string, reason?: string): Promise<void> {
  try {
    // Get material details first for storage cleanup and audit
    const material = await getMaterial(materialId);
    if (!material) {
      throw new Error('Material not found');
    }

    // Validate and sanitize material data
    const sanitizedMaterial = {
      ...material,
      title: material.title || 'Unknown Title',
      materialType: material.materialType || 'unknown',
      uploaderName: material.uploaderName || 'Unknown User',
      uploaderId: material.uploaderId || 'unknown',
      downloadURL: material.downloadURL || null
    };

    // Validate required fields
    if (!sanitizedMaterial.downloadURL) {
      console.warn('⚠️ Material has no download URL, skipping storage deletion');
    }

    // Extract storage path from download URL
    const storagePath = sanitizedMaterial.downloadURL
      ? extractStoragePathFromURL(sanitizedMaterial.downloadURL)
      : null;

    // Try to delete from storage (don't fail if file doesn't exist)
    if (storagePath && sanitizedMaterial.downloadURL) {
      try {
        const { deleteFile } = await import('./storage');
        await deleteFile(storagePath);
        console.log('🗑️ Storage file deleted:', storagePath);
      } catch (storageError) {
        console.warn('⚠️ Storage file deletion failed (file may not exist):', storageError);
        // Continue with Firestore deletion even if storage fails
      }
    }

    // Log admin action if admin details provided
    if (adminId) {
      try {
        await logAdminAction({
          adminId,
          action: 'delete_material',
          targetId: materialId,
          targetType: 'material',
          details: {
            materialTitle: sanitizedMaterial.title,
            materialType: sanitizedMaterial.materialType,
            uploaderId: sanitizedMaterial.uploaderId,
            uploaderName: sanitizedMaterial.uploaderName,
            reason: reason || 'No reason provided'
          }
        });
      } catch (logError) {
        console.warn('⚠️ Failed to log admin action:', logError);
        // Continue with deletion even if logging fails
      }
    }

    // Delete Firestore document
    await deleteDoc(doc(getDb(), 'materials', materialId));
    console.log('🗑️ Material deleted from Firestore:', materialId);

  } catch (error) {
    console.error('Error deleting material with storage:', error);
    throw error;
  }
}

export async function getMaterialsWithFilters(filter?: MaterialFilter): Promise<{
  materials: Material[];
  total: number;
}> {
  try {
    let q = query(collection(getDb(), 'materials'));

    // Apply filters
    if (filter?.programmeId) {
      q = query(q, where('programmeId', '==', filter.programmeId));
    }
    if (filter?.semester) {
      q = query(q, where('semester', '==', filter.semester));
    }
    if (filter?.subjectCode) {
      q = query(q, where('subjectCode', '==', filter.subjectCode));
    }
    if (filter?.materialType) {
      q = query(q, where('materialType', '==', filter.materialType));
    }
    if (filter?.approvalStatus) {
      q = query(q, where('approvalStatus', '==', filter.approvalStatus));
    }
    if (filter?.uploaderId) {
      q = query(q, where('uploaderId', '==', filter.uploaderId));
    }

    // Order by most recent
    q = query(q, orderBy('uploadDate', 'desc'));

    const querySnapshot = await getDocs(q);
    let materials = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      materialId: doc.id
    })) as Material[];

    // Apply text search filter if provided
    if (filter?.searchQuery) {
      const searchTerm = filter.searchQuery.toLowerCase();
      materials = materials.filter(material => {
        const searchableText = [
          material.title || '',
          material.description || '',
          material.subjectName || '',
          material.uploaderName || '',
          material.subjectCode || '',
          material.programmeId || '',
          material.materialType || ''
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
      });
    }

    return {
      materials,
      total: materials.length
    };
  } catch (error) {
    console.error('Error fetching materials with filters:', error);
    return {
      materials: [],
      total: 0
    };
  }
}

// Helper function to extract storage path from download URL
function extractStoragePathFromURL(downloadURL: string): string | null {
  if (!downloadURL || typeof downloadURL !== 'string') {
    console.warn('⚠️ Invalid download URL provided');
    return null;
  }

  try {
    // Firebase Storage download URLs follow this pattern:
    // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const url = new URL(downloadURL);
    const pathParts = url.pathname.split('/o/');

    if (pathParts.length < 2) {
      console.warn('⚠️ Invalid Firebase Storage URL format:', downloadURL);
      return null;
    }

    // Decode the path part (URL encoded)
    const encodedPath = pathParts[1].split('?')[0]; // Remove query parameters
    if (!encodedPath) {
      console.warn('⚠️ No path found in Firebase Storage URL:', downloadURL);
      return null;
    }

    return decodeURIComponent(encodedPath);
  } catch (error) {
    console.warn('⚠️ Failed to extract storage path from URL:', downloadURL, error);
    return null;
  }
}

// Admin action logging interface
interface AdminActionLog {
  adminId: string;
  action: string;
  targetId: string;
  targetType: string;
  details: Record<string, unknown>;
  timestamp: unknown;
}

// Log admin actions for audit trail
async function logAdminAction(action: Omit<AdminActionLog, 'timestamp'>): Promise<void> {
  try {
    const logsRef = collection(getDb(), 'admin_logs');
    await addDoc(logsRef, {
      ...action,
      timestamp: serverTimestamp()
    });
    console.log('📝 Admin action logged:', action.action);
  } catch (error) {
    console.error('Error logging admin action:', error);
    throw error;
  }
}

// Material approval functions for admin
export async function approveMaterial(materialId: string, adminId: string): Promise<void> {
  try {
    await updateDoc(doc(getDb(), 'materials', materialId), {
      approvalStatus: 'approved',
      approvedBy: adminId,
      approvedDate: serverTimestamp()
    });
  } catch (error) {
    console.error('Error approving material:', error);
    throw error;
  }
}

export async function rejectMaterial(materialId: string, adminId: string, reason: string): Promise<void> {
  try {
    await updateDoc(doc(getDb(), 'materials', materialId), {
      approvalStatus: 'rejected',
      approvedBy: adminId,
      approvedDate: serverTimestamp(),
      rejectionReason: reason
    });
  } catch (error) {
    console.error('Error rejecting material:', error);
    throw error;
  }
}

// Get pending materials for lecturer approval
export async function getPendingMaterials(): Promise<Material[]> {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(getDb(), 'materials'),
        where('approvalStatus', '==', 'pending'),
        orderBy('uploadDate', 'desc')
      )
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      materialId: doc.id
    })) as Material[];
  } catch (error) {
    console.error('Error fetching pending materials:', error);
    return [];
  }
}

// Lecturer Subject Management
export async function getLecturerSubjects(lecturerId: string): Promise<string[]> {
  try {
    const userDoc = await getDoc(doc(getDb(), 'users', lecturerId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.teachingSubjects || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching lecturer subjects:', error);
    return [];
  }
}

export async function updateLecturerSubjects(lecturerId: string, subjectCodes: string[]): Promise<void> {
  try {
    await updateDoc(doc(getDb(), 'users', lecturerId), {
      teachingSubjects: subjectCodes
    });
  } catch (error) {
    console.error('Error updating lecturer subjects:', error);
    throw error;
  }
}

export async function getEligibleLecturers(programmeId: string, subjectCode: string): Promise<User[]> {
  try {
    // Get lecturers who teach this subject and programme
    const usersRef = collection(getDb(), 'users');
    const lecturerQuery = query(
      usersRef,
      where('role', '==', 'lecturer'),
      where('programmes', 'array-contains', programmeId),
      where('teachingSubjects', 'array-contains', subjectCode)
    );
    
    const querySnapshot = await getDocs(lecturerQuery);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    })) as User[];
  } catch (error) {
    console.error('Error fetching eligible lecturers:', error);
    return [];
  }
}

// Lecturer-specific material approval functions
export async function getPendingMaterialsForLecturer(lecturerId: string): Promise<Material[]> {
  try {
    // First get lecturer's teaching subjects
    const teachingSubjects = await getLecturerSubjects(lecturerId);
    
    if (teachingSubjects.length === 0) {
      return [];
    }
    
    // Get all pending materials
    const materialsRef = collection(getDb(), 'materials');
    const pendingQuery = query(
      materialsRef,
      where('approvalStatus', '==', 'pending'),
      where('uploaderRole', '==', 'student'), // Only student uploads need lecturer approval
      orderBy('uploadDate', 'desc')
    );
    
    const querySnapshot = await getDocs(pendingQuery);
    const allPendingMaterials = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      materialId: doc.id
    })) as Material[];
    
    // Filter materials by lecturer's teaching subjects
    return allPendingMaterials.filter(material => 
      teachingSubjects.includes(material.subjectCode)
    );
  } catch (error) {
    console.error('Error fetching pending materials for lecturer:', error);
    return [];
  }
}

export async function approveMaterialByLecturer(
  materialId: string,
  lecturerId: string,
  lecturerName: string
): Promise<void> {
  try {
    // Get material details first for email notification
    const material = await getMaterial(materialId);
    if (!material) {
      throw new Error('Material not found');
    }

    // Update material status
    await updateDoc(doc(getDb(), 'materials', materialId), {
      approvalStatus: 'approved',
      approvedBy: lecturerId,
      approverName: lecturerName,
      approverRole: 'lecturer',
      approvedDate: serverTimestamp()
    });

    // Send in-app notification to material uploader
    createApprovalNotification({
      userId: material.uploaderId,
      materialId: material.materialId,
      materialTitle: material.title,
      approverId: lecturerId,
      approverName: lecturerName,
      approvalAction: 'approved',
      subjectCode: material.subjectCode,
      programmeId: material.programmeId
    }).catch(error => {
      console.error('Failed to create approval notification:', error);
    });

    // Send email notification to material uploader
    sendMaterialApprovalEmailNotification({
      material,
      approverName: lecturerName,
      approvalAction: 'approved',
      recipientUserId: material.uploaderId
    }).catch(error => {
      console.error('Failed to send approval email notification:', error);
    });
  } catch (error) {
    console.error('Error approving material by lecturer:', error);
    throw error;
  }
}

export async function rejectMaterialByLecturer(
  materialId: string,
  lecturerId: string,
  lecturerName: string,
  reason: string
): Promise<void> {
  try {
    // Get material details first for email notification
    const material = await getMaterial(materialId);
    if (!material) {
      throw new Error('Material not found');
    }

    // Update material status
    await updateDoc(doc(getDb(), 'materials', materialId), {
      approvalStatus: 'rejected',
      approvedBy: lecturerId,
      approverName: lecturerName,
      approverRole: 'lecturer',
      rejectionReason: reason,
      approvedDate: serverTimestamp()
    });

    // Send in-app notification to material uploader
    createApprovalNotification({
      userId: material.uploaderId,
      materialId: material.materialId,
      materialTitle: material.title,
      approverId: lecturerId,
      approverName: lecturerName,
      approvalAction: 'rejected',
      rejectionReason: reason,
      subjectCode: material.subjectCode,
      programmeId: material.programmeId
    }).catch(error => {
      console.error('Failed to create rejection notification:', error);
    });

    // Send email notification to material uploader
    sendMaterialApprovalEmailNotification({
      material,
      approverName: lecturerName,
      approvalAction: 'rejected',
      rejectionReason: reason,
      recipientUserId: material.uploaderId
    }).catch(error => {
      console.error('Failed to send rejection email notification:', error);
    });
  } catch (error) {
    console.error('Error rejecting material by lecturer:', error);
    throw error;
  }
}

// Update download count
export async function incrementDownloadCount(materialId: string): Promise<void> {
  try {
    const material = await getMaterial(materialId);
    if (material) {
      await updateDoc(doc(getDb(), 'materials', materialId), {
        downloadCount: (material.downloadCount || 0) + 1,
        lastAccessed: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating download count:', error);
  }
}

// Get popular materials
export async function getPopularMaterials(limitCount: number = 10): Promise<Material[]> {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(getDb(), 'materials'),
        where('approvalStatus', '==', 'approved'),
        orderBy('downloadCount', 'desc'),
        limit(limitCount)
      )
    );
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      materialId: doc.id
    })) as Material[];
  } catch (error) {
    console.error('Error fetching popular materials:', error);
    return [];
  }
}

// Get lecturer dashboard statistics
export async function getLecturerStats(lecturerId: string): Promise<{
  materialsUploaded: number;
  totalDownloads: number;
  studentsServed: number;
  pendingApprovals: number;
}> {
  try {
    // Get lecturer's uploaded materials
    const materialsQuery = query(
      collection(getDb(), 'materials'),
      where('uploaderId', '==', lecturerId)
    );
    const materialsSnapshot = await getDocs(materialsQuery);
    const materials = materialsSnapshot.docs.map(doc => doc.data() as Material);
    
    // Calculate total downloads
    const totalDownloads = materials.reduce((sum, material) => 
      sum + (material.downloadCount || 0), 0
    );
    
    // Get pending approvals for lecturer
    const pendingMaterials = await getPendingMaterialsForLecturer(lecturerId);
    
    // Estimate students served (unique downloaders would require more complex tracking)
    // For now, use a rough estimate based on downloads
    const studentsServed = Math.ceil(totalDownloads * 0.7); // Rough estimate
    
    return {
      materialsUploaded: materials.length,
      totalDownloads,
      studentsServed,
      pendingApprovals: pendingMaterials.length
    };
  } catch (error) {
    console.error('Error fetching lecturer stats:', error);
    return {
      materialsUploaded: 0,
      totalDownloads: 0,
      studentsServed: 0,
      pendingApprovals: 0
    };
  }
}

// Comment System Functions
export async function getComments(materialId: string): Promise<Comment[]> {
  try {
    const commentsRef = collection(getDb(), 'materials', materialId, 'comments');
    const querySnapshot = await getDocs(
      query(commentsRef, orderBy('createdAt', 'desc'))
    );
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      commentId: doc.id
    })) as Comment[];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

// Send material approval notification email
async function sendMaterialApprovalEmailNotification(params: {
  material: Material;
  approverName: string;
  approvalAction: 'approved' | 'rejected';
  rejectionReason?: string;
  recipientUserId: string;
}): Promise<void> {
  try {
    // Check if user wants email notifications
    const userPrefs = await getUserEmailAndPreferences(params.recipientUserId);
    if (!userPrefs || !userPrefs.emailUpdates) {
      console.log('User has disabled email notifications or user not found');
      return;
    }

    // Generate material link
    const materialLink = generateMaterialLink(
      params.material.programmeId,
      params.material.subjectCode,
      params.material.materialId,
      false // Don't show comments for approval notifications
    );

    // Send email
    const emailResult = await sendApprovalEmail({
      userEmail: userPrefs.email,
      approverName: params.approverName,
      materialTitle: params.material.title,
      approvalAction: params.approvalAction,
      rejectionReason: params.rejectionReason,
      materialLink,
      programmeId: params.material.programmeId,
      subjectCode: params.material.subjectCode
    });

    if (emailResult.success) {
      console.log('✅ Approval email notification sent to:', userPrefs.email);
      if (emailResult.messageId) {
        console.log('📧 Email Message ID:', emailResult.messageId);
      }
    } else {
      console.error('❌ Failed to send approval email notification to:', userPrefs.email);
      console.error('Error details:', emailResult.message, emailResult.error);
    }
  } catch (error) {
    console.error('❌ Failed to send approval email notification:', error);
    // Don't throw error - email failures shouldn't break the approval functionality
  }
}

// Helper function to get user email and preferences
async function getUserEmailAndPreferences(userId: string): Promise<{ email: string; emailUpdates: boolean } | null> {
  try {
    const userDoc = await getDoc(doc(getDb(), 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return {
      email: userData.email,
      emailUpdates: userData.preferences?.emailUpdates ?? true // Default to true if not set
    };
  } catch (error) {
    console.error('Error getting user email and preferences:', error);
    return null;
  }
}

// Helper function to send email notification for comments
async function sendCommentEmailNotification(params: {
  material: Material;
  commenterName: string;
  commentContent: string;
  materialId: string;
  recipientUserId: string;
}): Promise<void> {
  try {
    // Check if user wants email notifications
    const userPrefs = await getUserEmailAndPreferences(params.recipientUserId);
    if (!userPrefs || !userPrefs.emailUpdates) {
      console.log('User has disabled email notifications or user not found');
      return;
    }

    // Generate material link
    const materialLink = generateMaterialLink(
      params.material.programmeId,
      params.material.subjectCode,
      params.materialId,
      true // Show comments by default
    );

    // Send email
    const emailResult = await sendCommentEmail({
      userEmail: userPrefs.email,
      commenterName: params.commenterName,
      materialTitle: params.material.title,
      commentContent: params.commentContent,
      materialLink,
      programmeId: params.material.programmeId,
      subjectCode: params.material.subjectCode
    });

    if (emailResult.success) {
      console.log('✅ Email notification sent to:', userPrefs.email);
      if (emailResult.messageId) {
        console.log('📧 Email Message ID:', emailResult.messageId);
      }
    } else {
      console.error('❌ Failed to send email notification to:', userPrefs.email);
      console.error('Error details:', emailResult.message, emailResult.error);
    }
  } catch (error) {
    console.error('❌ Failed to send email notification:', error);
    // Don't throw error - email failures shouldn't break the comment functionality
  }
}

export async function addComment(
  commentData: CommentCreateData,
  authorId: string,
  authorName: string,
  authorRole: 'student' | 'lecturer'
): Promise<string> {
  try {
    // Get material details to find owner and create notification
    const material = await getMaterial(commentData.materialId);
    
    // Handle file uploads if any
    const attachments: CommentAttachment[] = [];
    
    if (commentData.files && commentData.files.length > 0) {
      for (const file of commentData.files) {
        const storageRef = ref(
          getStorageInstance(), 
          `comments/${commentData.materialId}/${Date.now()}_${file.name}`
        );
        
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        
        attachments.push({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          downloadURL
        });
      }
    }

    // Create comment document
    const commentsRef = collection(getDb(), 'materials', commentData.materialId, 'comments');
    const commentDoc = {
      materialId: commentData.materialId,
      content: commentData.content,
      attachments: attachments.length > 0 ? attachments : [],
      authorId,
      authorName,
      authorRole,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(commentsRef, commentDoc);
    
    // Create notification for material owner (if commenter is not the owner) - don't wait for it
    if (material && material.uploaderId !== authorId) {
      createCommentNotification({
        userId: material.uploaderId,
        materialId: material.materialId,
        materialTitle: material.title,
        commenterId: authorId,
        commenterName: authorName,
        commentContent: commentData.content,
        commentId: docRef.id,
        subjectCode: material.subjectCode,
        programmeId: material.programmeId
      }).catch(error => {
        console.error('Failed to create notification:', error);
      });

      // Send email notification (don't wait for it)
      sendCommentEmailNotification({
        material,
        commenterName: authorName,
        commentContent: commentData.content,
        materialId: material.materialId,
        recipientUserId: material.uploaderId
      }).catch(error => {
        console.error('Failed to send email notification:', error);
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

export async function deleteComment(materialId: string, commentId: string): Promise<void> {
  try {
    await deleteDoc(doc(getDb(), 'materials', materialId, 'comments', commentId));
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

// Comment Notification System Functions
export async function createCommentNotification(notificationData: NotificationCreateData): Promise<string> {
  try {
    // Truncate comment content for preview
    const truncatedContent = notificationData.commentContent.length > 100 
      ? notificationData.commentContent.substring(0, 100) + '...'
      : notificationData.commentContent;

    const notificationsRef = collection(getDb(), 'users', notificationData.userId, 'notifications');
    
    const notificationDoc = {
      ...notificationData,
      commentContent: truncatedContent,
      createdAt: serverTimestamp(),
      isRead: false
    };

    const docRef = await addDoc(notificationsRef, notificationDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating comment notification:', error);
    throw error;
  }
}

export async function createApprovalNotification(notificationData: ApprovalNotificationCreateData): Promise<string> {
  try {
    const notificationsRef = collection(getDb(), 'users', notificationData.userId, 'notifications');

    const notificationDoc = {
      ...notificationData,
      createdAt: serverTimestamp(),
      isRead: false
    };

    const docRef = await addDoc(notificationsRef, notificationDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating approval notification:', error);
    throw error;
  }
}

export async function getCommentNotifications(userId: string): Promise<CommentNotification[]> {
  try {
    const notificationsRef = collection(getDb(), 'users', userId, 'notifications');
    
    const querySnapshot = await getDocs(
      query(notificationsRef, orderBy('createdAt', 'desc'))
    );
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      notificationId: doc.id
    })) as CommentNotification[];
  } catch (error) {
    console.error('Error fetching comment notifications:', error);
    return [];
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const notificationsRef = collection(getDb(), 'users', userId, 'notifications');
    const querySnapshot = await getDocs(
      query(notificationsRef, where('isRead', '==', false))
    );
    
    return querySnapshot.size;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(getDb(), 'users', userId, 'notifications', notificationId), {
      isRead: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notificationsRef = collection(getDb(), 'users', userId, 'notifications');
    const querySnapshot = await getDocs(
      query(notificationsRef, where('isRead', '==', false))
    );
    
    const batch = writeBatch(getDb());
    querySnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// =====================
// APPROVAL NOTIFICATION FUNCTIONS
// =====================

export async function getApprovalNotifications(userId: string): Promise<ApprovalNotification[]> {
  try {
    const notificationsRef = collection(getDb(), 'users', userId, 'notifications');

    const querySnapshot = await getDocs(
      query(
        notificationsRef,
        where('approvalAction', 'in', ['approved', 'rejected']),
        orderBy('createdAt', 'desc')
      )
    );

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      notificationId: doc.id
    })) as ApprovalNotification[];
  } catch (error) {
    console.error('Error fetching approval notifications:', error);
    return [];
  }
}

export async function getAllNotifications(userId: string): Promise<(CommentNotification | ApprovalNotification)[]> {
  try {
    const notificationsRef = collection(getDb(), 'users', userId, 'notifications');

    const querySnapshot = await getDocs(
      query(notificationsRef, orderBy('createdAt', 'desc'))
    );

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      notificationId: doc.id
    })) as (CommentNotification | ApprovalNotification)[];
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return [];
  }
}

// =====================
// SEARCH FEATURE FUNCTIONS
// =====================

/**
 * Enhanced search function for materials with improved relevance scoring and highlighting
 */
export async function searchMaterials(
  options: SearchOptions
): Promise<{
  materials: MaterialWithHighlight[];
  total: number;
}> {
  try {
    const { query: searchQuery, filters, sortBy = 'relevance', sortOrder = 'desc', limit = 20, offset = 0 } = options;

    // Convert search options to material filter
    const materialFilter: MaterialFilter = {
      searchQuery,
      programmeId: filters?.programmeId,
      semester: filters?.semester,
      subjectCode: filters?.subjectCode,
      materialType: filters?.materialType,
      uploaderId: filters?.uploaderId,
      approvalStatus: 'approved' // Only search approved materials
    };

    // Get materials with basic filtering
    let materials = await getMaterials(materialFilter);

    // Enhanced text search with relevance scoring
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();

      materials = materials.map(material => {
        const materialWithHighlight = material as MaterialWithHighlight;
        const searchableFields = [
          { field: 'title', weight: 3, text: material.title },
          { field: 'description', weight: 2, text: material.description || '' },
          { field: 'subjectName', weight: 2, text: material.subjectName },
          { field: 'uploaderName', weight: 1, text: material.uploaderName },
          { field: 'subjectCode', weight: 1, text: material.subjectCode },
          { field: 'materialType', weight: 1, text: material.materialType }
        ];

        let relevanceScore = 0;
        const highlightedFields: HighlightedFields = {};

        searchableFields.forEach(({ field, weight, text }) => {
          if (text && text.toLowerCase().includes(searchTerm)) {
            relevanceScore += weight;

            // Create highlighted version
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            (highlightedFields as Record<string, string>)[field] = text.replace(regex, '<mark>$1</mark>');
          }
        });

        if (relevanceScore > 0) {
          materialWithHighlight.highlightedFields = highlightedFields;
        }

        return { ...materialWithHighlight, relevanceScore };
      }).filter(material => material.relevanceScore > 0);

      // Sort by relevance or other criteria
      materials.sort((a, b) => {
        const materialA = a as MaterialWithHighlight;
        const materialB = b as MaterialWithHighlight;
        if (sortBy === 'relevance') {
          return sortOrder === 'desc' ? materialB.relevanceScore! - materialA.relevanceScore! : materialA.relevanceScore! - materialB.relevanceScore!;
        } else if (sortBy === 'date') {
          const dateA = a.uploadDate.toDate();
          const dateB = b.uploadDate.toDate();
          return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        } else if (sortBy === 'title') {
          return sortOrder === 'desc' ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title);
        } else if (sortBy === 'downloads') {
          return sortOrder === 'desc' ? b.downloadCount - a.downloadCount : a.downloadCount - b.downloadCount;
        }
        return 0;
      });
    }

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedMaterials = materials.slice(startIndex, endIndex);

    return {
      materials: paginatedMaterials,
      total: materials.length
    };
  } catch (error) {
    console.error('Error searching materials:', error);
    return {
      materials: [],
      total: 0
    };
  }
}

/**
 * Search comments across all materials
 */
export async function searchComments(
  searchQuery: string,
  options?: {
    materialId?: string;
    programmeId?: string;
    subjectCode?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{
  comments: CommentWithHighlight[];
  total: number;
}> {
  try {
    const { materialId, programmeId, subjectCode, limit = 20, offset = 0 } = options || {};

    // First, get relevant materials
    const materialFilter: MaterialFilter = {
      approvalStatus: 'approved',
      ...(programmeId && { programmeId }),
      ...(subjectCode && { subjectCode }),
      ...(materialId && { subjectCode: materialId }) // This is a workaround, need to adjust logic
    };

    const materials = await getMaterials(materialFilter);

    // Filter to specific material if requested
    const relevantMaterials = materialId
      ? materials.filter(m => m.materialId === materialId)
      : materials;

    // Get comments for each material
    const allComments: CommentWithHighlight[] = [];

    for (const material of relevantMaterials) {
      try {
        const commentsQuery = query(
          collection(getDb(), 'materials', material.materialId, 'comments'),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(commentsQuery);
        const materialComments = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          commentId: doc.id,
          materialTitle: material.title,
          subjectCode: material.subjectCode,
          programmeId: material.programmeId
        })) as CommentWithHighlight[];

        allComments.push(...materialComments);
      } catch (error) {
        console.warn(`Error loading comments for material ${material.materialId}:`, error);
      }
    }

    // Filter comments by search query
    let filteredComments = allComments;
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();

      filteredComments = allComments.map(comment => {
        const commentWithHighlight = comment as CommentWithHighlight;

        // Check content and author name
        const contentMatch = comment.content.toLowerCase().includes(searchTerm);
        const authorMatch = comment.authorName.toLowerCase().includes(searchTerm);

        if (contentMatch || authorMatch) {
          const highlightedFields: HighlightedFields = {};

          if (contentMatch) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            highlightedFields.content = comment.content.replace(regex, '<mark>$1</mark>');
          }

          if (authorMatch) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            highlightedFields.authorName = comment.authorName.replace(regex, '<mark>$1</mark>');
          }

          commentWithHighlight.highlightedFields = highlightedFields;
          return commentWithHighlight;
        }

        return null;
      }).filter(Boolean) as CommentWithHighlight[];
    }

    // Sort by creation date (newest first)
    filteredComments.sort((a, b) => {
      const dateA = a.createdAt.toDate();
      const dateB = b.createdAt.toDate();
      return dateB.getTime() - dateA.getTime();
    });

    // Apply pagination
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedComments = filteredComments.slice(startIndex, endIndex);

    return {
      comments: paginatedComments,
      total: filteredComments.length
    };
  } catch (error) {
    console.error('Error searching comments:', error);
    return {
      comments: [],
      total: 0
    };
  }
}

/**
 * Search subjects by name and code
 */
export async function searchSubjects(
  searchQuery: string,
  options?: {
    programmeId?: string;
    semester?: number;
    limit?: number;
  }
): Promise<{
  subjects: SubjectSearchResult[];
  total: number;
}> {
  try {
    const { programmeId, semester, limit = 20 } = options || {};
    const searchTerm = searchQuery.toLowerCase().trim();

    if (!searchTerm) {
      return { subjects: [], total: 0 };
    }

    // Build the query with optional filters
    const constraints = [];
    if (programmeId) {
      constraints.push(where('programmeId', '==', programmeId));
    }
    if (semester) {
      constraints.push(where('semester', '==', semester));
    }

    // Create the final query
    const queryRef = constraints.length > 0
      ? query(collection(getDb(), 'subjects'), ...constraints)
      : query(collection(getDb(), 'subjects'));

    const querySnapshot = await getDocs(queryRef);
    const allSubjects = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      subjectId: doc.id
    })) as Subject[];

    // Filter and score subjects based on search term
    const matchingSubjects = allSubjects
      .map(subject => {
        let relevanceScore = 0;
        const highlightedFields: { subjectName?: string; subjectCode?: string } = {};

        // Check subject name match
        if (subject.subjectName.toLowerCase().includes(searchTerm)) {
          relevanceScore += 3;
          const regex = new RegExp(`(${searchTerm})`, 'gi');
          highlightedFields.subjectName = subject.subjectName.replace(regex, '<mark>$1</mark>');
        }

        // Check subject code match
        if (subject.subjectCode.toLowerCase().includes(searchTerm)) {
          relevanceScore += 2;
          const regex = new RegExp(`(${searchTerm})`, 'gi');
          highlightedFields.subjectCode = subject.subjectCode.replace(regex, '<mark>$1</mark>');
        }

        // Check description match (lower weight)
        if (subject.description && subject.description.toLowerCase().includes(searchTerm)) {
          relevanceScore += 1;
        }

        return {
          subject,
          relevanceScore,
          highlightedFields: Object.keys(highlightedFields).length > 0 ? highlightedFields : undefined
        };
      })
      .filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    // Get material counts for each subject
    const subjectsWithCounts = await Promise.all(
      matchingSubjects.map(async ({ subject, relevanceScore, highlightedFields }) => {
        // Count materials for this subject
        const materialsQuery = query(
          collection(getDb(), 'materials'),
          where('subjectCode', '==', subject.subjectCode),
          where('programmeId', '==', subject.programmeId),
          where('approvalStatus', '==', 'approved')
        );
        const materialsSnapshot = await getDocs(materialsQuery);
        const materialCount = materialsSnapshot.size;

        return {
          id: subject.subjectId,
          type: 'subject' as const,
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          programmeId: subject.programmeId,
          semester: subject.semester,
          materialCount,
          description: subject.description,
          highlightedFields
        } as SubjectSearchResult;
      })
    );

    return {
      subjects: subjectsWithCounts,
      total: subjectsWithCounts.length
    };
  } catch (error) {
    console.error('Error searching subjects:', error);
    return { subjects: [], total: 0 };
  }
}

/**
 * Combined search function for both materials and comments
 */
export async function searchAll(
  searchQuery: string,
  options?: SearchAllOptions
): Promise<SearchResults> {
  try {
    const { filters, sortBy, limit = 20 } = options || {};

    // Search materials, comments, and subjects in parallel
    const [materialsResult, commentsResult, subjectsResult] = await Promise.all([
      searchMaterials({
        query: searchQuery,
        filters,
        limit,
        sortBy: sortBy || 'relevance',
        sortOrder: 'desc'
      }),
      searchComments(searchQuery, {
        programmeId: filters?.programmeId,
        subjectCode: filters?.subjectCode,
        limit
      }),
      searchSubjects(searchQuery, {
        programmeId: filters?.programmeId,
        semester: filters?.semester,
        limit
      })
    ]);

    // Convert materials to search results
    const materialSearchResults: SearchResult[] = materialsResult.materials.map(material => ({
      id: material.materialId,
      type: 'material' as const,
      title: material.title,
      description: material.description,
      snippet: material.highlightedFields?.title || material.highlightedFields?.description || material.title,
      relevanceScore: material.relevanceScore || 0,
      programmeId: material.programmeId,
      subjectCode: material.subjectCode,
      materialId: material.materialId,
      authorName: material.uploaderName,
      createdAt: material.uploadDate,
      materialType: material.materialType,
      fileSize: material.fileSize,
      fileType: material.fileType,
      downloadURL: material.downloadURL
    }));

    // Convert comments to search results
    const commentSearchResults: SearchResult[] = commentsResult.comments.map(comment => ({
      id: comment.commentId,
      type: 'comment' as const,
      title: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
      description: `Comment by ${comment.authorName}`,
      snippet: comment.highlightedFields?.content || comment.content,
      relevanceScore: 1, // Basic relevance for comments
      programmeId: comment.programmeId,
      subjectCode: comment.subjectCode,
      materialId: comment.materialId,
      commentId: comment.commentId,
      authorName: comment.authorName,
      createdAt: comment.createdAt
    }));

    // Sort all results by relevance
    const allResults = [...materialSearchResults, ...commentSearchResults]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return {
      materials: materialSearchResults,
      comments: commentSearchResults,
      subjects: subjectsResult.subjects,
      totalMaterials: materialsResult.total,
      totalComments: commentsResult.total,
      totalSubjects: subjectsResult.total,
      searchQuery,
      filters: filters || {},
      hasMore: materialsResult.total > limit || commentsResult.total > limit || subjectsResult.total > limit
    };
  } catch (error) {
    console.error('Error in combined search:', error);
    return {
      materials: [],
      comments: [],
      subjects: [],
      totalMaterials: 0,
      totalComments: 0,
      totalSubjects: 0,
      searchQuery,
      filters: {},
      hasMore: false
    };
  }
}

/**
 * Get search suggestions based on query
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
): Promise<string[]> {
  try {
    if (query.length < 2) return [];

    const suggestions: string[] = [];

    // Get material titles that match
    const materials = await getMaterials({
      searchQuery: query,
      approvalStatus: 'approved'
    });

    // Extract unique suggestions
    const materialTitles = [...new Set(materials.map(m => m.title))];
    const subjectNames = [...new Set(materials.map(m => m.subjectName))];
    const uploaderNames = [...new Set(materials.map(m => m.uploaderName))];

    // Add suggestions up to limit
    suggestions.push(...materialTitles.slice(0, Math.floor(limit / 3)));
    suggestions.push(...subjectNames.slice(0, Math.floor(limit / 3)));
    suggestions.push(...uploaderNames.slice(0, Math.floor(limit / 3)));

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

// =====================
// SYSTEM SETTINGS FUNCTIONS
// =====================

// Cache for system settings (per session)
let systemSettingsCache: SystemSettings | null = null;
let systemSettingsCacheTime = 0;
const SYSTEM_SETTINGS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get system settings from Firestore with caching
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const now = Date.now();

  // Check cache first
  if (systemSettingsCache && (now - systemSettingsCacheTime < SYSTEM_SETTINGS_CACHE_DURATION)) {
    console.log('💰 CACHE HIT: Using cached system settings');
    return systemSettingsCache;
  }

  try {
    console.log('🔍 Firestore query: Loading system settings');
    const settingsDoc = await getDoc(doc(getDb(), 'system_settings', 'main'));

    if (settingsDoc.exists()) {
      const settingsData = settingsDoc.data();
      const settings = {
        ...settingsData,
        settingsId: settingsDoc.id
      } as SystemSettings;

      // Validate that settings have required structure
      if (!settings.fileUpload || !settings.fileUpload.allowedFileTypes) {
        console.log('⚠️ System settings missing fileUpload.allowedFileTypes, attempting to fix...');

        // Create merged settings with defaults
        const mergedSettings = {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...settingsData,
          settingsId: settingsDoc.id,
          updatedAt: settingsData.updatedAt || Timestamp.now(),
          updatedBy: settingsData.updatedBy || 'system'
        };

        // Try to update the database (will work for admins, fail gracefully for students)
        try {
          await updateDoc(doc(getDb(), 'system_settings', 'main'), {
            fileUpload: DEFAULT_SYSTEM_SETTINGS.fileUpload,
            updatedAt: serverTimestamp(),
            updatedBy: 'system-auto-fix'
          });
          console.log('✅ System settings database updated with complete structure');
        } catch (updateError) {
          console.log('ℹ️ Could not update database (likely due to permissions), using session defaults');
        }

        console.log('✅ Using merged settings with defaults');

        // Cache the merged settings
        systemSettingsCache = mergedSettings as SystemSettings;
        systemSettingsCacheTime = now;
        return mergedSettings as SystemSettings;
      }

      // Cache the settings
      systemSettingsCache = settings;
      systemSettingsCacheTime = now;

      console.log('💾 CACHED: System settings loaded and cached');
      return settings;
    } else {
      // Initialize with default settings if none exist
      console.log('📝 No settings found, creating default settings');
      return await initializeSystemSettings();
    }
  } catch (error) {
    console.error('Error fetching system settings:', error);
    // Return default settings as fallback
    const fallbackSettings: SystemSettings = {
      ...DEFAULT_SYSTEM_SETTINGS,
      settingsId: 'fallback',
      updatedAt: createSafeTimestamp(new Date()),
      updatedBy: 'system'
    };
    return fallbackSettings;
  }
}

/**
 * Initialize system settings with defaults
 */
async function initializeSystemSettings(): Promise<SystemSettings> {
  try {
    const settingsRef = doc(getDb(), 'system_settings', 'main');
    const defaultSettings = {
      ...DEFAULT_SYSTEM_SETTINGS,
      updatedAt: serverTimestamp(),
      updatedBy: 'system'
    };

    await setDoc(settingsRef, defaultSettings);
    const settings = {
      ...defaultSettings,
      settingsId: 'main'
    } as SystemSettings;

    // Cache the new settings
    systemSettingsCache = settings;
    systemSettingsCacheTime = Date.now();

    console.log('✅ Default system settings created');
    return settings;
  } catch (error) {
    console.error('Error initializing system settings:', error);
    throw error;
  }
}

/**
 * Update system settings
 */
export async function updateSystemSettings(
  updates: SystemSettingsUpdate,
  adminId: string
): Promise<SystemSettings> {
  try {
    const settingsRef = doc(getDb(), 'system_settings', 'main');

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: adminId
    };

    await updateDoc(settingsRef, updateData);

    // Get updated settings
    const updatedDoc = await getDoc(settingsRef);
    if (!updatedDoc.exists()) {
      throw new Error('Settings document not found after update');
    }

    const updatedSettings = {
      ...updatedDoc.data(),
      settingsId: updatedDoc.id
    } as SystemSettings;

    // Update cache
    systemSettingsCache = updatedSettings;
    systemSettingsCacheTime = Date.now();

    // Log admin action
    try {
      await logAdminAction({
        adminId,
        action: 'update_system_settings',
        targetId: 'main',
        targetType: 'system_settings',
        details: { updates: Object.keys(updates) }
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log admin action:', logError);
    }

    console.log('✅ System settings updated successfully');
    return updatedSettings;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
}

/**
 * Clear system settings cache (useful after admin updates)
 */
export function clearSystemSettingsCache(): void {
  systemSettingsCache = null;
  systemSettingsCacheTime = 0;
  console.log('🗑️ System settings cache cleared');
}

/**
 * Get specific file upload settings
 */
export async function getFileUploadSettings(): Promise<{
  maxFileSize: number;
  allowedFileTypes: string[];
  maxFileNameLength: number;
}> {
  const settings = await getSystemSettings();

  // Validate that fileUpload settings exist
  if (!settings.fileUpload) {
    console.warn('fileUpload settings not found, returning defaults');
    return DEFAULT_SYSTEM_SETTINGS.fileUpload;
  }

  // Validate that allowedFileTypes exists
  if (!settings.fileUpload.allowedFileTypes) {
    console.warn('allowedFileTypes not found in fileUpload settings, returning defaults');
    return {
      ...settings.fileUpload,
      allowedFileTypes: DEFAULT_SYSTEM_SETTINGS.fileUpload.allowedFileTypes
    };
  }

  return settings.fileUpload;
}

/**
 * Get specific comment file settings
 */
export async function getCommentFileSettings(): Promise<{
  maxFileSize: number;
  maxFiles: number;
  allowedFileTypes: string[];
}> {
  const settings = await getSystemSettings();
  return settings.commentFiles;
}

/**
 * Get user restriction settings
 */
export async function getRestrictionSettings(): Promise<{
  studentsCanOnlyUploadNotes: boolean;
  studentsCanOnlyUploadToOwnProgramme: boolean;
  lecturerAutoApproval: boolean;
}> {
  const settings = await getSystemSettings();
  return settings.restrictions;
}

/**
 * Get platform settings
 */
export async function getPlatformSettings(): Promise<{
  platformName: string;
  adminEmail: string;
  maintenanceMode: boolean;
  enableFileDownloads: boolean;
  enableComments: boolean;
  enableNotifications: boolean;
}> {
  const settings = await getSystemSettings();
  return settings.platform;
}

/**
 * Get email notification settings
 */
export async function getEmailSettings(): Promise<{
  enabled: boolean;
  requireEmailVerification: boolean;
  enableUploadNotifications: boolean;
  enableCommentNotifications: boolean;
  enableApprovalNotifications: boolean;
}> {
  const settings = await getSystemSettings();
  return settings.email;
}