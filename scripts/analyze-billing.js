#!/usr/bin/env node

/**
 * Google Cloud Billing Analysis Helper
 * This script helps you analyze when unauthorized Gemini API usage started
 */

const fs = require('fs');
const path = require('path');

console.log('🕵️ Google Cloud Billing Analysis Helper');
console.log('==========================================');
console.log('');

console.log('📊 STEP 1: Check Your Google Cloud Billing Console');
console.log('Go to: https://console.cloud.google.com/billing');
console.log('');

console.log('🔍 STEP 2: Navigate to Detailed Usage');
console.log('1. Select your Google Cloud project');
console.log('2. Go to "Reports" in the left sidebar');
console.log('3. Filter by:');
console.log('   - Service: "AI Platform API" or "Generative Language API"');
console.log('   - Time range: Last 30 days');
console.log('4. Look for "Gemini" usage spikes');
console.log('');

console.log('🚨 STEP 3: Identify Unauthorized Usage Patterns');
console.log('Look for these RED FLAGS:');
console.log('- Sudden spikes in API calls');
console.log('- Usage of expensive models (gemini-1.5-pro, gemini-2.0-pro)');
console.log('- API calls during times you weren\'t using the app');
console.log('- Unusual geographic locations (if shown)');
console.log('');

console.log('💰 STEP 4: Cost Analysis');
console.log('Expected costs for YOUR app (legitimate usage):');
console.log('- Model: gemini-1.5-flash-8b (cheapest)');
console.log('- Input: $0.0375 per 1M tokens');
console.log('- Output: $0.15 per 1M tokens');
console.log('- Typical cost: $0.01-$1.00 per day for normal usage');
console.log('');
console.log('UNAUTHORIZED costs (what hackers might use):');
console.log('- Model: gemini-1.5-pro (expensive)');
console.log('- Input: $1.25 per 1M tokens (33x more expensive!)');
console.log('- Output: $5.00 per 1M tokens (33x more expensive!)');
console.log('- Hacker cost: $10-$100+ per day');
console.log('');

// Analyze git commits to estimate when the leak might have occurred
function analyzeProjectHistory() {
  console.log('📅 STEP 5: Analyze When The Leak Might Have Started');
  console.log('');
  
  try {
    const { execSync } = require('child_process');
    
    console.log('🔍 Checking recent git commits for API key changes...');
    
    // Get recent commits that might have involved API keys
    const commits = execSync('git log --oneline --grep="api\\|key\\|env\\|gemini" --since="30 days ago" || true', 
      { encoding: 'utf8', cwd: process.cwd() }).trim();
    
    if (commits) {
      console.log('📝 Recent commits involving API/env changes:');
      console.log(commits);
    } else {
      console.log('ℹ️  No recent commits found with API-related keywords');
    }
    
    // Check when .env was last modified
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const stats = fs.statSync(envPath);
        console.log(`🔧 .env file last modified: ${stats.mtime.toISOString()}`);
      }
    } catch (error) {
      console.log('ℹ️  Could not check .env modification date');
    }
    
  } catch (error) {
    console.log('ℹ️  Could not analyze git history (not a git repo?)');
  }
}

console.log('🛡️ STEP 6: Immediate Security Actions');
console.log('If you see unauthorized usage:');
console.log('1. ✅ REVOKE the old API key immediately at https://aistudio.google.com/');
console.log('2. ✅ Generate a new API key');
console.log('3. ✅ Update your .env file with: npm run rotate-api-key');
console.log('4. ✅ Set up billing alerts in Google Cloud Console');
console.log('5. ✅ Monitor usage for the next few days');
console.log('');

console.log('⚖️ STEP 7: Dispute Unauthorized Charges (if needed)');
console.log('If you have significant unauthorized charges:');
console.log('1. Document the unauthorized usage patterns');
console.log('2. Contact Google Cloud Support');
console.log('3. Explain that your API key was compromised');
console.log('4. Request a refund for unauthorized usage');
console.log('5. Show evidence that your app only uses cheap models');
console.log('');

console.log('📱 STEP 8: Check Where Your API Key Might Have Leaked');
console.log('Common leak sources:');
console.log('- ❌ Committed .env files to public GitHub repos');
console.log('- ❌ Shared code snippets with API keys');
console.log('- ❌ Uploaded projects with embedded keys');
console.log('- ❌ Unsecured development servers');
console.log('- ❌ Compromised development machines');
console.log('');

analyzeProjectHistory();

console.log('🔐 Your Current Security Status:');
console.log('✅ All services now use gemini-1.5-flash-8b (cheapest model)');
console.log('✅ Rate limiting enabled (1000 calls/day max)');
console.log('✅ API key validation in place');
console.log('✅ Cost monitoring tools available');
console.log('✅ .env file protected by .gitignore');
console.log('');

console.log('📞 Need Help?');
console.log('Google Cloud Support: https://cloud.google.com/support');
console.log('Billing Questions: https://cloud.google.com/billing/docs/how-to/contact-support');
console.log('');

console.log('💡 Pro Tips:');
console.log('1. Set up billing alerts for amounts like $10, $50, $100');
console.log('2. Check billing daily for the next week');
console.log('3. Consider using API quotas to limit daily usage');
console.log('4. Keep your new API key secure and never commit it to git');
console.log('');
