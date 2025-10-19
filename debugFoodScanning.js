/**
 * Debug script to test food scanning functionality
 * This will help identify why food scanning is returning generic results
 */

import { foodAnalysisService } from './foodAnalysisService.js';

async function debugFoodScanning() {
  console.log('🔍 Starting food scanning debug...');
  
  // Test 1: Check API key availability
  console.log('\n1. 🔑 API Key Test:');
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  console.log({
    hasKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    keyStart: apiKey ? apiKey.substring(0, 8) + '***' : 'NONE',
    platform: require('react-native').Platform.OS,
    isDev: __DEV__
  });
  
  // Test 2: Test text-based analysis (should work)
  console.log('\n2. 🧪 Testing text analysis:');
  try {
    const textResult = await foodAnalysisService.analyzeFoodText('grilled chicken breast with broccoli');
    console.log('Text analysis result:', {
      success: textResult.success,
      predictionsCount: textResult.predictions?.length || 0,
      source: textResult.source,
      firstPrediction: textResult.predictions?.[0]?.name || 'None'
    });
  } catch (error) {
    console.error('❌ Text analysis failed:', error.message);
  }
  
  // Test 3: Check the Gemini API URL construction
  console.log('\n3. 🌐 API URL Test:');
  try {
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey ? 'PRESENT' : 'MISSING'}`;
    console.log('API URL format looks correct:', testUrl.includes('generativelanguage.googleapis.com'));
  } catch (error) {
    console.error('❌ API URL construction failed:', error.message);
  }
  
  // Test 4: Check database lookups
  console.log('\n4. 📊 Database Lookup Test:');
  const testFoods = ['chicken breast', 'apple', 'broccoli'];
  testFoods.forEach(food => {
    const nutritionInfo = foodAnalysisService.checkNutritionDatabase(food);
    console.log(`${food}: ${nutritionInfo ? 'Found' : 'Not found'} in database`);
  });
  
  // Test 5: Test fallback behavior
  console.log('\n5. 🎯 Fallback Test:');
  const fallbacks = foodAnalysisService.getTimeBasedFallbacks();
  console.log('Fallback predictions:', fallbacks.map(f => f.name));
  
  console.log('\n✅ Debug test complete');
}

// Export for use in development
export { debugFoodScanning };

// Auto-run if in development
if (__DEV__) {
  console.log('🚀 Auto-running food scanning debug in development mode...');
  debugFoodScanning().catch(console.error);
}
