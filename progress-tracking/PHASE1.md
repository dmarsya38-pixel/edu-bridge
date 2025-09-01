# PHASE 1: Foundation & Authentication

**Duration:** Weeks 1-3  
**Priority:** Critical Infrastructure  
**Status:** Planning  
**Last Updated:** August 27, 2025

---

## **Phase Overview**

Establish secure authentication system with Politeknik-specific student verification, implement role-based access control, and set up proper project structure.

---

## **Updated Requirements**

### **Student ID (Matric ID) Format: `23DBS23F1001`**

*Added: August 27, 2025*

**Format Breakdown:**

- `23` - Politeknik number (23 = Politeknik Nilai)
- `DBS` - Program code (DBS = Diploma in Business Studies, etc.)
- `23` - Year of entry (2023)
- `F1` - Session (F1 = Session 1, F2 = Session 2)
- `001` - Sequential student number

**Validation Rules:**

- Must be exactly 11 characters
- First 2 digits: `23` (Politeknik Nilai only)
- Characters 3-5: Program code (3 letters)
- Characters 6-7: Entry year (2 digits)
- Characters 8-9: Session (`F1` or `F2`)
- Last 3 digits: Student number (`001`-`999`)

**Supported Programs (Commerce Department):**

- `DBS` - Diploma in Business Studies
- `DAC` - Diploma in Accountancy  
- `DEC` - Diploma in E-Commerce
- *(Add more as needed)*

---

## **Technical Implementation**

### **Student ID Validation Function**

```typescript
interface MatricValidation {
  isValid: boolean;
  politeknik: string;
  program: string;
  entryYear: string;
  session: string;
  studentNumber: string;
}

export function validateMatricId(matricId: string): MatricValidation {
  // Pattern: 23DBS23F1001
  const pattern = /^(23)([A-Z]{3})(\d{2})([F][12])(\d{3})$/;
  const match = matricId.match(pattern);

  if (!match) {
    return { isValid: false, politeknik: '', program: '', entryYear: '', session: '', studentNumber: '' };
  }

  const [, politeknik, program, year, session, number] = match;

  // Validate program is Commerce Department
  const validPrograms = ['DBS', 'DAC', 'DEC'];
  if (!validPrograms.includes(program)) {
    return { isValid: false, politeknik: '', program: '', entryYear: '', session: '', studentNumber: '' };
  }

  return {
    isValid: true,
    politeknik: politeknik === '23' ? 'Politeknik Nilai' : 'Unknown',
    program,
    entryYear: `20${year}`,
    session: session === 'F1' ? 'Session 1' : 'Session 2',
    studentNumber: number
  };
}
```

---

## **Week-by-Week Breakdown**

### **Week 1: Basic Authentication Setup**

**Goals:**

- Firebase Authentication integration
- Basic registration/login forms
- User data structure

**Deliverables:**

- [ ] Firebase Auth configuration
- [ ] User registration form with matric ID validation
- [ ] Login/logout functionality
- [ ] Basic user profile structure

**User Data Model:**

```typescript
interface User {
  uid: string;
  email: string;
  matricId: string;
  name: string;
  role: 'student' | 'lecturer' | 'admin';
  politeknik: string;    // "Politeknik Nilai"
  program: string;       // "DBS", "DAC", etc.
  entryYear: string;     // "2023"
  session: string;       // "Session 1" or "Session 2"
  studentNumber: string; // "001"
  isVerified: boolean;
  createdAt: timestamp;
  lastLogin: timestamp;
}
```

**Technical Tasks:**

- [ ] Set up Firebase project configuration
- [ ] Create registration form with matric ID input
- [ ] Implement matric ID validation function
- [ ] Create Firestore user document structure
- [ ] Add email verification flow

---

### **Week 2: Role-Based Access Control**

**Goals:**

- Role-based routing system
- Protected routes middleware
- User dashboard structure

**Deliverables:**

- [ ] Role-based dashboard routing
- [ ] Protected route middleware
- [ ] Student/Lecturer/Admin dashboards
- [ ] Navigation based on user role

**Role Definitions:**

- **Student:** Access materials, join study groups, comment
- **Lecturer:** Upload materials, moderate discussions, verify content
- **Admin:** Full system access, user management, content approval

**Technical Tasks:**

- [ ] Create role-based route protection
- [ ] Build user context/provider
- [ ] Design dashboard layouts for each role
- [ ] Implement role-specific navigation
- [ ] Add authorization hooks

---

### **Week 3: Enhanced Registration & Verification**

**Goals:**

- Complete student verification system
- Institution validation
- Profile completion workflow

**Deliverables:**

- [ ] Student verification process
- [ ] Admin approval workflow
- [ ] Profile completion steps
- [ ] Email verification integration

**Verification Workflow:**

1. Student registers with matric ID
2. System validates matric ID format
3. Email verification sent
4. Admin reviews and approves/rejects
5. Student gains full access

**Technical Tasks:**

- [ ] Build admin user management interface
- [ ] Create verification status tracking
- [ ] Add email notification system
- [ ] Implement profile completion wizard
- [ ] Create user status indicators

---

## **Updated Firebase Collections**

### **Users Collection**

```
users/{userId}
├── matricId: "23DBS23F1001"
├── email: "student@example.com"
├── name: "Ahmad Rahman"
├── role: "student"
├── politeknik: "Politeknik Nilai"
├── program: "DBS"
├── entryYear: "2023"
├── session: "Session 1"
├── studentNumber: "001"
├── isVerified: false
├── verificationStatus: "pending" | "approved" | "rejected"
├── createdAt: timestamp
└── profile: {
    ├── phone?: string
    ├── avatar?: string
    └── preferences: {}
   }
```

---

## **Security Rules**

### **Firebase Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Admin can read all users
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Only verified users can access other collections
    match /{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isVerified == true;
    }
  }
}
```

---

## **UI Components Needed**

### **Registration Form**

- [ ] Matric ID input with real-time validation
- [ ] Email and password fields
- [ ] Full name input
- [ ] Terms and conditions checkbox
- [ ] Registration success/error states

### **Login Form**

- [ ] Email/password login
- [ ] Remember me option
- [ ] Forgot password link
- [ ] Login error handling

### **User Dashboard**

- [ ] Welcome message with user info
- [ ] Navigation based on role
- [ ] Verification status indicator
- [ ] Quick access to main features

---

## **Testing Requirements**

### **Unit Tests**

- [ ] Matric ID validation function
- [ ] User role checks
- [ ] Form validation logic

### **Integration Tests**

- [ ] Registration flow end-to-end
- [ ] Login/logout functionality
- [ ] Role-based routing

---

## **Potential Challenges & Solutions**

### **Challenge 1: Invalid Matric IDs**

**Solution:** Clear error messages with format examples

### **Challenge 2: Program Code Updates**

**Solution:** Make program validation configurable in Firestore

### **Challenge 3: Session Timing**

**Solution:** Add academic year context to validation

---

## **Next Phase Dependencies**

**What Phase 2 Needs from Phase 1:**

- [ ] Authenticated user context
- [ ] User role verification
- [ ] Student program information for content filtering
- [ ] Verified user status for content access

---

## **Success Criteria**

- [ ] Students can register with valid matric IDs only
- [ ] Role-based access control working
- [ ] Admin can approve/reject registrations
- [ ] All authentication flows are mobile-responsive
- [ ] Security rules prevent unauthorized access
- [ ] Error handling covers all edge cases

---

*This document will be updated as new requirements emerge during Phase 1 development.*