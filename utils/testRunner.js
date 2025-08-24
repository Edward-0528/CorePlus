/**
 * WorkoutScreen Performance Test Runner
 * 
 * Run this file to test the performance improvements in your app.
 * 
 * Usage:
 * 1. Import this in your App.js or any component
 * 2. Call runWorkoutPerformanceTest() when you want to test
 * 3. Check the console for detailed results
 */

import { performanceTest } from './performanceTest';

/**
 * Quick test function to run performance tests
 */
export const runWorkoutPerformanceTest = async () => {
  console.log('🔥 Starting WorkoutScreen Performance Analysis...');
  
  try {
    await performanceTest.runAllTests();
    
    console.log('\n✨ Performance testing completed!');
    console.log('Check the results above to see the improvements from caching and lazy loading.');
    
    return true;
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return false;
  }
};

/**
 * Quick cache performance demo
 */
export const quickCacheDemo = async () => {
  console.log('⚡ Quick Cache Performance Demo');
  console.log('Testing how much faster subsequent loads are...\n');
  
  const { workoutService } = require('../services/workoutService');
  const { workoutCacheService } = require('../services/workoutCacheService');
  
  try {
    // Clear cache
    await workoutCacheService.clearAll();
    
    // First load (no cache)
    console.log('📥 First load (building cache)...');
    const start1 = Date.now();
    await workoutService.getUserWorkoutStats(true);
    const firstLoad = Date.now() - start1;
    
    // Second load (from cache)
    console.log('⚡ Second load (from cache)...');
    const start2 = Date.now();
    await workoutService.getUserWorkoutStats(true);
    const secondLoad = Date.now() - start2;
    
    // Results
    const improvement = ((firstLoad - secondLoad) / firstLoad) * 100;
    console.log(`\n📊 RESULTS:`);
    console.log(`First load:  ${firstLoad}ms`);
    console.log(`Second load: ${secondLoad}ms`);
    console.log(`Improvement: ${improvement.toFixed(1)}% faster! 🚀`);
    
    return { firstLoad, secondLoad, improvement };
  } catch (error) {
    console.error('Demo failed:', error);
    return null;
  }
};

// Example usage comment
/*
// Add this to your App.js or any component to test:

import { runWorkoutPerformanceTest, quickCacheDemo } from './utils/testRunner';

// Then call it somewhere (like in a useEffect or button press):
// runWorkoutPerformanceTest();
// or
// quickCacheDemo();
*/
