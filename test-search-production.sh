#!/bin/bash

# Production Build Test Script for Android Search Issue
# This script helps test the search functionality in production builds

echo "🔧 CorePlus Production Search Test Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ Please run this script from the CorePlus root directory"
    exit 1
fi

echo "📱 Instructions for testing manual meal entry search:"
echo ""
echo "1. Build and install the production APK:"
echo "   eas build --platform android --profile production"
echo ""
echo "2. Install the APK on your Android device"
echo ""
echo "3. Open the app and navigate to manual meal entry:"
echo "   → Tap 'Add Food' button"
echo "   → Or go to Nutrition tab → 'Log Meal' button"
echo ""
echo "4. Test search functionality:"
echo "   → Try searching for: 'chicken breast'"
echo "   → Try searching for: 'apple'"
echo "   → Try searching for: 'pizza'"
echo ""
echo "5. Expected behavior:"
echo "   ✅ Should show search results"
echo "   ✅ Should be able to select and add foods"
echo "   ❌ If you see 'No results found' immediately, the issue persists"
echo ""
echo "6. If search still fails, check device logs:"
echo "   adb logcat | grep -E '(Search|Gemini|API|food|analysis)'"
echo ""
echo "🔧 Recent fixes applied:"
echo "   • Fixed API key access in production builds"
echo "   • Added fallback predictions when AI fails"
echo "   • Enhanced error logging for debugging"
echo "   • Added basic food estimation as last resort"
echo ""
echo "💡 The search should now work even without internet by providing"
echo "   estimated nutrition data as a fallback."
echo ""

# Ask if user wants to build now
read -p "🚀 Would you like to start a production build now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Starting production build..."
    eas build --platform android --profile production --non-interactive
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Build completed successfully!"
        echo "📲 Install the APK and test the search functionality"
    else
        echo ""
        echo "❌ Build failed. Please check the errors above."
    fi
else
    echo "👍 Run 'eas build --platform android --profile production' when ready to test"
fi

echo ""
echo "📝 After testing, please report:"
echo "   • Whether search works now"
echo "   • What results you see when searching"
echo "   • Any error messages in the app or device logs"
