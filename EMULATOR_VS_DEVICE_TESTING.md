# Google Fit Testing Guide

## 🤖 EMULATOR TESTING (Current)

### Expected Behavior:
- ✅ App launches and loads
- ✅ Green "FIT" button appears
- ✅ Test screen opens
- ❌ "Permissions denied" for health data (NORMAL)
- ✅ Mock data should still display (steps: 1234, calories: 250, etc.)

### What You're Seeing:
```
"Permissions denied - health data permissions are required to track your fitness metrics"
```
**This is EXPECTED on emulator!**

### Verify Mock Data Works:
1. Tap "Initialize Google Fit" - should succeed
2. Tap "Request Permissions" - will fail (normal)
3. Tap "Fetch Health Data" - should show mock data
4. Check if fallback system displays sample data

## 📱 PHYSICAL DEVICE TESTING (Recommended)

### Requirements:
- Android phone with Google Play Services
- Google account signed in
- Google Fit app installed (optional but recommended)

### Setup Steps:
1. **Build for Device:**
   ```bash
   npx expo run:android --device
   ```

2. **Or Install APK:**
   ```bash
   # Build APK
   cd android
   ./gradlew assembleDebug
   # Install on connected device
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Google Cloud Console Setup:**
   - Go to https://console.cloud.google.com/
   - Create project → Enable Fitness API
   - Create OAuth Client ID for Android
   - Package: `com.anonymous.coreplus`
   - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

### Expected Results on Real Device:
- ✅ "Request Permissions" opens Google authorization dialog
- ✅ Real step count from Google Fit
- ✅ Real calories burned data
- ✅ Workout sync actually saves to Google Fit
- ✅ Data updates in real-time

## 🛠️ TROUBLESHOOTING

### If Mock Data Also Fails:
Check your `healthService.js` fallback system:

```javascript
// Should return mock data when Google Fit unavailable
const mockSteps = 1234;
const mockCalories = 250;
const mockDistance = 1500; // meters
```

### Test Fallback System:
1. Check console logs in React Native debugger
2. Verify mock data appears when permissions fail
3. Ensure app doesn't crash on permission denial

## 🎯 NEXT STEPS

### Immediate (Emulator):
1. ✅ Verify app launches without crashing
2. ✅ Test navigation to FIT screen works
3. ✅ Check if mock data displays after permission failure
4. ✅ Confirm UI components render correctly

### For Real Testing (Physical Device):
1. 📱 Set up Google Cloud Console project
2. 📱 Build and install on Android device
3. 📱 Test real Google Fit permissions
4. 📱 Verify actual health data appears
5. 📱 Test workout synchronization

### iOS Support (Next Phase):
- Configure Apple Health integration
- Test on iOS device with HealthKit
- Ensure cross-platform compatibility

## 🏆 SUCCESS CRITERIA

**Emulator (Current):**
- ✅ App runs without crashes
- ✅ Google Fit test screen accessible
- ✅ Graceful permission denial handling
- ✅ Mock data fallback works

**Physical Device (Goal):**
- 📱 Real Google Fit permissions granted
- 📱 Live health data displayed
- 📱 Workout sync functional
- 📱 Real-time updates working

---

**Summary**: Your "permissions denied" message is completely normal on emulator. The real test is on a physical Android device with Google Play Services.
