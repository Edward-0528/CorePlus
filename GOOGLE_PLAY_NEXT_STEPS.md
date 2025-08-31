# Google Play Store Publishing - Next Steps

## 🚀 Your app is now ready for production! Here's what to do next:

### 1. Expo Account Setup
You need to log into your Expo account to build the app:

```bash
eas login
```

If you don't have an Expo account:
1. Go to https://expo.dev/signup
2. Create a free account
3. Come back and run `eas login`

### 2. Build Production APK
Once logged in, build your production APK:

```bash
# For APK (direct install)
eas build --platform android --profile production

# For AAB (Google Play Store)
eas build --platform android --profile production --auto-submit
```

### 3. Google Play Console Setup
1. Go to https://play.google.com/console
2. Create a Developer Account ($25 one-time fee)
3. Create a new app:
   - App name: "Core Plus"
   - Package name: `com.coreplus.nutrition`
   - Language: English

### 4. Store Listing Requirements

#### App Description (Short):
"AI-powered nutrition tracking with food scanning, meal planning, and health integration"

#### App Description (Full):
"Core Plus is your comprehensive nutrition companion that makes healthy eating effortless. Using advanced AI technology, simply scan or photograph your food to instantly get detailed nutritional information.

KEY FEATURES:
🔍 Smart Food Recognition - Scan barcodes or take photos for instant nutrition data
🍽️ Meal Planning - Discover recipes with cuisine filtering (American, Italian, Asian, and more)
📊 Health Integration - Sync with Google Fit and Samsung Health
📈 Progress Tracking - Monitor your daily nutrition goals and habits
🎯 Personalized Insights - Get tailored recommendations based on your preferences

Whether you're tracking macros, planning meals, or maintaining a healthy lifestyle, Core Plus provides the tools you need in one beautiful, easy-to-use app.

Perfect for fitness enthusiasts, health-conscious individuals, and anyone looking to improve their relationship with food."

#### Required Assets:
- **App Icon**: 512x512 PNG (already at `./assets/icon.png`)
- **Feature Graphic**: 1024x500 PNG (create this)
- **Screenshots**: 
  - Phone: At least 2, up to 8 (1080x1920 or 1080x2340)
  - Tablet: At least 1, up to 8 (2048x1536 or 1536x2048)

### 5. Privacy Policy & Data Safety
Your app collects:
- Camera/Photo data (for food scanning)
- Health data (nutrition tracking)
- Location data (optional, for local restaurants)

Create a privacy policy at: https://www.privacypolicytemplate.net/

### 6. App Signing
EAS automatically handles app signing, but you can also:
1. Generate your own keystore
2. Upload to Google Play Console
3. Use Play App Signing (recommended)

### 7. Upload to Play Console
1. In Play Console, go to your app
2. Navigate to "Production" release
3. Upload the AAB file from EAS build
4. Fill out store listing information
5. Set content rating (likely "Teen" for health apps)
6. Submit for review

### 8. Review Process
- Google typically reviews apps within 1-3 days
- Address any feedback promptly
- Once approved, your app goes live!

## 🔧 Technical Notes

### App Configuration Updates Made:
- ✅ Package name: `com.coreplus.nutrition`
- ✅ App name: "Core Plus"
- ✅ Professional description added
- ✅ Proper Android permissions
- ✅ iOS configuration for future App Store
- ✅ Production-ready build settings

### Build Configuration:
- ✅ EAS build configuration (`eas.json`)
- ✅ Production profile with auto-increment
- ✅ Proper Android permissions and settings

## 📞 Need Help?

If you run into issues:
1. Check the [Expo documentation](https://docs.expo.dev/build/setup/)
2. Review [Google Play Console help](https://support.google.com/googleplay/android-developer/)
3. Ensure all store assets meet Google's requirements

**Next immediate step**: Fix your Expo login credentials and run the build command!
