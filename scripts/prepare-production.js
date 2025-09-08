#!/usr/bin/env node

/**
 * Production preparation script for Core+
 * This script fixes common issues that cause crashes in production builds
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Core+ for production build...');

// 1. Check if google-services.json exists
const googleServicesPath = path.join(__dirname, '../android/app/google-services.json');
const googleServicesTemplatePath = path.join(__dirname, '../android/app/google-services.json.template');

if (!fs.existsSync(googleServicesPath)) {
  console.log('⚠️ google-services.json not found. Creating from template...');
  
  if (fs.existsSync(googleServicesTemplatePath)) {
    // For now, we'll comment out the google services requirement in app.json
    console.log('📝 You need to configure Google Services properly.');
    console.log('   Either:');
    console.log('   1. Add your real google-services.json file to android/app/');
    console.log('   2. Remove the googleServicesFile requirement from app.json');
  }
}

// 2. Check environment variables
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️ .env file not found. This might cause crashes in production.');
  console.log('   Make sure all required environment variables are set.');
}

// 3. Create a production-safe app.json (temporarily remove google services)
const appJsonPath = path.join(__dirname, '../app.json');
const appJsonBackupPath = path.join(__dirname, '../app.json.backup');

if (fs.existsSync(appJsonPath)) {
  console.log('📝 Creating production-safe app.json...');
  
  // Backup original
  fs.copyFileSync(appJsonPath, appJsonBackupPath);
  
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Remove google services requirement temporarily to prevent crashes
  if (appJson.expo.android.googleServicesFile) {
    console.log('⚠️ Temporarily removing googleServicesFile to prevent crashes...');
    delete appJson.expo.android.googleServicesFile;
  }
  
  // Write production version
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('✅ Production app.json created (backup saved as app.json.backup)');
}

// 4. Check for console statements in critical files
const criticalFiles = [
  '../App.js',
  '../components/LoadingScreen.js',
  '../services/supabaseConfig.js'
];

console.log('🔍 Checking for console statements that might cause crashes...');
criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const consoleMatches = content.match(/console\.(log|error|warn|info)/g);
    if (consoleMatches) {
      console.log(`⚠️ Found ${consoleMatches.length} console statements in ${file}`);
    }
  }
});

console.log('\n🎯 Production preparation complete!');
console.log('\nNext steps:');
console.log('1. Run: eas build --platform android --profile production');
console.log('2. Test the build before submitting to Play Store');
console.log('3. If successful, restore app.json.backup after build');
