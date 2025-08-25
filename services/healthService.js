import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Google Fit for Android
let GoogleFit;
if (Platform.OS === 'android') {
  try {
    GoogleFit = require('react-native-google-fit').default;
  } catch (error) {
    console.log('Google Fit not available:', error);
  }
}

// For iOS, you would import Apple HealthKit
// import AppleHealthKit from 'react-native-health';

class HealthService {
  constructor() {
    this.isInitialized = false;
    this.permissions = {
      steps: false,
      calories: false,
      heartRate: false,
      workouts: false,
      distance: false
    };
    this.isGoogleFitAvailable = Platform.OS === 'android' && GoogleFit;
  }

  async initialize() {
    try {
      if (Platform.OS === 'ios') {
        console.log('Initializing Apple Health integration...');
        // For production iOS:
        // const permissions = {
        //   permissions: {
        //     read: [
        //       AppleHealthKit.Constants.Permissions.Steps,
        //       AppleHealthKit.Constants.Permissions.StepCount,
        //       AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        //       AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
        //     ],
        //   },
        // };
        // await AppleHealthKit.initHealthKit(permissions);
        
        // Mock for now
        this.isInitialized = true;
        return true;
        
      } else if (Platform.OS === 'android' && this.isGoogleFitAvailable) {
        console.log('Initializing Google Fit integration...');
        
        const options = {
          scopes: [
            'https://www.googleapis.com/auth/fitness.activity.read',
            'https://www.googleapis.com/auth/fitness.activity.write',
            'https://www.googleapis.com/auth/fitness.body.read',
            'https://www.googleapis.com/auth/fitness.body.write',
            'https://www.googleapis.com/auth/fitness.location.read',
          ],
        };

        await GoogleFit.authorize(options);
        this.isInitialized = true;
        return true;
      } else {
        console.log('Health platform not available, using mock data');
        this.isInitialized = true;
        return true;
      }
    } catch (error) {
      console.error('Health service initialization failed:', error);
      // Fallback to mock mode
      this.isInitialized = true;
      return true;
    }
  }

