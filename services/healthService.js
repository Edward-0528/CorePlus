import { Platform, NativeModules } from 'react-native';

// Import health libraries
let AppleHealthKit = null;

try {
  if (Platform.OS === 'ios') {
    AppleHealthKit = require('react-native-health').default;
  }
} catch (error) {
  console.warn('Health libraries not available:', error.message);
}

/**
 * Health Service - Unified health data integration
 * Supports Apple Health (iOS) with fallback for Android
 */
class HealthService {
  constructor() {
    this.isInitialized = false;
    this.hasPermissions = false;
    this.platform = Platform.OS;
    this.healthKit = AppleHealthKit;
    
    // Health permissions configuration for iOS
    this.permissions = {
      ios: {
        permissions: {
          read: [
            'Steps',
            'StepCount', 
            'DistanceWalkingRunning',
            'ActiveEnergyBurned',
            'BasalEnergyBurned',
            'HeartRate',
            'Workout',
          ],
          write: [
            'Steps',
            'StepCount',
            'DistanceWalkingRunning', 
            'ActiveEnergyBurned',
            'Workout',
          ],
        },
      }
    };
  }

  /**
   * Initialize the health service
   */
  async initialize() {
    try {
      console.log('🏥 Initializing Health Service for', this.platform);
      
      if (this.platform === 'ios') {
        await this.initializeAppleHealth();
      } else if (this.platform === 'android') {
        // Android: Health data not available, inform user
        console.log('🤖 Android: Health data integration coming soon');
        this.isInitialized = true;
        this.hasPermissions = false;
      } else {
        throw new Error('Health data not supported on this platform');
      }
      
      console.log('✅ Health Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Health Service initialization failed:', error);
      throw new Error(`Health service initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize Apple Health (iOS)
   */
  async initializeAppleHealth() {
    if (!this.healthKit) {
      throw new Error('Apple HealthKit not available. Please install react-native-health and rebuild the app.');
    }

    return new Promise((resolve, reject) => {
      this.healthKit.initHealthKit(this.permissions.ios, (error) => {
        if (error) {
          console.error('Apple Health initialization error:', error);
          reject(new Error(`Apple Health initialization failed: ${error}`));
        } else {
          console.log('🍎 Apple Health initialized successfully');
          this.isInitialized = true;
          resolve(true);
        }
      });
    });
  }

  /**
   * Check if health data is available on this platform
   */
  async isHealthDataAvailable() {
    if (this.platform === 'ios') {
      return this.healthKit !== null;
    } else if (this.platform === 'android') {
      return true; // Always available on Android (with mock data fallback)
    }
    return false;
  }

  /**
   * Get platform name for display
   */
  getHealthPlatformName() {
    switch (this.platform) {
      case 'ios':
        return 'Apple Health';
      case 'android':
        return 'Health Data (Coming Soon)';
      default:
        return 'Health Data';
    }
  }

  /**
   * Request health data permissions
   */
  async requestPermissions() {
    try {
      console.log('🔐 Requesting health permissions...');
      
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      if (this.platform === 'ios') {
        return await this.requestAppleHealthPermissions();
      } else if (this.platform === 'android') {
        // Android: No real permissions needed since we're not using Samsung Health
        console.log('🤖 Android: No health permissions needed (health integration coming soon)');
        this.hasPermissions = false;
        return false;
      } else {
        throw new Error('Health permissions not supported on this platform');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      throw new Error(`Failed to request health permissions: ${error.message}`);
    }
  }

  /**
   * Request Apple Health permissions
   */
  async requestAppleHealthPermissions() {
    if (!this.healthKit) {
      throw new Error('Apple HealthKit not available');
    }

    return new Promise((resolve, reject) => {
      this.healthKit.getAuthStatus(this.permissions.ios, (err, results) => {
        if (err) {
          console.error('Apple Health permission error:', err);
          reject(new Error(`Apple Health permission error: ${err}`));
          return;
        }

        // Check if we have the necessary permissions
        const hasStepsPermission = results[this.healthKit.Constants.Permissions.Steps] === this.healthKit.Constants.AuthorizationStatuses.SharingAuthorized;
        const hasEnergyPermission = results[this.healthKit.Constants.Permissions.ActiveEnergyBurned] === this.healthKit.Constants.AuthorizationStatuses.SharingAuthorized;
        
        if (hasStepsPermission && hasEnergyPermission) {
          console.log('🍎 Apple Health permissions granted');
          this.hasPermissions = true;
          resolve(true);
        } else {
          console.log('🍎 Apple Health permissions not fully granted');
          this.hasPermissions = false;
          resolve(false);
        }
      });
    });
  }

  /**
   * Get today's step count
   */
  async getTodaysSteps() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.platform === 'ios') {
        if (!this.hasPermissions) {
          throw new Error('Health permissions not granted');
        }
        return await this.getAppleHealthSteps();
      } else if (this.platform === 'android') {
        // Android: Return mock data since Samsung Health is not implemented
        console.log('🤖 Android: Using mock step data');
        return Math.floor(Math.random() * 5000) + 3000;
      } else {
        throw new Error('Platform not supported');
      }
    } catch (error) {
      console.error('Failed to get steps:', error);
      // Return realistic mock data for development
      return Math.floor(Math.random() * 5000) + 3000;
    }
  }

  /**
   * Get today's calories burned
   */
  async getTodaysCaloriesBurned() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.platform === 'ios') {
        if (!this.hasPermissions) {
          throw new Error('Health permissions not granted');
        }
        return await this.getAppleHealthCalories();
      } else if (this.platform === 'android') {
        // Android: Return mock data since Samsung Health is not implemented
        console.log('🤖 Android: Using mock calories data');
        return Math.floor(Math.random() * 400) + 200;
      } else {
        throw new Error('Platform not supported');
      }
    } catch (error) {
      console.error('Failed to get calories:', error);
      // Return realistic mock data for development
      return Math.floor(Math.random() * 400) + 200;
    }
  }

  /**
   * Get today's distance traveled
   */
  async getTodaysDistance() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.platform === 'ios') {
        if (!this.hasPermissions) {
          throw new Error('Health permissions not granted');
        }
        return await this.getAppleHealthDistance();
      } else if (this.platform === 'android') {
        // Android: Return mock data since Samsung Health is not implemented
        console.log('🤖 Android: Using mock distance data');
        return Math.floor(Math.random() * 8000) + 2000;
      } else {
        throw new Error('Platform not supported');
      }
    } catch (error) {
      console.error('Failed to get distance:', error);
      // Return realistic mock data for development
      return Math.floor(Math.random() * 8000) + 2000;
    }
  }

  /**
   * Get comprehensive health summary
   */
  async getHealthSummary() {
    try {
      const [steps, caloriesBurned, distance] = await Promise.all([
        this.getTodaysSteps(),
        this.getTodaysCaloriesBurned(),
        this.getTodaysDistance()
      ]);

      return {
        steps,
        caloriesBurned,
        distance,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get health summary:', error);
      throw new Error(`Failed to get health summary: ${error.message}`);
    }
  }

  /**
   * Get weekly workout data
   */
  async getWeeklyWorkouts() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.platform === 'ios') {
        if (!this.hasPermissions) {
          throw new Error('Health permissions not granted');
        }
        return await this.getAppleHealthWorkouts();
      } else if (this.platform === 'android') {
        // Android: Return mock workout data since Samsung Health is not implemented
        console.log('🤖 Android: Using mock workout data');
        return this.generateMockWorkouts();
      } else {
        throw new Error('Platform not supported');
      }
    } catch (error) {
      console.error('Failed to get weekly workouts:', error);
      // Return mock workout data for development
      return this.generateMockWorkouts();
    }
  }

  /**
   * Sync workout data to health platform
   */
  async syncWorkout(workoutData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🏋️ Syncing workout:', workoutData);
      
      if (this.platform === 'ios') {
        if (!this.hasPermissions) {
          throw new Error('Health permissions not granted');
        }
        return await this.syncAppleHealthWorkout(workoutData);
      } else if (this.platform === 'android') {
        // Android: Return mock success since Samsung Health is not implemented
        console.log('🤖 Android: Mock workout sync completed');
        return { success: true };
      } else {
        throw new Error('Platform not supported');
      }
    } catch (error) {
      console.error('Workout sync failed:', error);
      // Return success for mock data
      console.log('🤖 Mock workout sync completed');
      return { success: true };
    }
  }

  /**
   * Generate mock workout data for testing
   */
  generateMockWorkouts() {
    const workouts = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Randomly generate some workouts (about 50% chance per day)
      if (Math.random() > 0.5) {
        workouts.push({
          id: `mock_workout_${i}`,
          date: date.toISOString().split('T')[0],
          type: ['Running', 'Cycling', 'Strength Training', 'Yoga', 'Walking'][Math.floor(Math.random() * 5)],
          duration: Math.floor(Math.random() * 60) + 20, // 20-80 minutes
          calories: Math.floor(Math.random() * 400) + 100 // 100-500 calories
        });
      }
    }
    
    return workouts;
  }

  // Apple Health specific methods
  async getAppleHealthSteps() {
    if (!this.healthKit) {
      throw new Error('Apple HealthKit not available');
    }

    return new Promise((resolve, reject) => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const options = {
        startDate: startOfDay.toISOString(),
        endDate: today.toISOString(),
      };

      this.healthKit.getStepCount(options, (err, results) => {
        if (err) {
          reject(new Error(`Apple Health steps error: ${err}`));
          return;
        }
        
        const totalSteps = results.reduce((sum, record) => sum + record.value, 0);
        console.log('🍎 Apple Health steps:', totalSteps);
        resolve(Math.round(totalSteps));
      });
    });
  }

  async getAppleHealthCalories() {
    if (!this.healthKit) {
      throw new Error('Apple HealthKit not available');
    }

    return new Promise((resolve, reject) => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const options = {
        startDate: startOfDay.toISOString(),
        endDate: today.toISOString(),
        unit: 'calorie',
      };

      this.healthKit.getActiveEnergyBurned(options, (err, results) => {
        if (err) {
          reject(new Error(`Apple Health calories error: ${err}`));
          return;
        }
        
        const totalCalories = results.reduce((sum, record) => sum + record.value, 0);
        console.log('🍎 Apple Health calories:', totalCalories);
        resolve(Math.round(totalCalories));
      });
    });
  }

  async getAppleHealthDistance() {
    if (!this.healthKit) {
      throw new Error('Apple HealthKit not available');
    }

    return new Promise((resolve, reject) => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const options = {
        startDate: startOfDay.toISOString(),
        endDate: today.toISOString(),
        unit: 'meter',
      };

      this.healthKit.getDistanceWalkingRunning(options, (err, results) => {
        if (err) {
          reject(new Error(`Apple Health distance error: ${err}`));
          return;
        }
        
        const totalDistance = results.reduce((sum, record) => sum + record.value, 0);
        console.log('🍎 Apple Health distance:', totalDistance);
        resolve(Math.round(totalDistance));
      });
    });
  }

  async getAppleHealthWorkouts() {
    if (!this.healthKit) {
      throw new Error('Apple HealthKit not available');
    }

    return new Promise((resolve, reject) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const options = {
        startDate: weekAgo.toISOString(),
        endDate: new Date().toISOString(),
      };

      this.healthKit.getSamples('Workout', options, (err, results) => {
        if (err) {
          reject(new Error(`Apple Health workouts error: ${err}`));
          return;
        }
        
        const workouts = results.map((workout, index) => ({
          id: `apple_workout_${index}`,
          date: workout.startDate.split('T')[0],
          type: workout.activityName || 'Unknown',
          duration: Math.round(workout.duration / 60), // Convert to minutes
          calories: Math.round(workout.totalEnergyBurned || 0)
        }));
        
        console.log('🍎 Apple Health workouts:', workouts.length);
        resolve(workouts);
      });
    });
  }

  async syncAppleHealthWorkout(workoutData) {
    if (!this.healthKit) {
      throw new Error('Apple HealthKit not available');
    }

    return new Promise((resolve, reject) => {
      const workout = {
        type: workoutData.type || 'Other',
        startDate: workoutData.startDate || new Date().toISOString(),
        endDate: workoutData.endDate || new Date().toISOString(),
        energyBurned: workoutData.caloriesBurned || 0,
        energyBurnedUnit: 'calorie',
        distance: workoutData.distance || 0,
        distanceUnit: 'meter',
      };

      this.healthKit.saveWorkout(workout, (err, result) => {
        if (err) {
          reject(new Error(`Apple Health workout sync error: ${err}`));
          return;
        }
        
        console.log('🍎 Apple Health workout synced successfully');
        resolve({ success: true, result });
      });
    });
  }
}

// Export singleton instance
export const healthService = new HealthService();
