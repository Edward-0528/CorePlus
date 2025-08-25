# Health Integration Setup Instructions

## Overview
This health integration provides connectivity to Apple Health and Google Fit for tracking:
- Daily steps count
- Calories burned 
- Distance traveled
- Workout synchronization
- Heart rate data (if available)

## Current Implementation
The current implementation includes mock data for development and testing purposes. For production deployment, you'll need to integrate with actual health APIs.

## Production Setup

### For Apple Health (iOS)
```bash
npm install react-native-health
# or
npm install @react-native-community/apple-healthkit
```

### For Google Fit (Android)  
```bash
npm install react-native-google-fit
# or 
npm install @react-native-async-storage/async-storage
```

### Expo Compatible Options
```bash
expo install expo-sensors
expo install expo-location
```

## Configuration

### iOS (Info.plist)
Add health permissions:
```xml
<key>NSHealthShareUsageDescription</key>
<string>This app needs access to health data to track your fitness progress</string>
<key>NSHealthUpdateUsageDescription</key>
<string>This app needs to update health data to sync your workouts</string>
```

### Android (android/app/src/main/AndroidManifest.xml)
Add Google Fit permissions:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="com.google.android.gms.permission.ACTIVITY_RECOGNITION" />
```

## Features

### ✅ Implemented
- Mock health data display
- Step count tracking
- Calories burned tracking  
- Distance measurement
- Recent workouts display
- Workout synchronization
- Tab navigation in workouts screen
- Refresh functionality
- Permission management UI

### 🔄 Mock Data
- Steps: Random 3000-8000 per day
- Calories: Random 200-500 burned
- Distance: Random 1-4 km
- Recent workouts with realistic data

### 🚀 Production Ready
- Service architecture for easy API swapping
- Permission handling flow
- Error management
- Cache-friendly design
- Platform detection (iOS/Android)

## Usage

### Accessing Health Data
```javascript
import { healthService } from '../services/healthService';

// Initialize
await healthService.initialize();

// Request permissions
await healthService.requestPermissions();

// Get data
const steps = await healthService.getTodaysSteps();
const calories = await healthService.getTodaysCaloriesBurned();
const summary = await healthService.getHealthSummary();
```

### Syncing Workouts
```javascript
const workoutData = {
  type: 'Running',
  duration: 30, // minutes
  calories: 250,
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString()
};

await healthService.syncWorkout(workoutData);
```

## Navigation

The workouts screen now includes two tabs:
1. **Workouts** - Your workout logging and statistics
2. **Health Data** - Integration with Apple Health/Google Fit

## Notes

- Health data updates every time you refresh the screen
- Workout logs are automatically synced to health platforms
- Permission requests are handled gracefully
- Fallback UI shown when health data is unavailable
- All health data is cached for performance

## Development vs Production

### Development (Current)
- Uses mock data for testing
- No actual health API calls
- Permission simulation
- Cross-platform compatibility

### Production (Next Steps)
1. Install platform-specific health libraries
2. Replace mock service methods with real API calls
3. Handle platform-specific permission flows
4. Add health data validation
5. Implement background sync capabilities
