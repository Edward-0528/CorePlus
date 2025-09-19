import { Platform } from 'react-native';

// Import HealthKit library
let HealthKit = null;
let HKQuantityTypeIdentifier = null;
let HKWorkoutActivityType = null;

try {
  if (Platform.OS === 'ios') {
    console.log('🔍 Attempting to load HealthKit library...');
    const healthKitModule = require('@kingstinct/react-native-healthkit');
    HealthKit = healthKitModule.default;
    HKQuantityTypeIdentifier = healthKitModule.HKQuantityTypeIdentifier;
    HKWorkoutActivityType = healthKitModule.HKWorkoutActivityType;
    console.log('✅ HealthKit library loaded successfully');
    console.log('🔍 HealthKit:', !!HealthKit);
    console.log('🔍 HKQuantityTypeIdentifier:', !!HKQuantityTypeIdentifier);
  }
} catch (error) {
  console.error('❌ HealthKit library not available:', error.message);
  console.log('💡 This usually means you need a development build on a physical device');
}

/**
 * Enhanced Health Service using @kingstinct/react-native-healthkit
 * Provides better integration with Apple Health data
 */
class NewHealthService {
  constructor() {
    this.isInitialized = false;
    this.hasPermissions = false;
    this.platform = Platform.OS;
    
    // Required permissions for reading health data
    this.readPermissions = [
      HKQuantityTypeIdentifier?.stepCount,
      HKQuantityTypeIdentifier?.activeEnergyBurned,
      HKQuantityTypeIdentifier?.basalEnergyBurned,
      HKQuantityTypeIdentifier?.distanceWalkingRunning,
      HKQuantityTypeIdentifier?.heartRate,
    ].filter(Boolean);

    // Optional write permissions
    this.writePermissions = [
      HKQuantityTypeIdentifier?.stepCount,
      HKQuantityTypeIdentifier?.activeEnergyBurned,
      HKQuantityTypeIdentifier?.distanceWalkingRunning,
    ].filter(Boolean);
  }

  /**
   * Initialize HealthKit and request permissions
   */
  async initialize() {
    if (this.platform !== 'ios') {
      console.warn('❌ HealthKit only available on iOS devices');
      return false;
    }

    if (!HealthKit) {
      console.warn('❌ HealthKit library not available - this requires a development build on a physical device');
      return false;
    }

    try {
      // Check if HealthKit is available on device
      const isAvailable = await HealthKit.isHealthDataAvailable();
      if (!isAvailable) {
        console.warn('❌ HealthKit data not available on this device (simulator not supported)');
        return false;
      }

      console.log('✅ HealthKit is available, requesting permissions...');

      // Request permissions using the new API
      const authStatus = await HealthKit.requestAuthorization([...this.readPermissions, ...this.writePermissions]);
      
      console.log('🔍 Authorization status:', authStatus);
      
      this.isInitialized = true;
      this.hasPermissions = true;
      
      console.log('✅ HealthKit initialized successfully with permissions');
      return true;
    } catch (error) {
      console.error('❌ HealthKit initialization failed:', error.message);
      
      // Provide specific error messages
      if (error.message.includes('not available')) {
        console.warn('💡 Tip: HealthKit requires a physical iOS device and a development build');
      }
      
      return false;
    }
  }

  /**
   * Check if the service is properly initialized
   */
  isReady() {
    return this.isInitialized && this.hasPermissions && this.platform === 'ios';
  }

