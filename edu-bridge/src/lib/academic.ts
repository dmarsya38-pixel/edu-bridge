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
  getDocsFromServer,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { db, auth } from './firebase';
import type {
  Programme,
  Subject,
  Material,
  MaterialFilter,
  MaterialUploadData,
  MaterialMetadata,
  Comment,
  CommentCreateData,
  CommentAttachment,
  CommentNotification,
  NotificationCreateData
} from '@/types/academic';
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
    const querySnapshot = await getDocs(
      query(collection(db, 'programmes'), orderBy('programmeCode'))
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
    const docSnap = await getDoc(doc(db, 'programmes', programmeId));
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
    const docRef = await addDoc(collection(db, 'programmes'), {
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
      query(collection(db, 'subjects'), orderBy('subjectCode'))
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
        collection(db, 'subjects'),
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
        collection(db, 'subjects'),
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
        collection(db, 'subjects'),
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
    const docRef = await addDoc(collection(db, 'subjects'), {
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
    let q = query(collection(db, 'materials'));
    
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
        material.description?.toLowerCase().includes(searchTerm) ||
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
    const docSnap = await getDoc(doc(db, 'materials', materialId));
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
    
    const docRef = await addDoc(collection(db, 'materials'), materialData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating material:', error);
    throw error;
  }
}

export async function updateMaterial(materialId: string, updates: Partial<Material>): Promise<void> {
  try {
    await updateDoc(doc(db, 'materials', materialId), updates);
  } catch (error) {
    console.error('Error updating material:', error);
    throw error;
  }
}

export async function deleteMaterial(materialId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'materials', materialId));
  } catch (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
}

// Material approval functions for admin
export async function approveMaterial(materialId: string, adminId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'materials', materialId), {
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
    await updateDoc(doc(db, 'materials', materialId), {
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

// Get pending materials for admin approval
export async function getPendingMaterials(): Promise<Material[]> {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'materials'),
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
    const userDoc = await getDoc(doc(db, 'users', lecturerId));
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
    await updateDoc(doc(db, 'users', lecturerId), {
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
    const usersRef = collection(db, 'users');
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
    const materialsRef = collection(db, 'materials');
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
    await updateDoc(doc(db, 'materials', materialId), {
      approvalStatus: 'approved',
      approvedBy: lecturerId,
      approverName: lecturerName,
      approverRole: 'lecturer',
      approvedDate: serverTimestamp()
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
    await updateDoc(doc(db, 'materials', materialId), {
      approvalStatus: 'rejected',
      approvedBy: lecturerId,
      approverName: lecturerName,
      approverRole: 'lecturer',
      rejectionReason: reason,
      approvedDate: serverTimestamp()
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
      await updateDoc(doc(db, 'materials', materialId), {
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
        collection(db, 'materials'),
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
      collection(db, 'materials'),
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
    const commentsRef = collection(db, 'materials', materialId, 'comments');
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
          storage, 
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
    const commentsRef = collection(db, 'materials', commentData.materialId, 'comments');
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
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

export async function deleteComment(materialId: string, commentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'materials', materialId, 'comments', commentId));
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

    const notificationsRef = collection(db, 'users', notificationData.userId, 'notifications');
    
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

export async function getCommentNotifications(userId: string): Promise<CommentNotification[]> {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    
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
    const notificationsRef = collection(db, 'users', userId, 'notifications');
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
    await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), {
      isRead: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const querySnapshot = await getDocs(
      query(notificationsRef, where('isRead', '==', false))
    );
    
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}