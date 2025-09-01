# PHASE 2: Academic Content Management

**Duration:** Weeks 4-6  
**Priority:** Core Business Logic  
**Status:** Planning  
**Dependencies:** Phase 1 Authentication System ✅ Complete

---

## **Phase Overview**

Build the core academic content management system that allows students and lecturers to upload, organize, and access educational materials. Implement the complete Firebase data structure with file storage, content categorization, and admin approval workflows.

---

## **🎯 Core Goals**

1. **Academic Resource Management** - Complete CRUD for materials (Notes, Exam Papers, Answer Schemes)
2. **File Upload/Download System** - Firebase Storage integration with validation
3. **Content Organization** - Programme → Semester → Subject hierarchy
4. **Lecturer Account Management** - Registration and content upload permissions
5. **Admin Oversight** - Content approval and quality control system

---

## **📋 Deliverables**

### **Week 1: Data Structure & Lecturer Registration**

- [ ] Firebase Firestore collections setup
- [ ] Lecturer registration system
- [ ] Programme/Semester/Subject hierarchy
- [ ] Admin approval workflow for lecturers

### **Week 2: File Management System**

- [ ] Firebase Storage integration
- [ ] File upload components with validation
- [ ] File download system with access control
- [ ] Material categorization (Notes/Exam Papers/Answer Schemes)

### **Week 3: Content Discovery & Admin Panel**

- [ ] Browse/search materials by subject
- [ ] Admin content management dashboard
- [ ] Content approval workflow
- [ ] Mobile-optimized content viewing

---

## **🗂️ Database Structure Implementation**

Based on the Firebase ERD, we'll implement this Firestore structure:

### **1. Programmes Collection**

```typescript
// Collection: programmes
interface Programme {
  programmeId: string;        // "DBS", "DAC", "DEC"
  programmeCode: string;      // "DBS"
  programmeName: string;      // "Diploma in Business Studies"
  department: string;         // "Commerce"
  isActive: boolean;
  createdAt: Timestamp;
}
```

### **2. Subjects Collection**

```typescript
// Collection: subjects
interface Subject {
  subjectId: string;          // "DBS1013"
  subjectCode: string;        // "DBS1013"
  subjectName: string;        // "Marketing Basics"
  programmeId: string;        // "DBS"
  semester: number;           // 1, 2, 3, 4, 5
  creditHours: number;        // 3
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
}
```

### **3. Materials Collection**

```typescript
// Collection: materials
interface Material {
  materialId: string;
  title: string;
  description?: string;
  materialType: 'note' | 'exam_paper' | 'answer_scheme';

  // File information
  fileName: string;
  fileSize: number;           // in bytes
  fileType: string;           // "application/pdf", "image/jpeg", etc.
  downloadURL: string;        // Firebase Storage URL

  // Organization
  subjectId: string;          // "DBS1013"
  programmeId: string;        // "DBS"
  semester: number;           // 3
  academicYear?: string;      // "2023/2024"

  // Upload information
  uploaderId: string;         // User who uploaded
  uploaderRole: 'student' | 'lecturer';
  uploadDate: Timestamp;

  // Approval workflow
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;        // Admin who approved
  approvedDate?: Timestamp;
  rejectionReason?: string;

  // Access control
  isPublic: boolean;
  accessLevel: 'student' | 'lecturer' | 'admin';

  // Engagement
  downloadCount: number;
  views: number;
  lastAccessed?: Timestamp;
}
```

### **4. Comments Collection**

```typescript
// Collection: comments
interface Comment {
  commentId: string;
  content: string;
  materialId: string;
  userId: string;
  userRole: 'student' | 'lecturer';
  commentDate: Timestamp;

  // Moderation
  isVisible: boolean;
  moderatedBy?: string;
  moderationDate?: Timestamp;

  // Threading (future)
  parentCommentId?: string;
  replies?: number;
}
```

---

## **👨‍🏫 Lecturer Registration System**

### **Lecturer Registration Flow**

```typescript
interface LecturerRegistrationData {
  // Identity
  employeeId: string;           // e.g., "L001234"
  fullName: string;
  email: string;                // Must be institutional email
  phoneNumber: string;

  // Institution info
  department: string;           // "Commerce"
  position: string;             // "Lecturer", "Senior Lecturer"
  subjectsTeaching: string[];   // ["DBS1013", "DBS2023"]

  // Verification
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;          // Admin who approved
  approvalDate?: Timestamp;
  rejectionReason?: string;

  // System
  role: 'lecturer';
  registrationDate: Timestamp;
}
```

### **Lecturer Approval Workflow**

1. **Lecturer submits registration** with employee ID and institutional email
2. **Admin receives notification** of pending lecturer registration
3. **Admin verifies credentials** against institutional records
4. **Admin approves/rejects** with optional comments
5. **Email notification** sent to lecturer about decision
6. **Approved lecturers** gain upload and moderation permissions

