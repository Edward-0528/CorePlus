# Google Fit Integration Setup Guide

## Prerequisites

1. **Google Cloud Console Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Fitness API"

2. **OAuth 2.0 Credentials**
   - Go to "Credentials" in the Google Cloud Console
   - Create OAuth 2.0 Client ID for Android
   - Use your app's package name: `com.anonymous.coreplus`
   - Get your SHA-1 fingerprint for debug/release keystores

## Getting SHA-1 Fingerprint

For **debug** keystore (development):
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

For **release** keystore (production):
```bash
keytool -list -v -keystore path/to/release-keystore.jks -alias your-key-alias
```

## Google Cloud Console Setup

1. **Enable APIs**
   - Google Fitness API
   - Google Identity API (for OAuth)

2. **Create OAuth 2.0 Client ID**
   - Application type: Android
   - Package name: `com.anonymous.coreplus`
   - SHA-1 certificate fingerprint: (from command above)

3. **OAuth Consent Screen**
   - Configure your app's consent screen
   - Add necessary scopes:
     - `https://www.googleapis.com/auth/fitness.activity.read`
     - `https://www.googleapis.com/auth/fitness.activity.write`
     - `https://www.googleapis.com/auth/fitness.body.read`
     - `https://www.googleapis.com/auth/fitness.location.read`

## Testing Google Fit Integration

1. **Build the app** (already running):
   ```bash
   npx expo run:android
   ```

2. **Test on device**:
   - Physical Android device is recommended
   - Ensure Google Play Services is installed
   - Sign in with a Google account

3. **Access Test Screen**:
   - Add this to your navigation to test: `setActiveTab('test')`
   - The app now includes a `GoogleFitTest` component
   - Use the test buttons to verify functionality

## Current Implementation Status

✅ **Completed**:
- `react-native-google-fit` library installed
- Real Google Fit API integration in `healthService.js`
- Android permissions in `AndroidManifest.xml`
- Google Play Services dependencies in `build.gradle`
- Test component (`GoogleFitTest.js`) created
- App configured for development build

⏳ **Next Steps**:
1. Complete Android build and test on device
2. Set up Google Cloud Console project
3. Configure OAuth credentials
4. Test real Google Fit functionality
5. Add iOS support with Apple Health

## Troubleshooting

### Common Issues:

1. **"Google Play Services not available"**
   - Ensure device has Google Play Services
   - Update Google Play Services if needed

2. **"Authorization failed"**
   - Check OAuth client ID configuration
   - Verify SHA-1 fingerprint matches
   - Ensure app package name is correct

3. **"Permissions denied"**
   - Check if user denied permissions
   - Request permissions explicitly
   - Verify Fitness API scopes in Google Console

### Debug Commands:

```bash
# Check Google Play Services version
adb shell dumpsys package com.google.android.gms | grep version

# View app logs
npx react-native log-android

# Clear app data
adb shell pm clear com.anonymous.coreplus
```

## Production Considerations

1. **Release Keystore**
   - Create a release keystore for production
   - Update SHA-1 fingerprint in Google Console

2. **App Store Compliance**
   - Add privacy policy explaining health data usage
   - Follow platform-specific health data guidelines

3. **Error Handling**
   - Implement robust error handling for API failures
   - Provide fallback UI when Google Fit is unavailable

4. **Data Privacy**
   - Only request necessary health permissions
   - Clearly explain data usage to users
   - Implement data deletion capabilities

## Next Integration: Apple Health

After Google Fit is working, we'll add Apple Health using:
- `react-native-health` library
- HealthKit permissions in iOS
- Cross-platform health service abstraction