  async requestPermissions() {
    try {
      if (Platform.OS === 'ios') {
        // Apple Health permissions
        // For production:
        // const permissions = {
        //   permissions: {
        //     read: [
        //       AppleHealthKit.Constants.Permissions.Steps,
        //       AppleHealthKit.Constants.Permissions.StepCount,
        //       AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        //       AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
        //       AppleHealthKit.Constants.Permissions.HeartRate,
        //       AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
        //       AppleHealthKit.Constants.Permissions.Workout
        //     ],
        //     write: [
        //       AppleHealthKit.Constants.Permissions.Steps,
        //       AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        //       AppleHealthKit.Constants.Permissions.Workout
        //     ]
        //   }
        // };
        // await AppleHealthKit.initHealthKit(permissions);
        
        // Mock for iOS
        this.permissions = {
          steps: true,
          calories: true,
          heartRate: true,
          workouts: true,
          distance: true
        };
        
        console.log('Apple Health permissions granted (mock)');
        return true;
        
      } else if (Platform.OS === 'android' && this.isGoogleFitAvailable) {
        // Real Google Fit integration
        console.log('Requesting Google Fit permissions...');
        
        const options = {
          scopes: [
            'https://www.googleapis.com/auth/fitness.activity.read',
            'https://www.googleapis.com/auth/fitness.activity.write',
            'https://www.googleapis.com/auth/fitness.body.read',
            'https://www.googleapis.com/auth/fitness.body.write',
            'https://www.googleapis.com/auth/fitness.location.read'
          ],
        };
        
        try {
          const authResult = await GoogleFit.authorize(options);
          
          if (authResult && authResult.success) {
            this.permissions = {
              steps: true,
              calories: true,
              heartRate: true,
              workouts: true,
              distance: true
            };
            console.log('Google Fit permissions granted');
            return true;
          } else {
            console.log('Google Fit permissions denied or failed');
            // Check if this is an emulator
            const isEmulator = await this.isRunningOnEmulator();
            if (isEmulator) {
              console.log('Detected emulator - Google Fit permissions not available. Using mock data.');
              // Grant mock permissions for emulator
              this.permissions = {
                steps: true,
                calories: true,
                heartRate: true,
                workouts: true,
                distance: true
              };
              return true; // Return true but with mock data
            }
            return false;
          }
        } catch (error) {
          console.log('Google Fit authorization error:', error);
          // Check if this is an emulator
          const isEmulator = await this.isRunningOnEmulator();
          if (isEmulator) {
            console.log('Emulator detected - providing mock health data');
            this.permissions = {
              steps: true,
              calories: true,
              heartRate: true,
              workouts: true,
              distance: true
            };
            return true;
          }
          throw error;
        }
      } else {
        // Fallback for unsupported platforms or when library not available
        console.log('Google Fit not available - using mock data');
        this.permissions = {
          steps: true,
          calories: true,
          heartRate: true,
          workouts: true,
          distance: true
        };
        
        console.log('Health permissions granted (fallback mode)');
        return true;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async getTodaysSteps() {
    try {
      if (!this.permissions.steps) {
        throw new Error('Steps permission not granted');
      }

      if (Platform.OS === 'android' && this.isGoogleFitAvailable) {
        // Real Google Fit integration
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        const stepsData = await GoogleFit.getDailySteps(options);
        const totalSteps = stepsData.reduce((total, day) => total + day.steps, 0);

        return {
          value: totalSteps,
          unit: 'steps',
          date: new Date().toISOString()
        };
      } else {
        // Mock data for iOS or when Google Fit not available
        const mockSteps = Math.floor(Math.random() * 5000) + 3000;
        
        return {
          value: mockSteps,
          unit: 'steps',
          date: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Failed to get steps:', error);
      return { value: 0, unit: 'steps', date: new Date().toISOString() };
    }
  }

  async getTodaysCaloriesBurned() {
    try {
      if (!this.permissions.calories) {
        throw new Error('Calories permission not granted');
      }

      if (Platform.OS === 'android' && this.isGoogleFitAvailable) {
        // Real Google Fit integration
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        const caloriesData = await GoogleFit.getDailyCalorieSamples(options);
        const totalCalories = caloriesData.reduce((total, entry) => total + entry.calorie, 0);

        return {
          value: Math.round(totalCalories),
          unit: 'kcal',
          date: new Date().toISOString()
        };
      } else {
        // Mock data for iOS or when Google Fit not available
        const mockCalories = Math.floor(Math.random() * 300) + 200;
        
        return {
          value: mockCalories,
          unit: 'kcal',
          date: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Failed to get calories:', error);
      return { value: 0, unit: 'kcal', date: new Date().toISOString() };
    }
  }

  async getTodaysDistance() {
    try {
      if (!this.permissions.distance) {
        throw new Error('Distance permission not granted');
      }

      if (Platform.OS === 'android' && this.isGoogleFitAvailable) {
        // Real Google Fit integration
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        const distanceData = await GoogleFit.getDailyDistanceSamples(options);
        const totalDistance = distanceData.reduce((total, entry) => total + entry.distance, 0);

        return {
          value: parseFloat((totalDistance / 1000).toFixed(2)), // Convert meters to km
          unit: 'km',
          date: new Date().toISOString()
        };
      } else {
        // Mock data for iOS or when Google Fit not available
        const mockDistance = (Math.random() * 3 + 1).toFixed(2);
        
        return {
          value: parseFloat(mockDistance),
          unit: 'km',
          date: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Failed to get distance:', error);
      return { value: 0, unit: 'km', date: new Date().toISOString() };
    }
  }

  async getWeeklyWorkouts() {
    try {
      if (!this.permissions.workouts) {
        throw new Error('Workouts permission not granted');
      }

      // Mock workout data
      const mockWorkouts = [
        {
          id: '1',
          type: 'Running',
          duration: 30,
          calories: 250,
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          distance: 3.2
        },
        {
          id: '2',
          type: 'Strength Training',
          duration: 45,
          calories: 180,
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          distance: 0
        },
        {
          id: '3',
          type: 'Cycling',
          duration: 60,
          calories: 400,
          date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          distance: 15.5
        }
      ];
      
      return mockWorkouts;
    } catch (error) {
      console.error('Failed to get workouts:', error);
      return [];
    }
  }

  async syncWorkout(workoutData) {
    try {
      if (!this.permissions.workouts) {
        throw new Error('Workouts permission not granted');
      }

      console.log('Syncing workout to health app:', workoutData);
      
      if (Platform.OS === 'android' && this.isGoogleFitAvailable) {
        // Real Google Fit workout sync
        const options = {
          startDate: workoutData.startDate,
          endDate: workoutData.endDate,
          activityName: workoutData.type,
          calories: workoutData.calories,
          distance: workoutData.distance || 0,
        };

        await GoogleFit.saveWorkout(options);
        console.log('Workout synced to Google Fit successfully');
        return true;
      } else if (Platform.OS === 'ios') {
        // For iOS with Apple Health:
        // const workoutOptions = {
        //   type: workoutData.type,
        //   startDate: workoutData.startDate,
        //   endDate: workoutData.endDate,
        //   energyBurned: workoutData.calories,
        //   distance: workoutData.distance,
        // };
        // await AppleHealthKit.saveWorkout(workoutOptions);
        
        console.log('Workout synced to Apple Health (mock)');
        return true;
      } else {
        console.log('Workout sync completed (fallback mode)');
        return true;
      }
    } catch (error) {
      console.error('Failed to sync workout:', error);
      return false;
    }
  }

  async getHealthSummary() {
    try {
      const [steps, calories, distance] = await Promise.all([
        this.getTodaysSteps(),
        this.getTodaysCaloriesBurned(),
        this.getTodaysDistance()
      ]);

      return {
        steps: steps.value,
        caloriesBurned: calories.value,
        distance: distance.value,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get health summary:', error);
      return {
        steps: 0,
        caloriesBurned: 0,
        distance: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async isHealthDataAvailable() {
    if (Platform.OS === 'ios') {
      // Check if Apple Health is available
      return true; // Mock for Expo Go
    } else if (Platform.OS === 'android') {
      // Check if Google Fit is available
      return true; // Mock for Expo Go
    }
    return false;
  }

  getHealthPlatformName() {
    return Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit';
  }

  async isRunningOnEmulator() {
    if (Platform.OS === 'android') {
      try {
        // Import DeviceInfo if available
        const DeviceInfo = require('react-native-device-info');
        return await DeviceInfo.isEmulator();
      } catch (error) {
        // Fallback detection methods for emulator
        const { Dimensions } = require('react-native');
        const { width, height } = Dimensions.get('window');
        
        // Common emulator resolutions
        const emulatorResolutions = [
          [360, 640], [411, 731], [320, 568], [375, 667], [414, 736],
          [480, 800], [480, 854], [540, 960], [720, 1280], [1080, 1920]
        ];
        
        return emulatorResolutions.some(([w, h]) => 
          (width === w && height === h) || (width === h && height === w)
        );
      }
    }
    return false; // Assume real device for iOS or if detection fails
  }
}

export const healthService = new HealthService();
export default HealthService;
