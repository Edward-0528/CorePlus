# Production Crash Fix Guide for Core+ App

## Issues Found & Solutions Implemented

### 1. **Google Services Configuration Missing**
**Problem**: Your app uses Google OAuth but lacks proper Google Services configuration for production.

**Solution**: 
- Added `google-services.json.template` in `android/app/` directory
- You need to:
  1. Go to [Firebase Console](https://console.firebase.google.com/)
  2. Create a new project or use existing one
  3. Add Android app with package name: `com.coreplus.app`
  4. Download the `google-services.json` file
  5. Replace the template file with your actual `google-services.json`

### 2. **RevenueCat Service Initialization Crashes**
**Problem**: RevenueCat service could crash the app on startup if API keys are missing or initialization fails.

**Solutions Implemented**:
- Added timeout protection for RevenueCat initialization
- Added graceful fallbacks when RevenueCat fails to initialize
- Improved error handling to prevent app crashes
- Made RevenueCat optional for app startup

### 3. **Missing Error Boundary**
**Problem**: Any unhandled JavaScript errors could crash the entire app.

**Solution**: 
- Added comprehensive `ErrorBoundary` component
- Wraps the entire app to catch and handle crashes gracefully
- Shows user-friendly error screen instead of white screen

### 4. **Google OAuth Production Issues**
**Problem**: Social authentication might fail in production environment.

**Solutions Implemented**:
- Improved error handling in `socialAuthService.js`
- Added network error detection and user-friendly messages
- Added proper validation for Supabase initialization

### 5. **App Configuration Updates**
**Solutions Applied**:
- Added required internet permissions to `app.json`
- Updated EAS build configuration for production
- Added proper environment handling

## Required Actions for Production Deployment

### Step 1: Google Services Setup
```bash
# 1. Create Firebase project at https://console.firebase.google.com/
# 2. Add Android app with package: com.coreplus.app
# 3. Download google-services.json
# 4. Replace the template file:
cp /path/to/downloaded/google-services.json ./android/app/google-services.json
```

### Step 2: Environment Variables
Ensure these environment variables are set in your production build:
```
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_revenuecat_android_key
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_revenuecat_ios_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Build Production APK
```bash
# Clean build
eas build --platform android --profile production --clear-cache

# Or if you prefer local build:
npx expo run:android --variant release
```

### Step 4: Test Before Submission
1. Test on physical Android device
2. Test Google OAuth flow
3. Test subscription flows
4. Test network error scenarios

## Code Changes Made

### 1. Enhanced Error Handling in App.js
- Added try-catch blocks around RevenueCat initialization
- Made authentication more robust
- Added fallback states for failed services

### 2. Improved RevenueCat Service
- Added initialization timeout (10 seconds)
- Made all methods safe with proper error handling
- Added null checks and graceful degradation

### 3. Better Social Auth Service
- Enhanced error messages for users
- Added network error detection
- Improved OAuth URL handling

### 4. Added Error Boundary
- Catches all unhandled React errors
- Shows user-friendly error screen
- Logs errors for debugging

## Testing Checklist

- [ ] App starts without crashing
- [ ] Google OAuth works in production
- [ ] RevenueCat initializes or fails gracefully
- [ ] Error boundary catches test errors
- [ ] Network errors are handled gracefully
- [ ] All core features work without external services

## Monitoring & Debugging

### Production Logs
Use `adb logcat` to monitor production logs:
```bash
adb logcat | grep -E "(CorePlus|RevenueCat|Supabase|Google)"
```

### Common Issues to Watch For
1. **Network timeouts**: Check internet connectivity handling
2. **Missing API keys**: Verify all environment variables
3. **Google Services**: Ensure `google-services.json` is valid
4. **Play Store requirements**: Check for missing permissions

## Additional Recommendations

1. **Add Crash Reporting**: Consider adding Sentry or Bugsnag for production error tracking
2. **Add Performance Monitoring**: Monitor app startup time and performance
3. **Test on Multiple Devices**: Test on various Android versions and device types
4. **Gradual Rollout**: Use Play Console's staged rollout feature

## Support

If you continue to experience crashes:
1. Check the device logs with `adb logcat`
2. Test on a clean device without dev tools
3. Verify all environment variables are set correctly
4. Ensure Google Services configuration is valid
