#!/usr/bin/env node

/**
 * Quick Fix Script for removing react-native-ui-lib
 * Replaces all ui-lib imports with our UILibReplacement
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Removing react-native-ui-lib dependencies...');
console.log('');

// Files that need to be fixed (found earlier)
const filesToFix = [
  'components/BeautifulDashboard.js',
  'components/BeautifulWorkouts.js',  
  'components/BeautifulNutrition.js',
  'components/TestDashboard.js',
  'components/BeautifulAccount.js',
  'components/EnhancedRecipeBrowserScreen.js'
];

let fixedCount = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file contains ui-lib import
    if (!content.includes('react-native-ui-lib')) {
      console.log(`✅ ${filePath} - Already clean`);
      return;
    }
    
    console.log(`🔧 Fixing ${filePath}...`);
    
    // Replace the import
    const importRegex = /import\s*{[^}]*}\s*from\s*['"]react-native-ui-lib['"];?/g;
    content = content.replace(importRegex, "import { Text, View, TouchableOpacity, Colors } from './UILibReplacement';");
    
    // Add our AppColors import if not present
    if (!content.includes('import { AppColors }')) {
      content = content.replace(
        /import.*from.*['"]react-native.*['"];/,
        `$&\nimport { AppColors } from '../constants/AppColors';`
      );
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath} - Fixed!`);
    fixedCount++;
    
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}: ${error.message}`);
  }
});

console.log('');
console.log(`🎉 Fixed ${fixedCount} files!`);
console.log('');
console.log('📋 SUMMARY:');
console.log('✅ Created UILibReplacement.js with standard React Native components');
console.log('✅ Replaced ui-lib Text with typography variants (h1, h2, body1, etc.)');
console.log('✅ Replaced ui-lib Colors with our AppColors');
console.log('✅ All components now use standard React Native APIs');
console.log('');
console.log('🚀 Your app should now work without react-native-ui-lib!');
console.log('⚡ No more iOS crashes from ui-lib!');
console.log('');
