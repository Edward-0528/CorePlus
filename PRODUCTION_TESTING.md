# Core+ Production Testing Guide

## 🎯 What We Fixed in This Build:

### Critical Crash Issues:
1. **Missing Google Services** - Created minimal `google-services.json` to prevent Firebase crashes
2. **Console Statements** - Added production safety wrapper in `utils/productionSafe.js`
3. **RevenueCat Errors** - Fixed missing `setAttributes` method
4. **Environment Variables** - Proper production configuration

## 📱 Testing the New Build:

### When you receive the new .aab file:

1. **Upload to Google Play Console**
   - Go to your app's Internal Testing track
   - Upload the new .aab file
   - Publish to internal testing

2. **Test Critical Flows:**
   - ✅ App launches without crash
   - ✅ Login/signup works
   - ✅ Navigation between tabs works
   - ✅ Camera/food scanning works
   - ✅ Subscription flow works (even if RevenueCat shows errors)

3. **Common Issues to Watch For:**
   - If app still crashes on launch: Check device logs for specific error
   - If RevenueCat fails: That's expected with minimal Google Services
   - If authentication fails: Check Supabase configuration

## 🔧 If Issues Persist:

### Debugging Steps:
1. **Check Android Studio Logs:**
   ```bash
   adb logcat | grep -i "core"
   ```

2. **Common Error Patterns:**
   - `FirebaseApp initialization failed` - Google Services issue
   - `Network request failed` - Environment variables issue  
   - `ReferenceError` - Missing method/import issue

### Quick Fixes:
- **For Firebase issues**: Replace `google-services.json` with real Firebase config
- **For network issues**: Verify `.env` file has all required keys
- **For RevenueCat issues**: Temporarily disable subscription features

## 🚀 Next Steps After Successful Test:

1. **Real Firebase Setup:**
   - Create actual Firebase project
   - Download real `google-services.json`
   - Replace the minimal one we created

2. **Environment Variables:**
   - Set up EAS environment variables for production
   - Remove hardcoded keys from code

3. **Final Production Build:**
   - Run build again with real configuration
   - Test thoroughly before Play Store release

## 📞 If You Need Help:
- Provide the specific error message from device logs
- Include the build URL from EAS
- Mention which device/Android version you're testing on
