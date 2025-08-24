/**
 * Performance Test Utility for Workout Screen Optimizations
 * 
 * This utility helps measure and compare the performance improvements
 * achieved through caching and lazy loading in the WorkoutScreen.
 */

import { workoutService } from '../services/workoutService';
import { workoutCacheService } from '../services/workoutCacheService';

class PerformanceTest {
  constructor() {
    this.results = [];
  }

  /**
   * Measure the time taken for a function to complete
   */
  async measureTime(testName, testFunction, iterations = 1) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        await testFunction();
        const endTime = Date.now();
        const duration = endTime - startTime;
        results.push(duration);
      } catch (error) {
        console.error(`Error in test ${testName}:`, error);
        results.push(null);
      }
    }

    const validResults = results.filter(r => r !== null);
    const avgTime = validResults.length > 0 ? 
      validResults.reduce((sum, time) => sum + time, 0) / validResults.length : 0;

    const result = {
      testName,
      avgTime,
      results: validResults,
      iterations,
      successRate: (validResults.length / iterations) * 100
    };

    this.results.push(result);
    return result;
  }

  /**
   * Test workout data loading without cache
   */
  async testWithoutCache() {
    console.log('🚀 Testing workout data loading WITHOUT cache...');
    
    await this.measureTime('Load Stats (No Cache)', async () => {
      await workoutService.getUserWorkoutStats(false);
    }, 3);

    await this.measureTime('Load Today\'s Workouts (No Cache)', async () => {
      await workoutService.getTodaysWorkouts(false);
    }, 3);

    await this.measureTime('Load Workout History (No Cache)', async () => {
      await workoutService.getWorkoutHistory(20, false);
    }, 3);

    await this.measureTime('Load All Data (No Cache)', async () => {
      await Promise.all([
        workoutService.getUserWorkoutStats(false),
        workoutService.getTodaysWorkouts(false),
        workoutService.getWorkoutHistory(20, false)
      ]);
    }, 3);
  }

  /**
   * Test workout data loading with cache (first time - cache miss)
   */
  async testWithCacheFirstLoad() {
    console.log('📋 Testing workout data loading WITH cache (first load)...');
    
    // Clear cache first
    await workoutCacheService.clearAll();
    
    await this.measureTime('Load Stats (Cache Miss)', async () => {
      await workoutService.getUserWorkoutStats(true);
    }, 3);

    await this.measureTime('Load Today\'s Workouts (Cache Miss)', async () => {
      await workoutService.getTodaysWorkouts(true);
    }, 3);

    await this.measureTime('Load Workout History (Cache Miss)', async () => {
      await workoutService.getWorkoutHistory(20, true);
    }, 3);
  }

  /**
   * Test workout data loading with cache (subsequent loads - cache hit)
   */
  async testWithCacheSubsequentLoad() {
    console.log('⚡ Testing workout data loading WITH cache (subsequent loads)...');
    
    await this.measureTime('Load Stats (Cache Hit)', async () => {
      await workoutService.getUserWorkoutStats(true);
    }, 5);

    await this.measureTime('Load Today\'s Workouts (Cache Hit)', async () => {
      await workoutService.getTodaysWorkouts(true);
    }, 5);

    await this.measureTime('Load Workout History (Cache Hit)', async () => {
      await workoutService.getWorkoutHistory(20, true);
    }, 5);

    await this.measureTime('Load All Data (Cache Hit)', async () => {
      await Promise.all([
        workoutService.getUserWorkoutStats(true),
        workoutService.getTodaysWorkouts(true),
        workoutService.getWorkoutHistory(20, true)
      ]);
    }, 5);
  }

  /**
   * Test the complete WorkoutScreen loading simulation
   */
  async testWorkoutScreenSimulation() {
    console.log('📱 Testing complete WorkoutScreen loading simulation...');
    
    // Simulate first visit (no cache)
    await workoutCacheService.clearAll();
    await this.measureTime('WorkoutScreen First Visit', async () => {
      // Simulate the exact loading pattern from WorkoutsScreen
      const [statsResult, todayResult] = await Promise.all([
        workoutService.getUserWorkoutStats(true),
        workoutService.getTodaysWorkouts(true)
      ]);
      
      // Simulate deferred history loading
      setTimeout(async () => {
        await workoutService.getWorkoutHistory(20, true);
      }, 100);
    }, 3);

    // Simulate subsequent visits (with cache)
    await this.measureTime('WorkoutScreen Subsequent Visit', async () => {
      const [statsResult, todayResult] = await Promise.all([
        workoutService.getUserWorkoutStats(true),
        workoutService.getTodaysWorkouts(true)
      ]);
      
      setTimeout(async () => {
        await workoutService.getWorkoutHistory(20, true);
      }, 100);
    }, 5);
  }

  /**
   * Run all performance tests
   */
  async runAllTests() {
    console.log('🧪 Starting WorkoutScreen Performance Tests...\n');
    
    const startTime = Date.now();
    
    try {
      await this.testWithoutCache();
      await this.testWithCacheFirstLoad();
      await this.testWithCacheSubsequentLoad();
      await this.testWorkoutScreenSimulation();
    } catch (error) {
      console.error('Error running performance tests:', error);
    }
    
    const totalTime = Date.now() - startTime;
    this.printResults(totalTime);
  }

  /**
   * Print test results in a formatted way
   */
  printResults(totalTestTime) {
    console.log('\n📊 PERFORMANCE TEST RESULTS');
    console.log('='.repeat(50));
    
    const groupedResults = this.groupResultsByCategory();
    
    Object.entries(groupedResults).forEach(([category, tests]) => {
      console.log(`\n${category.toUpperCase()}:`);
      console.log('-'.repeat(30));
      
      tests.forEach(test => {
        const avgTimeFormatted = test.avgTime.toFixed(0);
        const status = test.successRate === 100 ? '✅' : '⚠️';
        console.log(`${status} ${test.testName}: ${avgTimeFormatted}ms (${test.successRate}% success)`);
      });
    });

    // Performance improvement analysis
    this.analyzePerformanceGains();
    
    console.log(`\n⏱️  Total test time: ${totalTestTime}ms`);
    console.log('='.repeat(50));
  }

  /**
   * Group results by category for better readability
   */
  groupResultsByCategory() {
    const groups = {
      'Without Cache': [],
      'With Cache (First Load)': [],
      'With Cache (Subsequent)': [],
      'WorkoutScreen Simulation': []
    };

    this.results.forEach(result => {
      if (result.testName.includes('No Cache')) {
        groups['Without Cache'].push(result);
      } else if (result.testName.includes('Cache Miss')) {
        groups['With Cache (First Load)'].push(result);
      } else if (result.testName.includes('Cache Hit')) {
        groups['With Cache (Subsequent)'].push(result);
      } else if (result.testName.includes('WorkoutScreen')) {
        groups['WorkoutScreen Simulation'].push(result);
      }
    });

    return groups;
  }

  /**
   * Analyze performance improvements
   */
  analyzePerformanceGains() {
    const noCacheAll = this.results.find(r => r.testName === 'Load All Data (No Cache)');
    const cacheHitAll = this.results.find(r => r.testName === 'Load All Data (Cache Hit)');
    
    if (noCacheAll && cacheHitAll) {
      const improvement = ((noCacheAll.avgTime - cacheHitAll.avgTime) / noCacheAll.avgTime) * 100;
      console.log(`\n🚀 PERFORMANCE IMPROVEMENTS:`);
      console.log(`📈 Cache provides ${improvement.toFixed(1)}% faster loading`);
      console.log(`⚡ Time saved: ${(noCacheAll.avgTime - cacheHitAll.avgTime).toFixed(0)}ms per load`);
    }

    const firstVisit = this.results.find(r => r.testName === 'WorkoutScreen First Visit');
    const subsequentVisit = this.results.find(r => r.testName === 'WorkoutScreen Subsequent Visit');
    
    if (firstVisit && subsequentVisit) {
      const screenImprovement = ((firstVisit.avgTime - subsequentVisit.avgTime) / firstVisit.avgTime) * 100;
      console.log(`📱 WorkoutScreen loads ${screenImprovement.toFixed(1)}% faster on repeat visits`);
    }
  }

  /**
   * Clear all test results
   */
  clear() {
    this.results = [];
  }
}

// Export singleton instance
export const performanceTest = new PerformanceTest();

// Export for manual testing
export default PerformanceTest;
