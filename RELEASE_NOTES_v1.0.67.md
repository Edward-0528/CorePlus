# Core+ v1.0.67 Production Release Notes

## Version Information
- **App Version**: 1.0.67 (bumped from 1.0.66)
- **Android Version Code**: 82 (bumped from 81)
- **Build Date**: November 7, 2025
- **Build Type**: Production AAB for Google Play Console

## New Features & Improvements

### 🤖 Enhanced AI Nutrition Coach
- **Concise banner suggestions** above calorie progress (limited to 25 words)
- **Simplified detailed analysis** with emoji-based quick tips replaced by clean text
- **Fixed scrolling issues** in expanded coach view
- **Smart food alternatives** when detecting high fats, carbs, or sodium

### ⭐ New "Scan to Rate" Feature
- **AI-powered food analysis** camera between "Scan Food" and "View Meals"
- **Health scoring system** (1-10) with personalized recommendations
- **Professional UI design** without emojis or card clutter
- **Clean typography** and modern layout
- **Nutrition insights** with pros, cons, and better alternatives

### 🎨 UI/UX Improvements
- **Consistent design language** across all screens
- **Professional aesthetic** removing visual clutter
- **Clean white backgrounds** with subtle dividers
- **Improved typography hierarchy** with proper letter spacing
- **Streamlined interactions** and modern button designs

### 🔧 Technical Improvements
- **Fixed food recommendation service** data structure compatibility
- **Enhanced error handling** in food analysis pipeline
- **Improved ScrollView performance** with proper height constraints
- **Optimized API calls** for better user experience

## Build Configuration
- **EAS Build Profile**: production
- **Target Platform**: Android
- **Output Format**: AAB (Android App Bundle)
- **Environment**: production
- **Node.js Environment**: production packages only

## Testing Recommendations
1. **Internal Testing**: Test all new food scanning features
2. **UI Verification**: Confirm professional appearance across devices
3. **Performance**: Verify AI coach loading times
4. **Camera Functionality**: Test both scan modes thoroughly
5. **Error Handling**: Verify graceful fallbacks for API failures

## Deployment Steps
1. Download AAB from EAS Build dashboard
2. Upload to Google Play Console
3. Add release notes highlighting new AI features
4. Deploy to Internal Testing track first
5. Gradual rollout to production (10% → 50% → 100%)

## Support Documentation
- Build logs available in EAS dashboard
- Crashlytics enabled for production monitoring
- API usage tracking for Gemini AI calls
- User feedback collection for new features

---
*Build initiated: November 7, 2025*
*Expected completion: ~15-20 minutes*
