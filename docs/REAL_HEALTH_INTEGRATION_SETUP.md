# Health Integration Setup Guide

This guide explains how to set up Apple Health and Samsung Health integrations for Core+.

## Overview

Core+ integrates with:
- **Apple Health** (iOS) - for iPhone users
- **Samsung Health** (Android) - for Samsung device users

## Required Packages

The following packages are required and should be installed:

```bash
npm install react-native-health
npm install react-native-samsung-health --legacy-peer-deps
```

## iOS Setup (Apple Health)

### 1. Add Health Capabilities

In `ios/CorePlus/CorePlus.entitlements`, add:

```xml
<key>com.apple.developer.healthkit</key>
<true/>
```

### 2. Add Info.plist Permissions

In `ios/CorePlus/Info.plist`, add:

```xml
<key>NSHealthShareUsageDescription</key>
<string>This app needs access to health data to track your fitness progress and provide personalized recommendations.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>This app needs to update health data to sync your workouts and fitness activities.</string>
```

### 3. Supported Health Data Types

- Steps (read/write)
- Active Energy Burned (read/write)
- Distance Walking/Running (read/write)
- Workouts (read/write)
- Heart Rate (read)

## Android Setup (Samsung Health)

### 1. Samsung Health SDK Setup

Samsung Health requires additional setup:

1. Register your app at [Samsung Developers](https://developer.samsung.com/)
2. Get Samsung Health SDK credentials
3. Add required permissions to `android/app/src/main/AndroidManifest.xml`

### 2. Add Permissions

```xml
<uses-permission android:name="com.samsung.android.providers.health.permission.READ" />
<uses-permission android:name="com.samsung.android.providers.health.permission.WRITE" />
```

### 3. Required Dependencies

Make sure Samsung Health app is installed on the device.

## Usage Examples

### Initialize Health Service

```javascript
import { healthService } from '../services/healthService';

// Initialize
try {
  await healthService.initialize();
  console.log('Health service initialized');
} catch (error) {
  console.error('Health initialization failed:', error);
}
```

### Request Permissions

```javascript
try {
  const granted = await healthService.requestPermissions();
  if (granted) {
    console.log('Health permissions granted');
  } else {
    console.log('Health permissions denied');
  }
} catch (error) {
  console.error('Permission request failed:', error);
}
```

### Get Health Data

```javascript
try {
  const steps = await healthService.getTodaysSteps();
  const calories = await healthService.getTodaysCaloriesBurned();
  const distance = await healthService.getTodaysDistance();
  
  console.log('Today\'s data:', { steps, calories, distance });
} catch (error) {
  console.error('Failed to get health data:', error);
}
```

### Sync Workout

```javascript
const workoutData = {
  type: 'Running',
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  duration: 30, // minutes
  caloriesBurned: 250,
  distance: 5000 // meters
};

try {
  const result = await healthService.syncWorkout(workoutData);
  console.log('Workout synced:', result);
} catch (error) {
  console.error('Workout sync failed:', error);
}
```

## Troubleshooting

### iOS Issues

1. **Health permissions not showing**: Make sure Info.plist permissions are correctly added
2. **Health data not available**: Ensure device supports HealthKit (not available on simulators)
3. **Authorization issues**: Check that the app is authorized in iPhone Settings > Privacy & Security > Health

### Android Issues

1. **Samsung Health not found**: Ensure Samsung Health app is installed and updated
2. **Permission denied**: Check that Samsung Health permissions are granted in device settings
3. **SDK errors**: Verify Samsung Health SDK credentials are properly configured

### General Issues

1. **Service not initialized**: Always call `initialize()` before using other methods
2. **No permissions**: Request permissions before accessing health data
3. **Platform not supported**: Health integrations only work on iOS and Android

## Platform Detection

The health service automatically detects the platform and uses the appropriate health integration:

- **iOS**: Uses Apple Health (HealthKit)
- **Android**: Uses Samsung Health
- **Web/Other**: Throws errors (no health data available)

## Error Handling

All health service methods throw descriptive errors when they fail. Always wrap health service calls in try-catch blocks:

```javascript
try {
  const data = await healthService.getHealthSummary();
  // Use data
} catch (error) {
  console.error('Health data error:', error.message);
  // Handle error gracefully
}
```
