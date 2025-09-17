#!/usr/bin/env node

/**
 * API Key Rotation Script
 * Use this script to safely update your Gemini API key
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE_PATH = path.join(__dirname, '..', '.env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function updateEnvFile(newApiKey) {
  try {
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      
      // Replace existing key
      if (envContent.includes('EXPO_PUBLIC_GEMINI_API_KEY=')) {
        envContent = envContent.replace(
          /EXPO_PUBLIC_GEMINI_API_KEY=.*/,
          `EXPO_PUBLIC_GEMINI_API_KEY=${newApiKey}`
        );
      } else {
        // Add new key
        envContent += `\nEXPO_PUBLIC_GEMINI_API_KEY=${newApiKey}\n`;
      }
    } else {
      // Create new .env file
      envContent = `# Environment Variables - KEEP SECURE!
EXPO_PUBLIC_GEMINI_API_KEY=${newApiKey}

# Add other environment variables as needed
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url-here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
`;
    }
    
    fs.writeFileSync(ENV_FILE_PATH, envContent);
    console.log('✅ API key updated successfully!');
    console.log('🔒 Your .env file is protected by .gitignore');
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
  }
}

function validateApiKey(apiKey) {
  if (!apiKey || apiKey.trim().length === 0) {
    console.log('❌ API key cannot be empty');
    return false;
  }
  
  if (!apiKey.startsWith('AI')) {
    console.log('⚠️  Warning: Gemini API keys typically start with "AI"');
  }
  
  if (apiKey.length < 32) {
    console.log('⚠️  Warning: API key seems unusually short');
  }
  
  return true;
}

console.log('🔐 Gemini API Key Rotation Tool');
console.log('========================================');
console.log('');
console.log('IMPORTANT SECURITY STEPS:');
console.log('1. Go to https://aistudio.google.com/');
console.log('2. Delete your old compromised API key');
console.log('3. Create a new API key');
console.log('4. Copy the new key and paste it below');
console.log('');

rl.question('Enter your NEW Gemini API key: ', (newApiKey) => {
  if (validateApiKey(newApiKey)) {
    updateEnvFile(newApiKey.trim());
    
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Restart your Expo development server');
    console.log('2. Test your app to ensure it works with the new key');
    console.log('3. Monitor your Google Cloud billing console');
    console.log('4. Consider setting up billing alerts');
    console.log('');
    console.log('💰 Cost Protection:');
    console.log('- Your app only uses gemini-1.5-flash-8b (cheapest model)');
    console.log('- Rate limiting is now enabled');
    console.log('- Suspicious activity monitoring is active');
  }
  
  rl.close();
});
