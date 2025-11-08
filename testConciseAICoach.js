// Test script for the new concise AI coaching feature
import { nutritionCoachService } from './services/nutritionCoachService.js';

const testUser = {
  id: 'test-user',
  calorie_goal: 2000,
  age: 30,
  gender: 'male',
  activity_level: 'moderate'
};

const mockWeeklyData = [
  { date: '2024-11-01', calories: 1800, protein: 80, carbs: 220, fat: 70, sugar: 60, sodium: 2500, mealCount: 3 },
  { date: '2024-11-02', calories: 2200, protein: 90, carbs: 280, fat: 85, sugar: 45, sodium: 2800, mealCount: 4 },
  { date: '2024-11-03', calories: 1950, protein: 75, carbs: 240, fat: 75, sugar: 55, sodium: 2400, mealCount: 3 },
  { date: '2024-11-04', calories: 2100, protein: 85, carbs: 260, fat: 80, sugar: 50, sodium: 2600, mealCount: 4 },
  { date: '2024-11-05', calories: 1750, protein: 70, carbs: 200, fat: 65, sugar: 40, sodium: 2200, mealCount: 3 },
  { date: '2024-11-06', calories: 2300, protein: 95, carbs: 290, fat: 90, sugar: 65, sodium: 2900, mealCount: 4 },
  { date: '2024-11-07', calories: 2050, protein: 80, carbs: 250, fat: 78, sugar: 48, sodium: 2500, mealCount: 3 }
];

async function testConciseCoaching() {
  console.log('🧪 Testing concise AI coaching...');
  
  try {
    const result = await nutritionCoachService.generateWeeklyCoachingInsight(testUser, mockWeeklyData);
    console.log('✅ AI Coaching Result:', JSON.stringify(result, null, 2));
    
    if (result.success && result.insight && result.insight.suggestion) {
      console.log('💡 Suggestion:', result.insight.suggestion);
    } else {
      console.log('❌ No suggestion received');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test fallback
function testFallback() {
  console.log('🧪 Testing fallback suggestion...');
  const fallbackResult = nutritionCoachService.getFallbackInsight(mockWeeklyData);
  console.log('✅ Fallback Result:', JSON.stringify(fallbackResult, null, 2));
}

console.log('Starting AI Coach tests...');
testFallback();
// testConciseCoaching(); // Uncomment to test actual API call
