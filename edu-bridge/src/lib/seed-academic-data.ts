import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Initial programmes data
const INITIAL_PROGRAMMES = [
  {
    programmeCode: 'DBS',
    programmeName: 'Diploma in Business Information System',
    department: 'Commerce',
    isActive: true
  },
  {
    programmeCode: 'DRM',
    programmeName: 'Diploma in Retail Management',
    department: 'Commerce',
    isActive: true
  },
  {
    programmeCode: 'DIB',
    programmeName: 'Diploma in Islamic Banking',
    department: 'Commerce',
    isActive: true
  },
  {
    programmeCode: 'DIF',
    programmeName: 'Diploma in Islamic Finance',
    department: 'Commerce',
    isActive: true
  },
  {
    programmeCode: 'DLS',
    programmeName: 'Diploma in Logistics Supply Chain',
    department: 'Commerce',
    isActive: true
  },
  {
    programmeCode: 'DISCIPLINE CORE',
    programmeName: 'All Diploma',
    department: 'Commerce',
    isActive: true
  }
];

// Sample subjects data (basic structure for each programme)
const INITIAL_SUBJECTS = [
  // DBS Programme
  {
    subjectCode: 'DPB10033',
    subjectName: 'BUSINESS ACCOUNTING',
    programmeId: 'DBS',
    semester: 1,
    creditHours: 3,
    description: 'Introduction to international business concepts and practices',
    isActive: true
  },
  {
    subjectCode: 'DPB10053',
    subjectName: 'MICROECONMICS',
    programmeId: 'DBS',
    semester: 1,
    creditHours: 3,
    description: 'Fundamental concepts of marketing and business strategies',
    isActive: true
  },
  {
    subjectCode: 'DPM20033',
    subjectName: 'FUNDAMENTALS OF MARKETING',
    programmeId: 'DBS',
    semester: 1,
    creditHours: 4,
    description: 'Information systems in business environments',
    isActive: true
  },
  {
    subjectCode: 'DPB20042',
    subjectName: 'MANAGEMENT INFORMATION SYSTEM',
    programmeId: 'DBS',
    semester: 2,
    creditHours: 3,
    description: 'Database design, implementation and management',
    isActive: true
  },
  {
   subjectCode: 'DPB20073',
    subjectName: 'MACROECONOMICS',
    programmeId: 'DBS',
    semester: 2,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },
   {
   subjectCode: 'DPB20093',
    subjectName: 'BUSINESS MATHEMATICS',
    programmeId: 'DBS',
    semester: 2,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },
  {
   subjectCode:'DPB30063',
    subjectName: 'INTRODUCTION TO HUMAN RECOURCES',
    programmeId: 'DBS',
    semester: 2,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },
  {
   subjectCode:'DPB30093',
    subjectName: 'QUANTITATIVE METHODS',
    programmeId: 'DBS',
    semester: 3,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },  
  {
   subjectCode:'DPB40103',
    subjectName: 'DIGITAL ENTREPRENEURSHIP',
    programmeId: 'DBS',
    semester: 3,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },  
  {
   subjectCode:'DPB40143',
    subjectName: 'ORGANIZATIONAL BEHAVIOR',
    programmeId: 'DBS',
    semester: 4,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },  
  {
   subjectCode:'DPB40123',
    subjectName: 'BUSINESS FINANCE',
    programmeId: 'DBS',
    semester: 4,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },  
  {
   subjectCode:'DPB10063',
    subjectName: 'PRINCIPLE OF MANAGEMENT',
    programmeId: 'DBS',
    semester: 4,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },
  {
   subjectCode:'DPB40133',
    subjectName: 'BUSINESS PROCESS MANAGEMENT',
    programmeId: 'DBS',
    semester: 5,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },
  {
   subjectCode:'DPB40113',
    subjectName: 'BUSINESS ETHICS',
    programmeId: 'DBS',
    semester: 5,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },
  {
   subjectCode:'DPP20023',
    subjectName: 'INTRODUCTION TO INTERNATIONAL BUSINESS',
    programmeId: 'DBS',
    semester: 5,
    creditHours: 3,
    description: 'EQUATIONS',
    isActive: true
  },

  // DRM Programme
  {
    subjectCode: 'DRM2022',
    subjectName: 'MERCHANDISING AND BUYING',
    programmeId: 'DRM',
    semester: 2,
    creditHours: 3,
    description: 'Merchandise planning and buying strategies',
    isActive: true
  },
  {
    subjectCode: 'DRM3033',
    subjectName: 'RETAIL ANALYTICS',
    programmeId: 'DRM',
    semester: 3,
    creditHours: 4,
    description: 'Data analytics for retail business decisions',
    isActive: true
  },
  
  // DIB Programme
  {
    subjectCode: 'DIB1014',
    subjectName: 'ISLAMIC BANKING PRINCIPLES',
    programmeId: 'DIB',
    semester: 1,
    creditHours: 3,
    description: 'Fundamental principles and concepts of Islamic banking',
    isActive: true
  },
  {
    subjectCode: 'DIB2025',
    subjectName: 'SHARIAH COMPLIANCE',
    programmeId: 'DIB',
    semester: 2,
    creditHours: 3,
    description: 'Shariah compliance in Islamic banking operations',
    isActive: true
  },

  // DIF Programme
  {
    subjectCode: 'DIF1016',
    subjectName: 'ISLAMIC FINANCE FOUNDATIONS',
    programmeId: 'DIF',
    semester: 1,
    creditHours: 3,
    description: 'Basic concepts of Islamic finance and investment',
    isActive: true
  },
  {
    subjectCode: 'DIF2027',
    subjectName: 'TAKAFUL AND ISLAMIC INSURANCE',
    programmeId: 'DIF',
    semester: 2,
    creditHours: 3,
    description: 'Islamic insurance principles and applications',
    isActive: true
  },

  // DLS Programme
  {
    subjectCode: 'DLS1018',
    subjectName: 'SUPPLY CHAIN MANAGEMENT',
    programmeId: 'DLS',
    semester: 1,
    creditHours: 3,
    description: 'Introduction to supply chain and logistics management',
    isActive: true
  },
  {
    subjectCode: 'DLS2029',
    subjectName: 'WAREHOUSE OPERATIONS',
    programmeId: 'DLS',
    semester: 2,
    creditHours: 3,
    description: 'Warehouse management and operations',
    isActive: true
  },
  {
    subjectCode: 'DLS3030',
    subjectName: 'TRANSPORTATION LOGISTICS',
    programmeId: 'DLS',
    semester: 3,
    creditHours: 4,
    description: 'Transportation planning and logistics optimization',
    isActive: true
  }
];

export async function seedProgrammes(): Promise<void> {
  try {
    console.log('Seeding programmes...');
    
    for (const programme of INITIAL_PROGRAMMES) {
      const programmeData = {
        ...programme,
        programmeId: programme.programmeCode,
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'programmes', programme.programmeCode), programmeData);
      console.log(`✓ Created programme: ${programme.programmeCode} - ${programme.programmeName}`);
    }
    
    console.log('✅ Programmes seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding programmes:', error);
    throw error;
  }
}

export async function seedSubjects(): Promise<void> {
  try {
    console.log('Seeding subjects...');
    
    for (const subject of INITIAL_SUBJECTS) {
      const subjectData = {
        ...subject,
        subjectId: subject.subjectCode,
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'subjects', subject.subjectCode), subjectData);
      console.log(`✓ Created subject: ${subject.subjectCode} - ${subject.subjectName}`);
    }
    
    console.log('✅ Subjects seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding subjects:', error);
    throw error;
  }
}

export async function seedAllAcademicData(): Promise<void> {
  try {
    console.log('🌱 Starting academic data seeding...');
    
    await seedProgrammes();
    await seedSubjects();
    
    console.log('🎉 All academic data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding academic data:', error);
    throw error;
  }
}