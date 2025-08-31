# Google Play Store Publishing Guide for Core+

## 📱 **Step 1: Prepare Your App for Production**

### Update App Configuration
First, let's ensure your app.json is properly configured for production:

```json
{
  "expo": {
    "name": "Core+",
    "slug": "core-plus",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.coreplus"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.coreplus",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-camera",
      "expo-barcode-scanner"
    ]
  }
}
```

## 📋 **Step 2: Create Required Store Assets**

You'll need these assets for the Play Store:

### App Icons & Screenshots
- **High-res icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG  
- **Phone screenshots**: At least 2, up to 8 (16:9 or 9:16 ratio)
- **Tablet screenshots**: At least 1, up to 8 (optional but recommended)

### Store Listing Content
- **App title**: "Core+" (max 50 characters)
- **Short description**: Max 80 characters
- **Full description**: Max 4000 characters
- **Privacy Policy URL**: Required
- **Contact email**: Required

## 🔧 **Step 3: Build Production APK**

### Option A: Using EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile production
```

### Option B: Using Expo Build (Legacy)
```bash
# Build APK
expo build:android -t apk

# Or build AAB (Android App Bundle) - Recommended for Play Store
expo build:android -t app-bundle
```

## 🏪 **Step 4: Google Play Console Setup**

### Create Developer Account
1. Go to [Google Play Console](https://play.google.com/console)
2. Pay one-time $25 registration fee
3. Complete account verification

### Create New App
1. Click "Create app"
2. Enter app details:
   - **App name**: Core+
   - **Default language**: English (United States)
   - **App type**: App
   - **Category**: Health & Fitness
   - **Is this app free?**: Yes (or No if premium)

## 📝 **Step 5: Complete App Information**

### Store Listing
- Upload your app icon (512x512)
- Upload feature graphic (1024x500)
- Add screenshots
- Write compelling description
- Set content rating (ESRB: Everyone)

### Content Rating
Answer questionnaire about your app content:
- No violence, gambling, or mature content
- Health & fitness app
- May collect personal health data

### Privacy Policy
You'll need a privacy policy. Here's a template structure:
```
Core+ Privacy Policy

1. Information We Collect
2. How We Use Information  
3. Data Storage & Security
4. Third-Party Services (Edamam, Supabase, etc.)
5. User Rights
6. Contact Information
```

## 🔐 **Step 6: App Signing**

### Upload Your APK/AAB
1. Go to "Release" → "Production"
2. Upload your built APK or AAB file
3. Complete release notes
4. Set rollout percentage (start with 20% for testing)

### App Signing by Google (Recommended)
- Let Google manage your app signing key
- More secure and allows key recovery

## ✅ **Step 7: Final Checklist**

### Required Items:
- [ ] App APK/AAB uploaded
- [ ] Store listing complete
- [ ] Screenshots uploaded (2+ phone, 1+ tablet)
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Privacy policy URL
- [ ] Content rating completed
- [ ] Target API level 33+ (Android 13)
- [ ] App signing configured

### Review Process:
- Google reviews typically take 1-3 days
- May require additional information
- Address any policy violations promptly

## 🚀 **Step 8: Launch Strategy**

### Soft Launch (Recommended)
1. Release to 20% of users first
2. Monitor for crashes and reviews
3. Gradually increase to 100%

### Post-Launch
- Monitor crash reports in Play Console
- Respond to user reviews
- Plan regular updates

## 💡 **Pro Tips**

1. **Test thoroughly** before submitting
2. **Use Android App Bundle** (.aab) for smaller downloads
3. **Optimize your store listing** for ASO (App Store Optimization)
4. **Include relevant keywords** in your description
5. **Respond to user reviews** quickly
6. **Monitor performance** in Play Console analytics

## 🔧 **Common Issues & Solutions**

### Build Errors
- Ensure all dependencies are compatible
- Check Android API level requirements
- Verify app permissions

### Policy Violations
- Review Google Play policies
- Ensure privacy policy compliance
- Check content rating accuracy

### Upload Issues
- APK must be signed
- Version code must be higher than previous
- Target SDK must be recent

---

Ready to start? Let me know which step you'd like help with first!
