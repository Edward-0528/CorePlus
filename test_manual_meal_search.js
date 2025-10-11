/**
 * Simple test for manual meal entry search functionality
 * This can be called from anywhere in the app to test search
 */

import { foodAnalysisService } from './foodAnalysisService';

export const testManualMealEntry = async (searchTerm = 'chicken breast') => {
  console.log('🧪 Testing manual meal entry search functionality...');
  console.log('🔍 Testing search term:', searchTerm);
  
  // Test API key availability at runtime
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  console.log('🔑 API Key check:', {
    hasKey: !!apiKey,
    keyLength: apiKey ? apiKey.length : 0,
    firstChars: apiKey ? apiKey.substring(0, 8) + '...' : 'N/A',
    platform: require('react-native').Platform.OS,
    isDev: __DEV__
  });
  
  try {
    // Test the same function that FoodSearchModal uses
    const result = await foodAnalysisService.analyzeFoodText(searchTerm);
    
    console.log('📊 Search result:', {
      success: result.success,
      predictionsCount: result.predictions?.length || 0,
      source: result.source,
      hasError: !!result.error,
      error: result.error
    });
    
    if (result.success && result.predictions && result.predictions.length > 0) {
      const firstPrediction = result.predictions[0];
      console.log('✅ Search working! First prediction:', {
        name: firstPrediction.name,
        calories: firstPrediction.calories,
        confidence: firstPrediction.confidence,
        source: result.source
      });
      
      // Check if it's using AI (has good confidence) or fallback
      const isUsingAI = result.source === 'text-analysis' || firstPrediction.confidence > 0.7;
      return { 
        success: true, 
        working: true, 
        usingAI: isUsingAI,
        source: result.source
      };
    } else {
      console.warn('⚠️ Search returned no results');
      return { success: false, working: false, reason: 'No predictions returned' };
    }
    
  } catch (error) {
    console.error('❌ Search test failed:', error.message);
    return { success: false, working: false, reason: error.message };
  }
};

// Export for easy testing in development
if (__DEV__) {
  // Auto-test in development with delay to ensure app is fully loaded
  setTimeout(() => {
    testManualMealEntry().then(result => {
      console.log('🧪 Development auto-test result:', result);
      if (!result.working) {
        console.error('🚨 Search functionality is not working properly in development!');
      } else if (!result.usingAI) {
        console.warn('⚠️ Search is working but using fallback data, not AI');
      } else {
        console.log('✅ Search functionality working perfectly with AI!');
      }
    });
  }, 3000);
}
