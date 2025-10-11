/**
 * Debug script to test search functionality in production builds
 * This script will help diagnose the search issues between development and production
 */

import { foodAnalysisService } from './foodAnalysisService';
import { foodSearchService } from './services/foodSearchService';

const testSearchFunctionality = async () => {
  console.log('🔍 Starting search functionality debug test...');
  
  try {
    // Test 1: Check API key availability
    console.log('\n1. Testing API key configuration...');
    const hasApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ? '✅ Present' : '❌ Missing';
    console.log(`Gemini API Key: ${hasApiKey}`);
    
    // Test 2: Test simple food search
    console.log('\n2. Testing simple food search...');
    try {
      const searchResult = await foodSearchService.searchFood('chicken breast');
      console.log('✅ Food search result:', {
        success: searchResult.success,
        hasFood: !!searchResult.food,
        fallback: searchResult.fallback
      });
    } catch (error) {
      console.error('❌ Food search failed:', error.message);
    }
    
    // Test 3: Test food suggestions
    console.log('\n3. Testing food suggestions...');
    try {
      const suggestionsResult = await foodSearchService.searchFoodSuggestions('pizza');
      console.log('✅ Food suggestions result:', {
        success: suggestionsResult.success,
        foodCount: suggestionsResult.foods?.length || 0,
        fallback: suggestionsResult.fallback
      });
    } catch (error) {
      console.error('❌ Food suggestions failed:', error.message);
    }
    
    // Test 4: Test enhanced food analysis
    console.log('\n4. Testing enhanced food analysis...');
    try {
      const analysisResult = await foodAnalysisService.analyzeFoodText('burger');
      console.log('✅ Food analysis result:', {
        success: analysisResult.success,
        predictions: analysisResult.predictions?.length || 0,
        source: analysisResult.source
      });
    } catch (error) {
      console.error('❌ Food analysis failed:', error.message);
    }
    
    // Test 5: Test network connectivity
    console.log('\n5. Testing network connectivity...');
    try {
      const response = await fetch('https://www.google.com', { method: 'HEAD' });
      console.log(`✅ Network test: ${response.ok ? 'Connected' : 'Issues detected'}`);
    } catch (error) {
      console.error('❌ Network test failed:', error.message);
    }
    
    console.log('\n🏁 Debug test completed!');
    
  } catch (error) {
    console.error('💥 Debug test crashed:', error);
  }
};

// Export for manual testing
export { testSearchFunctionality };

// Auto-run if in development
if (__DEV__) {
  console.log('🔧 Running search debug test in development mode...');
  testSearchFunctionality();
}
