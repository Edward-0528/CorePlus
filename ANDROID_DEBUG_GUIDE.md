# Core+ Android Debug Guide with ADB

## 🔧 **ADB Setup & Connection:**

### 1. Enable Developer Options on Your Phone:
- Go to Settings → About Phone
- Tap "Build Number" 7 times
- Go back to Settings → Developer Options
- Enable "USB Debugging"

### 2. Connect Your Phone:
```bash
# Check if device is connected
adb devices

# If no devices shown, try:
adb kill-server
adb start-server
adb devices
```

## 📱 **Core+ Specific Debug Commands:**

### **Filter for Core+ App Logs:**
```bash
# Filter by package name (most useful)
adb logcat | grep -i "com.coreplus.app"

# Filter by app name
adb logcat | grep -i "core"

# Filter for errors only
adb logcat | grep -E "(ERROR|FATAL)"

# Filter for Core+ errors specifically
adb logcat | grep -E "(com.coreplus.app|core)" | grep -E "(ERROR|FATAL|CRASH)"
```

### **Track App Launch Issues:**
```bash
# Clear logs and track from launch
adb logcat -c && adb logcat | grep -i "com.coreplus.app"

# Monitor React Native/Expo specific logs
adb logcat | grep -E "(ReactNative|Expo|Hermes|JSC)"

# Monitor RevenueCat issues
adb logcat | grep -i "revenuecat"

# Monitor Firebase/Google Services issues
adb logcat | grep -E "(Firebase|GoogleService)"
```

### **Critical Error Patterns to Watch For:**

1. **App Launch Crashes:**
```bash
adb logcat | grep -E "(FATAL|AndroidRuntime|Process.*died)"
```

2. **JavaScript/React Native Errors:**
```bash
adb logcat | grep -E "(RedBox|JSCrash|ReferenceError|TypeError)"
```

3. **Native Module Issues:**
```bash
adb logcat | grep -E "(JNI|native|module)"
```

## 🎯 **Debugging Your Beta App:**

### **Real-time Monitoring:**
```bash
# Start monitoring before launching app
adb logcat -c  # Clear existing logs
adb logcat | grep -i "com.coreplus.app"
# Now launch your app and watch for errors
```

### **Save Logs to File:**
```bash
# Save all Core+ logs to file
adb logcat | grep -i "com.coreplus.app" > coreplus_debug.log

# Save crash logs specifically
adb logcat | grep -E "(FATAL|ERROR)" > coreplus_crashes.log
```

### **Common Issues We Fixed & Their Log Signatures:**

1. **Google Services Missing:**
```
Look for: "FirebaseApp initialization failed"
Solution: We added minimal google-services.json
```

2. **RevenueCat Errors:**
```
Look for: "There is no singleton instance"
Solution: We added setAttributes method
```

3. **Console Statement Crashes:**
```
Look for: "console is not defined" or similar
Solution: We added productionSafe.js wrapper
```

## 🚀 **Step-by-Step Beta Testing:**

### **1. Before Testing:**
```bash
# Start monitoring
adb devices
adb logcat -c
adb logcat | grep -i "com.coreplus.app" | tee coreplus_test.log
```

### **2. Test These Critical Flows:**
- App launch (watch for immediate crashes)
- Login/signup process  
- Navigation between tabs
- Camera/food scanning
- Subscription flow

### **3. After Testing:**
```bash
# Stop logging (Ctrl+C)
# Review the log file
cat coreplus_test.log | grep -E "(ERROR|FATAL|CRASH)"
```

## 📊 **Analyzing the Logs:**

### **Success Indicators:**
- App launches without FATAL errors
- No "Process died" messages
- React Native bundle loads successfully

### **Red Flags:**
- FATAL EXCEPTION
- Process com.coreplus.app (pid XXXX) has died
- ANR (Application Not Responding)
- OutOfMemoryError

## 🆘 **If You Find Issues:**

Share these specific log snippets:
1. The FATAL exception stack trace
2. Any ERROR messages right before crash
3. The time when crash occurred

Example useful log format:
```
2025-09-07 17:30:15.123  1234  1234 E AndroidRuntime: FATAL EXCEPTION: main
Process: com.coreplus.app, PID: 1234
java.lang.RuntimeException: Unable to start activity
...
```