  /**
   * Get today's step count from Apple Health
   */
  async getTodaySteps() {
    if (!this.isReady() || !HKQuantityTypeIdentifier?.stepCount) {
      return { steps: 0, isReal: false };
    }

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const samples = await HealthKit.querySamples(
        HKQuantityTypeIdentifier.stepCount,
        {
          from: startOfDay.toISOString(),
          to: endOfDay.toISOString(),
        }
      );

      // Sum up all step samples for today
      const totalSteps = samples.reduce((sum, sample) => sum + (sample.quantity || 0), 0);

      return {
        steps: Math.round(totalSteps),
        isReal: true,
        lastUpdated: new Date().toISOString(),
        source: 'Apple Health'
      };
    } catch (error) {
      console.error('❌ Failed to get step count:', error);
      return { steps: 0, isReal: false, error: error.message };
    }
  }

  /**
   * Get today's calories burned (active energy) from Apple Health
   */
  async getTodayCalories() {
    if (!this.isReady() || !HKQuantityTypeIdentifier?.activeEnergyBurned) {
      return { calories: 0, isReal: false };
    }

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const samples = await HealthKit.querySamples(
        HKQuantityTypeIdentifier.activeEnergyBurned,
        {
          from: startOfDay.toISOString(),
          to: endOfDay.toISOString(),
        }
      );

      // Sum up all calorie samples for today
      const totalCalories = samples.reduce((sum, sample) => sum + (sample.quantity || 0), 0);

      return {
        calories: Math.round(totalCalories),
        isReal: true,
        lastUpdated: new Date().toISOString(),
        source: 'Apple Health'
      };
    } catch (error) {
      console.error('❌ Failed to get calorie count:', error);
      return { calories: 0, isReal: false, error: error.message };
    }
  }

  /**
   * Get distance walked/run today from Apple Health
   */
  async getTodayDistance() {
    if (!this.isReady() || !HKQuantityTypeIdentifier?.distanceWalkingRunning) {
      return { distance: 0, unit: 'km', isReal: false };
    }

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const samples = await HealthKit.querySamples(
        HKQuantityTypeIdentifier.distanceWalkingRunning,
        {
          from: startOfDay.toISOString(),
          to: endOfDay.toISOString(),
        }
      );

      // Sum up all distance samples for today (in meters, convert to km)
      const totalDistance = samples.reduce((sum, sample) => sum + (sample.quantity || 0), 0);
      const distanceInKm = totalDistance / 1000;

      return {
        distance: Math.round(distanceInKm * 100) / 100, // Round to 2 decimal places
        unit: 'km',
        isReal: true,
        lastUpdated: new Date().toISOString(),
        source: 'Apple Health'
      };
    } catch (error) {
      console.error('❌ Failed to get distance:', error);
      return { distance: 0, unit: 'km', isReal: false, error: error.message };
    }
  }

  /**
   * Get current heart rate from Apple Health
   */
  async getCurrentHeartRate() {
    if (!this.isReady() || !HKQuantityTypeIdentifier?.heartRate) {
      return { heartRate: 0, isReal: false };
    }

    try {
      // Get heart rate from last hour
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const samples = await HealthKit.querySamples(
        HKQuantityTypeIdentifier.heartRate,
        {
          from: oneHourAgo.toISOString(),
          to: now.toISOString(),
          limit: 1,
          ascending: false, // Get most recent
        }
      );

      if (samples.length > 0) {
        return {
          heartRate: Math.round(samples[0].quantity),
          isReal: true,
          lastUpdated: samples[0].startDate,
          source: 'Apple Health'
        };
      }

      return { heartRate: 0, isReal: false };
    } catch (error) {
      console.error('❌ Failed to get heart rate:', error);
      return { heartRate: 0, isReal: false, error: error.message };
    }
  }

  /**
   * Get comprehensive health data for today
   */
  async getTodayHealthData() {
    if (!this.isReady()) {
      return {
        steps: { value: 0, isReal: false },
        calories: { value: 0, isReal: false },
        distance: { value: 0, unit: 'km', isReal: false },
        heartRate: { value: 0, isReal: false },
        lastUpdated: new Date().toISOString(),
        isConnected: false
      };
    }

    try {
      // Get all health data concurrently
      const [steps, calories, distance, heartRate] = await Promise.all([
        this.getTodaySteps(),
        this.getTodayCalories(),
        this.getTodayDistance(),
        this.getCurrentHeartRate()
      ]);

      return {
        steps: { 
          value: steps.steps, 
          isReal: steps.isReal,
          error: steps.error 
        },
        calories: { 
          value: calories.calories, 
          isReal: calories.isReal,
          error: calories.error 
        },
        distance: { 
          value: distance.distance, 
          unit: distance.unit, 
          isReal: distance.isReal,
          error: distance.error 
        },
        heartRate: { 
          value: heartRate.heartRate, 
          isReal: heartRate.isReal,
          error: heartRate.error 
        },
        lastUpdated: new Date().toISOString(),
        isConnected: true,
        source: 'Apple Health via HealthKit'
      };
    } catch (error) {
      console.error('❌ Failed to get comprehensive health data:', error);
      return {
        steps: { value: 0, isReal: false },
        calories: { value: 0, isReal: false },
        distance: { value: 0, unit: 'km', isReal: false },
        heartRate: { value: 0, isReal: false },
        lastUpdated: new Date().toISOString(),
        isConnected: false,
        error: error.message
      };
    }
  }

  /**
   * Get health summary for the past week
   */
  async getWeeklyHealthSummary() {
    if (!this.isReady()) {
      return { isConnected: false, data: [] };
    }

    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [stepsData, caloriesData, distanceData] = await Promise.all([
        HealthKit.querySamples(HKQuantityTypeIdentifier.stepCount, {
          from: oneWeekAgo.toISOString(),
          to: now.toISOString(),
        }),
        HealthKit.querySamples(HKQuantityTypeIdentifier.activeEnergyBurned, {
          from: oneWeekAgo.toISOString(),
          to: now.toISOString(),
        }),
        HealthKit.querySamples(HKQuantityTypeIdentifier.distanceWalkingRunning, {
          from: oneWeekAgo.toISOString(),
          to: now.toISOString(),
        })
      ]);

      // Group data by day
      const dailyData = {};
      
      // Process steps
      stepsData.forEach(sample => {
        const date = new Date(sample.startDate).toDateString();
        if (!dailyData[date]) dailyData[date] = { steps: 0, calories: 0, distance: 0 };
        dailyData[date].steps += sample.quantity || 0;
      });

      // Process calories
      caloriesData.forEach(sample => {
        const date = new Date(sample.startDate).toDateString();
        if (!dailyData[date]) dailyData[date] = { steps: 0, calories: 0, distance: 0 };
        dailyData[date].calories += sample.quantity || 0;
      });

      // Process distance
      distanceData.forEach(sample => {
        const date = new Date(sample.startDate).toDateString();
        if (!dailyData[date]) dailyData[date] = { steps: 0, calories: 0, distance: 0 };
        dailyData[date].distance += (sample.quantity || 0) / 1000; // Convert to km
      });

      const weeklyData = Object.entries(dailyData).map(([date, data]) => ({
        date,
        steps: Math.round(data.steps),
        calories: Math.round(data.calories),
        distance: Math.round(data.distance * 100) / 100,
      }));

      return {
        isConnected: true,
        data: weeklyData,
        lastUpdated: new Date().toISOString(),
        source: 'Apple Health'
      };
    } catch (error) {
      console.error('❌ Failed to get weekly health summary:', error);
      return { 
        isConnected: false, 
        data: [],
        error: error.message 
      };
    }
  }

  /**
   * Check permission status for specific health data types
   */
  async getPermissionStatus() {
    if (!HealthKit || this.platform !== 'ios') {
      return { hasPermissions: false, platform: this.platform };
    }

    try {
      const statuses = {};
      
      for (const permission of this.readPermissions) {
        if (permission) {
          const status = await HealthKit.getAuthorizationStatusFor(permission);
          statuses[permission] = status;
        }
      }

      return {
        hasPermissions: this.hasPermissions,
        isInitialized: this.isInitialized,
        platform: this.platform,
        permissions: statuses,
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get permission status:', error);
      return { 
        hasPermissions: false, 
        error: error.message 
      };
    }
  }
}

// Create singleton instance
const newHealthService = new NewHealthService();

export default newHealthService;
