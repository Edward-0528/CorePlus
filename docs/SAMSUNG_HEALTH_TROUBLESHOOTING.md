# Samsung Health Troubleshooting Guide

## Common Issues and Solutions

### "Permissions Denied" but No Permission Dialog Appeared

This is the most common issue. Samsung Health permissions work differently than regular Android permissions:

#### Possible Causes:
1. **Samsung Health Not Installed**: The Samsung Health app must be installed from Galaxy Store
2. **Samsung Account Not Signed In**: You must be signed into a Samsung account
3. **Testing on Emulator**: Samsung Health doesn't work on emulators
4. **Wrong Permission Strings**: Samsung Health uses specific permission strings

#### Solutions:

**For Real Device Testing:**
1. Install Samsung Health from Galaxy Store (not Play Store)
2. Open Samsung Health and complete initial setup
3. Sign in with your Samsung account
4. Grant all permissions when Samsung Health asks
5. Return to Core+ app and try again

**For Development/Testing:**
1. Use a physical Samsung device
2. Ensure you're signed into Samsung Health
3. The permission dialog will appear within Samsung Health app, not as a system dialog

**For Emulator Testing:**
- Samsung Health won't work on emulators
- The app will automatically use mock data
- This is expected behavior

### Samsung Health App Requirements

**Minimum Requirements:**
- Samsung device (Galaxy phones/tablets)
- Samsung Health app installed and updated
- Samsung account signed in
- Internet connection for initial setup

**Supported Data Types:**
- Steps (daily and historical)
- Calories burned
- Heart rate
- Exercise/Workouts
- Sleep data
- Distance walked/run

### Permission Flow

1. App calls `SamsungHealth.authorize(permissions)`
2. Samsung Health app opens automatically
3. User sees permission requests within Samsung Health
4. User grants permissions
5. Samsung Health returns to Core+ app
6. App can now access health data

### Error Messages

**"Samsung Health app is not installed"**
- Install Samsung Health from Galaxy Store
- Restart the app

**"Authorization failed"**
- Ensure you're signed into Samsung Health
- Try clearing Samsung Health cache
- Restart both apps

**"Mock data being used"**
- Normal on emulators
- Check that you're on a Samsung device for real data

### Mock Data vs Real Data

**Mock Data (Emulators/Non-Samsung devices):**
- Steps: Random values between 5000-12000
- Calories: Random values between 1800-2500
- Distance: Calculated from steps
- Updates every time you fetch data

**Real Data (Samsung devices with Samsung Health):**
- Actual data from Samsung Health
- Synced with other fitness apps
- Historical data available
- Updates based on device sensors

### Debug Steps

1. Check if you're on a Samsung device
2. Verify Samsung Health is installed and updated
3. Ensure Samsung account is signed in
4. Try requesting permissions again
5. Check the console logs for specific error messages
6. Test with mock data first to verify app functionality

### Contact Support

If you continue having issues:
1. Note your device model and Android version
2. Check Samsung Health app version
3. Try the test component to isolate the issue
4. Review console logs for specific error messages
