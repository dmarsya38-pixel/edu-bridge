/**
 * Admin script to fix lecturer programme names
 * Run this script once to update existing lecturer profiles
 */

import { runLecturerProgrammeFix } from './fix-lecturer-programmes';

// Auto-run the fix when this script is imported/executed
console.log('🔧 Starting lecturer programme name fix script...');

runLecturerProgrammeFix().then((result) => {
  if (result.success) {
    console.log('🎉 Script completed successfully!');
    console.log('📊 Summary:', result);
  } else {
    console.error('❌ Script failed:', result.error);
  }
  
  // Exit the process
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script crashed:', error);
  process.exit(1);
});

export { runLecturerProgrammeFix };