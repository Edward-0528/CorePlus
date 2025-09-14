#!/bin/bash

# Core+ Debug Helper Script
# Usage: ./debug-coreplus.sh [option]

echo "🔍 Core+ Android Debug Helper"
echo "==============================="

case "$1" in
    "check")
        echo "📱 Checking connected devices..."
        adb devices
        ;;
    "launch")
        echo "🚀 Monitoring app launch..."
        adb logcat -c
        echo "Launch your Core+ app now, then press Ctrl+C when done..."
        adb logcat | grep -i "com.coreplus.app"
        ;;
    "errors")
        echo "❌ Monitoring errors only..."
        adb logcat | grep -E "(ERROR|FATAL)" | grep -i "com.coreplus.app"
        ;;
    "save")
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        LOGFILE="coreplus_debug_${TIMESTAMP}.log"
        echo "💾 Saving logs to ${LOGFILE}..."
        echo "Launch your app and test, press Ctrl+C when done..."
        adb logcat | grep -i "com.coreplus.app" | tee "$LOGFILE"
        echo "✅ Logs saved to ${LOGFILE}"
        ;;
    "crash")
        echo "💥 Looking for crash logs..."
        adb logcat | grep -E "(FATAL|AndroidRuntime|Process.*died)" | grep -A 10 -B 5 "com.coreplus.app"
        ;;
    *)
        echo "Usage: $0 [check|launch|errors|save|crash]"
        echo ""
        echo "Commands:"
        echo "  check  - Check if device is connected"
        echo "  launch - Monitor app launch in real-time"
        echo "  errors - Show only error messages"
        echo "  save   - Save all logs to timestamped file"
        echo "  crash  - Look for crash-specific logs"
        echo ""
        echo "📖 For full guide, see ANDROID_DEBUG_GUIDE.md"
        ;;
esac