---

## **📁 File Management System**

### **Firebase Storage Structure**

```
/materials/
  /{programmeId}/           # DBS, DAC, DEC
    /{semester}/            # 1, 2, 3, 4, 5
      /{subjectId}/         # DBS1013, DAC2024
        /notes/
          /{materialId}.pdf
        /exam_papers/
          /{materialId}.pdf
        /answer_schemes/
          /{materialId}.pdf
```

### **File Upload Validation**

```typescript
interface FileUploadRules {
  allowedTypes: ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
  maxFileSize: 10 * 1024 * 1024; // 10MB
  requiresApproval: {
    student: true;    // Students uploads need approval
    lecturer: false;  // Lecturers auto-approved
    admin: false;     // Admins auto-approved
  };
  virusScanning: boolean;
}
```

### **Upload Process Flow**

1. **User selects file** and fills metadata form
2. **Client-side validation** (file type, size)
3. **Upload to Firebase Storage** with progress indicator
4. **Create material document** in Firestore
5. **Set approval status** based on user role
6. **Send notification** to admin if approval needed
7. **Email confirmation** to uploader

---

## **🔍 Content Discovery System**

### **Browse/Search Interface**

```typescript
interface MaterialFilter {
  programmeId?: string;     // Filter by programme
  semester?: number;        // Filter by semester
  subjectId?: string;       // Filter by subject
  materialType?: 'note' | 'exam_paper' | 'answer_scheme';
  academicYear?: string;    // Filter by academic year
  approvalStatus?: 'approved' | 'pending';
  uploaderId?: string;      // Filter by uploader
  searchQuery?: string;     // Text search in title/description
}
```

### **Search Functionality**

- **Text search** in material titles and descriptions
- **Filter by programme** (DBS, DAC, DEC)
- **Filter by semester** (1-5)
- **Filter by material type** (Notes, Exam Papers, Answer Schemes)
- **Sort options** (newest, most downloaded, most viewed)
- **Tag system** for enhanced categorization

---

## **🏛️ Admin Management Dashboard**

### **Admin Overview Panel**

```typescript
interface AdminDashboardStats {
  totalMaterials: number;
  pendingApprovals: number;
  totalDownloads: number;
  activeUsers: number;
  recentUploads: Material[];
  flaggedContent: Material[];
  lecturerApprovals: LecturerRegistrationData[];
}
```

### **Content Moderation Tools**

- **Bulk approve/reject** materials
- **Content flagging** system
- **User activity monitoring**
- **Download analytics**
- **Storage usage tracking**
- **Lecturer approval workflow**

---

## **📱 Mobile Optimization**

### **Responsive Design Features**

- **Touch-friendly** file upload interface
- **Swipe navigation** for browsing materials
- **Mobile-optimized** PDF viewer
- **Offline reading** capability (future)
- **Push notifications** for new materials
- **Quick search** with voice input

---

## **🔐 Security & Permissions**

### **Firebase Security Rules Update**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Materials - read access for approved content
    match /materials/{materialId} {
      allow read: if request.auth != null && 
        resource.data.approvalStatus == 'approved' &&
        isAuthorizedForContent();

      allow create: if request.auth != null && 
        isValidUploader();

      allow update: if request.auth != null && 
        (isOwner() || isAdmin());

      allow delete: if request.auth != null && 
        (isOwner() || isAdmin());
    }

    // Subjects - readable by all authenticated users
    match /subjects/{subjectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }

    // Programmes - readable by all authenticated users
    match /programmes/{programmeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }
  }
}
```

### **File Storage Security Rules**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /materials/{allPaths=**} {
      allow read: if request.auth != null && 
        isApprovedMaterial();

      allow write: if request.auth != null && 
        validUploadPermissions();
    }
  }
}
```

---

## **🧩 Component Architecture**

### **New Components to Build**

#### **1. File Upload Components**

- `MaterialUploadForm.tsx` - Complete upload form with metadata
- `FileUploadDropzone.tsx` - Drag & drop file upload
- `UploadProgress.tsx` - Upload progress indicator
- `FilePreview.tsx` - Preview uploaded files before submission

#### **2. Content Discovery Components**

- `MaterialBrowser.tsx` - Main browsing interface
- `MaterialFilter.tsx` - Filter sidebar/panel
- `MaterialCard.tsx` - Individual material display card
- `MaterialList.tsx` - List view of materials
- `SearchBar.tsx` - Search input with suggestions

#### **3. Admin Components**

- `AdminDashboard.tsx` - Main admin overview
- `PendingApprovals.tsx` - List of materials awaiting approval
- `LecturerApprovalQueue.tsx` - Lecturer registration approvals
- `ContentModeration.tsx` - Content moderation tools
- `AnalyticsDashboard.tsx` - Usage statistics and analytics

#### **4. Lecturer Components**

