import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../../contexts/AppContext';
import { biometricService } from '../../../biometricService';
import quickLoginService from '../../../services/quickLoginService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AuthScreen = memo(({ 
  // General props
  loading,
  styles,
  currentRoute, // NEW: The route from App.js ('Landing', 'Login', 'SignUp')
  // Landing props
  onGetStarted,
  // Login props  
  onLogin,
  onBiometricLogin,
  // SignUp props
  onSignUp,
  genderOptions,
  onGenderSelect,
  // Social auth
  onSocialLogin
}) => {
  const { formData, updateFormData } = useAppContext();
  
  // Auth screen state management - initialize based on currentRoute
  const getInitialView = () => {
    switch (currentRoute) {
      case 'Login': return 'login';
      case 'SignUp': return 'signup';
      case 'Landing':
      default: return 'landing';
    }
  };
  
  const [currentView, setCurrentView] = useState(getInitialView());
  const [termsAccepted, setTermsAccepted] = useState(true);
  
  // Video state
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);
  
  // Form states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Biometric state
  const [biometricInfo, setBiometricInfo] = useState({
    isAvailable: false,
    isEnabled: false,
    biometricType: 'Biometric'
  });

  useEffect(() => {
    // Configure video to loop and play automatically
    if (videoRef.current) {
      videoRef.current.setIsLoopingAsync(true);
      videoRef.current.playAsync().catch(console.warn);
    }
    
    // Check biometric availability and load saved email
    checkBiometricStatus();
    loadSavedEmail();
  }, []);
  
  // Update currentView when route changes from App.js
  useEffect(() => {
    let newView;
    switch (currentRoute) {
      case 'Login': newView = 'login'; break;
      case 'SignUp': newView = 'signup'; break;
      case 'Landing':
      default: newView = 'landing'; break;
    }
    setCurrentView(newView);
  }, [currentRoute]);
  
  const loadSavedEmail = async () => {
    try {
      const loginPrefs = await quickLoginService.getLoginPreferences();
      if (loginPrefs.savedEmail) {
        // Auto-fill saved email in login form
        updateFormData('email', loginPrefs.savedEmail);
      }
    } catch (error) {
      console.log('No saved email found');
    }
  };

  const handleVideoLoad = () => {
    console.log('✨ Auth screen video background loaded');
    setVideoLoaded(true);
  };

  const checkBiometricStatus = async () => {
    try {
      const info = await biometricService.getBiometricInfo();
      setBiometricInfo(info);
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  // Navigation handlers
  const handleGetStarted = () => {
    if (termsAccepted) {
      // Show login screen when user clicks "Get Started"
      setCurrentView('login');
    }
  };

  const handleSignUpRedirect = () => {
    // Show signup form within the same component
    setCurrentView('signup');
  };

  const showLogin = () => setCurrentView('login');
  const showSignUp = () => setCurrentView('signup');
  const showLanding = () => setCurrentView('landing');

  // Form handlers
  const handleEmailChange = useCallback((text) => {
    updateFormData({ email: text });
  }, [updateFormData]);

  const handlePasswordChange = useCallback((text) => {
    updateFormData({ password: text });
  }, [updateFormData]);

  const handleNameChange = useCallback((text) => {
    updateFormData({ firstName: text });
  }, [updateFormData]);

  const handleBiometricLogin = async () => {
    try {
      if (onBiometricLogin) {
        await onBiometricLogin();
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric login failed. Please try again.');
    }
  };

  // Render different content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return (
          <View style={styles.overlay}>
            <View style={styles.landingContent}>
              {/* Top Section - Hero Title */}
              <View style={styles.topSection}>
                <Text style={styles.newHeroTitle}>
                  Core<Text style={{fontWeight: 'bold'}}>+</Text>
                </Text>
                <Text style={styles.newHeroSubtitle}>
                  AI-powered fitness & nutrition tracking
                </Text>
              </View>

              {/* Bottom Section */}
              <View style={styles.bottomSection}>
                {/* Get Started Button - For Login */}
                <TouchableOpacity 
                  style={[styles.newGetStartedButton, !termsAccepted && styles.buttonDisabled]} 
                  onPress={handleGetStarted}
                  disabled={!termsAccepted}
                >
                  <Text style={styles.newGetStartedText}>Get Started</Text>
                </TouchableOpacity>

                {/* Terms and Conditions */}
                <View style={styles.termsContainer}>
                  <TouchableOpacity 
                    style={styles.checkboxContainer}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                  >
                    <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                      {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.termsText}>I agree to Terms & Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        );

      case 'login':
        return (
          <View style={styles.overlay}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.topLeftBackButton}
              onPress={showLanding}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Login Form */}
            <View style={styles.centeredFormContainer}>
              <View style={styles.loginFormContainer}>
                {/* Email Input */}
                <View style={styles.loginInputContainer}>
                  <TextInput
                    style={[
                      styles.loginInput,
                      emailFocused && styles.loginInputFocused
                    ]}
                    value={formData.email}
                    onChangeText={handleEmailChange}
                    placeholder="Email Address"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.loginInputContainer}>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={[
                        styles.loginInput,
                        passwordFocused && styles.loginInputFocused
                      ]}
                      value={formData.password}
                      onChangeText={handlePasswordChange}
                      placeholder="Password"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      secureTextEntry={!showPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="rgba(255, 255, 255, 0.6)" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Login Buttons */}
                <View style={styles.loginButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.loginPrimaryButton, loading && styles.buttonDisabled]}
                    onPress={onLogin}
                    disabled={loading}
                  >
                    <Text style={styles.loginPrimaryButtonText}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Text>
                  </TouchableOpacity>

                  {biometricInfo.isAvailable && biometricInfo.isEnabled && (
                    <TouchableOpacity 
                      style={[styles.biometricIconButton, loading && styles.buttonDisabled]}
                      onPress={handleBiometricLogin}
                      disabled={loading}
                    >
                      <Ionicons 
                        name="finger-print" 
                        size={20} 
                        color="#ffffff" 
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Social Login */}
                <View style={styles.socialLoginContainer}>
                  <View style={styles.socialButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => onSocialLogin('apple')}
                    >
                      <Ionicons name="logo-apple" size={20} color="#ffffff" />
                      <Text style={styles.socialButtonText}>Apple</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => onSocialLogin('google')}
                    >
                      <Ionicons name="logo-google" size={20} color="#ffffff" />
                      <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Switch to SignUp */}
                <TouchableOpacity onPress={handleSignUpRedirect} style={styles.switchAuthContainer}>
                  <Text style={styles.switchAuthText}>
                    Don't have an account? <Text style={styles.switchAuthLink}>Create Account</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 'signup':
        return (
          <View style={styles.overlay}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.topLeftBackButton}
              onPress={showLanding}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* SignUp Form */}
            <View style={styles.centeredFormContainer}>
              <View style={styles.loginFormContainer}>
                {/* Name Input */}
                <View style={styles.loginInputContainer}>
                  <TextInput
                    style={[
                      styles.loginInput,
                      nameFocused && styles.loginInputFocused
                    ]}
                    value={formData.firstName}
                    onChangeText={handleNameChange}
                    placeholder="Full Name"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    autoCapitalize="words"
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                </View>

                {/* Email Input */}
                <View style={styles.loginInputContainer}>
                  <TextInput
                    style={[
                      styles.loginInput,
                      emailFocused && styles.loginInputFocused
                    ]}
                    value={formData.email}
                    onChangeText={handleEmailChange}
                    placeholder="Email Address"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.loginInputContainer}>
                  <View style={{ position: 'relative' }}>
                    <TextInput
                      style={[
                        styles.loginInput,
                        passwordFocused && styles.loginInputFocused
                      ]}
                      value={formData.password}
                      onChangeText={handlePasswordChange}
                      placeholder="Password"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      secureTextEntry={!showPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="rgba(255, 255, 255, 0.6)" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SignUp Button */}
                <View style={styles.loginButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.loginPrimaryButton, loading && styles.buttonDisabled]}
                    onPress={onSignUp}
                    disabled={loading}
                  >
                    <Text style={styles.loginPrimaryButtonText}>
                      {loading ? "Creating Account..." : "Create Account"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Social Login */}
                <View style={styles.socialLoginContainer}>
                  <View style={styles.socialButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => onSocialLogin('apple')}
                    >
                      <Ionicons name="logo-apple" size={20} color="#ffffff" />
                      <Text style={styles.socialButtonText}>Apple</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => onSocialLogin('google')}
                    >
                      <Ionicons name="logo-google" size={20} color="#ffffff" />
                      <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Switch to Login */}
                <TouchableOpacity onPress={showLogin} style={styles.switchAuthContainer}>
                  <Text style={styles.switchAuthText}>
                    Already have an account? <Text style={styles.switchAuthLink}>Sign in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getGradientColors = () => {
    switch (currentView) {
      case 'landing':
        return [
          'rgba(0,0,0,0.3)',
          'rgba(0,0,0,0.4)',
          'rgba(0,0,0,0.7)',
          'rgba(0,0,0,0.9)'
        ];
      case 'login':
      case 'signup':
        return [
          'rgba(0,0,0,0.4)',
          'rgba(0,0,0,0.6)',
          'rgba(0,0,0,0.8)',
          'rgba(0,0,0,0.95)'
        ];
      default:
        return [
          'rgba(0,0,0,0.4)',
          'rgba(0,0,0,0.6)',
          'rgba(0,0,0,0.8)',
          'rgba(0,0,0,0.95)'
        ];
    }
  };

  return (
    <SafeAreaView style={styles.landingContainer}>
      {/* Single Video Background - No Flash! */}
      <Video
        ref={videoRef}
        source={require('../../../assets/workout.mp4')}
        style={styles.videoBackground}
        shouldPlay
        isLooping
        isMuted
        resizeMode="cover"
        rate={1.0}
        volume={0}
        onLoadStart={() => console.log('Auth video loading...')}
        onLoad={handleVideoLoad}
        onError={(error) => console.log('Auth video error:', error)}
        usePoster={false}
        posterSource={require('../../../assets/Athleticman.png')}
        posterStyle={styles.videoBackground}
      />
      
      {/* Dynamic Overlay */}
      <View style={[styles.videoOverlay, { opacity: videoLoaded ? 1 : 0.8 }]}>
        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradientOverlay}
          locations={[0, 0.3, 0.7, 1]}
        />
        
        {/* Dynamic Content */}
        {renderContent()}
      </View>
      
      <StatusBar style="light" />
    </SafeAreaView>
  );
});

AuthScreen.displayName = 'AuthScreen';

export default AuthScreen;
