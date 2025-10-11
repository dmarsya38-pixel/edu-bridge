/**
 * Fix existing lecturer profiles with correct programme names
 * This script updates lecturers who have "Unknown Programme" in their programName field
 */

import { 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';
import { getDb } from './firebase';

/**
 * Update existing lecturer profiles with correct programme names
 */
export async function fixLecturerProgrammeNames() {
  try {
    console.log('🔧 Starting lecturer programme name fix...');
    
    if (!getDb()) {
      throw new Error('Firestore is not initialized');
    }

    // Get all lecturer users with "Unknown Programme" or missing programme data
    const usersCollection = collection(getDb(), 'users');
    const lecturerQuery = query(
      usersCollection, 
      where('role', '==', 'lecturer')
    );
    
    const lecturerSnapshot = await getDocs(lecturerQuery);
    console.log(`📊 Found ${lecturerSnapshot.size} lecturer profiles to check`);
    
    // Get all programmes for reference
    const programmesCollection = collection(getDb(), 'programmes');
    const programmesSnapshot = await getDocs(programmesCollection);
    const programmes = programmesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{id: string; programmeId?: string; programmeCode?: string; programmeName?: string}>;
    
    console.log(`📚 Loaded ${programmes.length} programmes for reference`);
    
    let updateCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each lecturer
    for (const lecturerDoc of lecturerSnapshot.docs) {
      const lecturerData = lecturerDoc.data();
      const lecturerId = lecturerDoc.id;
      
      try {
        // Skip if already has correct programme name
        if (lecturerData.programName && lecturerData.programName !== 'Unknown Programme') {
          skippedCount++;
          continue;
        }
        
        console.log(`🔍 Processing lecturer: ${lecturerData.fullName || lecturerId}`);
        console.log('Current data:', {
          programmeName: lecturerData.programName,
          programmes: lecturerData.programmes,
          program: lecturerData.program
        });
        
        // Find programme name from programmes array
        let programmeName = 'Unknown Programme';
        
        if (lecturerData.programmes && lecturerData.programmes.length > 0) {
          // Primary: Use programmes array
          const programmeCode = lecturerData.programmes[0];
          const programme = programmes.find(p => 
            p.programmeId === programmeCode || p.programmeCode === programmeCode
          );
          
          if (programme && programme.programmeName) {
            programmeName = programme.programmeName;
            console.log(`✅ Found programme via programmes array: ${programmeName}`);
          }
        } else if (lecturerData.program && lecturerData.program !== 'N/A') {
          // Fallback: Use program field
          const programme = programmes.find(p => 
            p.programmeId === lecturerData.program || p.programmeCode === lecturerData.program
          );
          
          if (programme && programme.programmeName) {
            programmeName = programme.programmeName;
            console.log(`✅ Found programme via program field: ${programmeName}`);
          }
        }
        
        // Update the lecturer profile
        if (programmeName !== 'Unknown Programme') {
          await updateDoc(doc(getDb(), 'users', lecturerId), {
            programName: programmeName
          });
          
          console.log(`✅ Updated ${lecturerData.fullName}: ${programmeName}`);
          updateCount++;
        } else {
          console.log(`⚠️  Could not find programme for ${lecturerData.fullName}`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing lecturer ${lecturerId}:`, error);
        errorCount++;
      }
    }
    
    console.log('🎉 Fix completed!');
    console.log(`📈 Results:`);
    console.log(`  ✅ Updated: ${updateCount} lecturers`);
    console.log(`  ⏭️  Skipped: ${skippedCount} lecturers (already correct)`);
    console.log(`  ❌ Errors: ${errorCount} lecturers`);
    
    return {
      success: true,
      updated: updateCount,
      skipped: skippedCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    return {
      success: false,
      error: error
    };
  }
}

/**
 * Run the fix (can be called from admin dashboard or script)
 */
export async function runLecturerProgrammeFix() {
  console.log('🚀 Running lecturer programme name fix...');
  const result = await fixLecturerProgrammeNames();
  
  if (result.success) {
    console.log('✅ Fix completed successfully!');
  } else {
    console.error('❌ Fix failed:', result.error);
  }
  
  return result;
}