- `LecturerRegistration.tsx` - Lecturer registration form
- `LecturerDashboard.tsx` - Lecturer-specific dashboard
- `MyUploads.tsx` - Lecturer's uploaded materials management

---

## **🔄 API & Utilities**

### **New Utility Functions**

```typescript
// File management utilities
export async function uploadMaterial(file: File, metadata: MaterialMetadata): Promise<string>
export async function downloadMaterial(materialId: string): Promise<string>
export async function deleteMaterial(materialId: string): Promise<void>

// Content discovery utilities  
export async function searchMaterials(filters: MaterialFilter): Promise<Material[]>
export async function getMaterialsBySubject(subjectId: string): Promise<Material[]>
export async function getFeaturedMaterials(): Promise<Material[]>

// Admin utilities
export async function approveMaterial(materialId: string, adminId: string): Promise<void>
export async function rejectMaterial(materialId: string, reason: string): Promise<void>
export async function approveLecturer(lecturerId: string, adminId: string): Promise<void>

// Analytics utilities
export async function trackDownload(materialId: string, userId: string): Promise<void>
export async function getDownloadStats(materialId: string): Promise<DownloadStats>
export async function getUserActivity(userId: string): Promise<UserActivity[]>
```

---

## **🧪 Testing Strategy**

### **Unit Tests**

- [ ] File upload validation
- [ ] Material search and filtering
- [ ] User permission checks
- [ ] Firebase security rules
- [ ] File type detection and validation

### **Integration Tests**

- [ ] Complete upload workflow
- [ ] Admin approval process
- [ ] Lecturer registration flow
- [ ] Content discovery functionality
- [ ] Cross-device compatibility

### **Performance Tests**

- [ ] Large file upload handling
- [ ] Concurrent user uploads
- [ ] Search performance with large datasets
- [ ] Mobile performance optimization

---

## **📊 Success Metrics**

### **Functional Requirements**

- [ ] ✅ Students can upload materials (pending approval)
- [ ] ✅ Lecturers can upload materials (auto-approved)
- [ ] ✅ Users can browse materials by programme/semester/subject
- [ ] ✅ Search functionality works across all material metadata
- [ ] ✅ Admin can approve/reject content efficiently
- [ ] ✅ File storage is secure and organized
- [ ] ✅ Mobile interface is fully functional

### **Performance Requirements**

- [ ] ✅ File uploads complete within 30 seconds (10MB files)
- [ ] ✅ Search results load within 2 seconds
- [ ] ✅ Mobile interface loads within 3 seconds
- [ ] ✅ Supports 100+ concurrent users
- [ ] ✅ 99.9% uptime for content access

### **Security Requirements**

- [ ] ✅ Only approved content is publicly accessible
- [ ] ✅ File uploads are virus-scanned
- [ ] ✅ User permissions are properly enforced
- [ ] ✅ Sensitive data is properly encrypted
- [ ] ✅ Audit logs track all admin actions

---

## **🚀 Phase 2 Dependencies**

### **From Phase 1 (Ready)**

- ✅ User authentication system
- ✅ Role-based access control
- ✅ Firebase project setup
- ✅ Tailwind design system
- ✅ TypeScript configuration

### **External Requirements**

- [ ] **Firebase Storage** - Enable and configure
- [ ] **Institutional Data** - Programme and subject codes
- [ ] **Admin Account** - Create first admin user
- [ ] **Storage Quotas** - Configure Firebase storage limits
- [ ] **Email Templates** - For approval notifications

---

## **⚠️ Critical Implementation Notes**

### **Missing Features from Original Proposal**

Based on the design analysis report, we must include:

1. **Answer Schemes as Distinct Entity** - Separate from general materials
2. **Content Quality Control** - Multi-level approval process
3. **File Storage Architecture** - Proper organization and access control
4. **Mobile-Specific Flows** - Touch-optimized interface design

### **Phase 3 Preparation**

Phase 2 should prepare the foundation for:

- **Discussion Forums** (Phase 3)
- **Study Groups** (Phase 3) 
- **Advanced Search** (Phase 4)
- **Analytics Dashboard** (Phase 4)

---

## **📅 Week-by-Week Breakdown**

### **Week 1: Foundation & Lecturer System**

**Days 1-2:** Firebase collections setup + data models
**Days 3-4:** Lecturer registration system
**Days 5-7:** Programme/Subject hierarchy + Admin approval workflow

### **Week 2: File Management Core**

**Days 1-2:** Firebase Storage integration + upload components
**Days 3-4:** File validation + download system
**Days 5-7:** Material categorization + metadata management

### **Week 3: Discovery & Admin Tools**

**Days 1-2:** Browse/search interface
**Days 3-4:** Admin dashboard + approval tools
**Days 5-7:** Mobile optimization + testing

---

**🎯 Phase 2 Goal: Complete academic content management system ready for Phase 3 interactive features.**